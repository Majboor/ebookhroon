"""Integration tests covering the book / page / block lifecycle and access control."""
from __future__ import annotations

import pytest


def create_book(client, headers, title="My First Book", author="Alice"):
    resp = client.post(
        "/books",
        headers=headers,
        json={"title": title, "authorName": author, "tags": ["draft", ""]},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()  # {"bookId", "slug"}


def test_create_book_requires_auth(client):
    resp = client.post("/books", json={"title": "X", "authorName": "Y", "tags": []})
    assert resp.status_code == 401


def test_create_book_returns_slug_and_persists(client, register):
    _, _, headers = register("alice")
    created = create_book(client, headers, title="Hello World")
    assert created["slug"] == "hello-world"

    fetched = client.get(f"/books/{created['bookId']}", headers=headers).json()
    assert fetched["title"] == "Hello World"
    assert fetched["status"] == "draft"
    assert fetched["pages"] == []
    # Empty tag strings are filtered out on create.
    assert fetched["tags"] == ["draft"]


def test_duplicate_titles_get_unique_slugs(client, register):
    _, _, headers = register("alice")
    first = create_book(client, headers, title="Same Title")
    second = create_book(client, headers, title="Same Title")
    assert first["slug"] == "same-title"
    assert second["slug"] == "same-title-1"


def test_mine_lists_only_owned_books(client, register):
    _, _, alice_h = register("alice")
    _, _, bob_h = register("bob")
    create_book(client, alice_h, title="Alice Book")

    alice_books = client.get("/books/mine", headers=alice_h).json()
    bob_books = client.get("/books/mine", headers=bob_h).json()
    assert len(alice_books) == 1
    assert bob_books == []


def test_non_owner_cannot_read_draft_book(client, register):
    _, _, alice_h = register("alice")
    _, _, bob_h = register("bob")
    created = create_book(client, alice_h)
    resp = client.get(f"/books/{created['bookId']}", headers=bob_h)
    assert resp.status_code == 403


def test_get_missing_book_returns_404(client, register):
    _, _, headers = register("alice")
    assert client.get("/books/does-not-exist", headers=headers).status_code == 404


def test_publish_unpublish_flow(client, register):
    _, _, headers = register("alice")
    created = create_book(client, headers, title="Publish Me")
    book_id = created["bookId"]

    published = client.post(f"/books/{book_id}/publish", headers=headers).json()
    assert published["status"] == "published"
    assert published["publishedAt"] is not None

    # Now visible via the public listing.
    listing = client.get("/books/published").json()
    assert any(b["id"] == book_id for b in listing)

    # And readable by slug without auth.
    by_slug = client.get(f"/books/by-slug/{created['slug']}")
    assert by_slug.status_code == 200

    unpublished = client.post(f"/books/{book_id}/unpublish", headers=headers).json()
    assert unpublished["status"] == "draft"
    assert client.get(f"/books/by-slug/{created['slug']}").status_code == 404


def test_published_listing_search_and_sort(client, register):
    _, _, headers = register("alice")
    a = create_book(client, headers, title="Python Guide", author="Ann")
    b = create_book(client, headers, title="Cooking Basics", author="Bea")
    client.post(f"/books/{a['bookId']}/publish", headers=headers)
    client.post(f"/books/{b['bookId']}/publish", headers=headers)

    hits = client.get("/books/published", params={"search": "python"}).json()
    assert [h["title"] for h in hits] == ["Python Guide"]

    limited = client.get("/books/published", params={"limit": 1}).json()
    assert len(limited) == 1


def test_view_count_increments_only_when_published(client, register):
    _, _, headers = register("alice")
    created = create_book(client, headers)
    book_id = created["bookId"]

    # Draft -> increment endpoint 404s.
    assert client.post(f"/books/{book_id}/views").status_code == 404

    client.post(f"/books/{book_id}/publish", headers=headers)
    first = client.post(f"/books/{book_id}/views").json()["viewCount"]
    second = client.post(f"/books/{book_id}/views").json()["viewCount"]
    assert (first, second) == (1, 2)


def test_update_book_fields(client, register):
    _, _, headers = register("alice")
    created = create_book(client, headers)
    resp = client.put(
        f"/books/{created['bookId']}",
        headers=headers,
        json={
            "title": "Updated Title",
            "authorName": "New Author",
            "subtitle": "A subtitle",
            "tags": ["tech"],
            "status": "published",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "Updated Title"
    assert body["subtitle"] == "A subtitle"
    assert body["status"] == "published"
    assert body["publishedAt"] is not None


def test_delete_book_cascades_pages_and_blocks(client, register):
    _, _, headers = register("alice")
    created = create_book(client, headers)
    book_id = created["bookId"]

    page = client.post("/pages", headers=headers, json={"bookId": book_id}).json()
    client.post("/blocks", headers=headers, json={"pageId": page["id"], "type": "TEXT"})

    assert client.delete(f"/books/{book_id}", headers=headers).json() == {"deleted": True}
    assert client.get(f"/books/{book_id}", headers=headers).status_code == 404


class TestPagesAndBlocks:
    @pytest.fixture()
    def book(self, client, register):
        _, _, headers = register("alice")
        created = create_book(client, headers)
        return created["bookId"], headers

    def test_add_pages_number_sequentially(self, client, book):
        book_id, headers = book
        p1 = client.post("/pages", headers=headers, json={"bookId": book_id}).json()
        p2 = client.post("/pages", headers=headers, json={"bookId": book_id}).json()
        assert p1["pageNumber"] == 1
        assert p2["pageNumber"] == 2

    def test_insert_page_after_shifts_following_pages(self, client, book):
        book_id, headers = book
        client.post("/pages", headers=headers, json={"bookId": book_id})
        client.post("/pages", headers=headers, json={"bookId": book_id})
        inserted = client.post(
            "/pages", headers=headers, json={"bookId": book_id, "afterPageNumber": 1}
        ).json()
        assert inserted["pageNumber"] == 2
        full = client.get(f"/books/{book_id}", headers=headers).json()
        assert [p["pageNumber"] for p in full["pages"]] == [1, 2, 3]

    def test_delete_page_renumbers_remaining(self, client, book):
        book_id, headers = book
        p1 = client.post("/pages", headers=headers, json={"bookId": book_id}).json()
        client.post("/pages", headers=headers, json={"bookId": book_id})
        client.delete(f"/pages/{p1['id']}", headers=headers)
        full = client.get(f"/books/{book_id}", headers=headers).json()
        assert [p["pageNumber"] for p in full["pages"]] == [1]

    def test_update_page_title(self, client, book):
        book_id, headers = book
        page = client.post("/pages", headers=headers, json={"bookId": book_id}).json()
        resp = client.patch(
            f"/pages/{page['id']}/title", headers=headers, json={"title": "Chapter One"}
        )
        assert resp.json()["title"] == "Chapter One"

    def test_reorder_pages(self, client, book):
        book_id, headers = book
        p1 = client.post("/pages", headers=headers, json={"bookId": book_id}).json()
        p2 = client.post("/pages", headers=headers, json={"bookId": book_id}).json()
        client.post(
            "/pages/reorder",
            headers=headers,
            json={"bookId": book_id, "orderedPageIds": [p2["id"], p1["id"]]},
        )
        full = client.get(f"/books/{book_id}", headers=headers).json()
        assert [p["id"] for p in full["pages"]] == [p2["id"], p1["id"]]

    def test_add_block_uses_type_default_and_orders(self, client, book):
        book_id, headers = book
        page = client.post("/pages", headers=headers, json={"bookId": book_id}).json()
        b1 = client.post(
            "/blocks", headers=headers, json={"pageId": page["id"], "type": "TEXT"}
        ).json()
        b2 = client.post(
            "/blocks", headers=headers, json={"pageId": page["id"], "type": "HEADING"}
        ).json()
        assert b1["order"] == 0 and b2["order"] == 1
        assert b1["data"] == {"type": "TEXT", "content": "<p></p>"}
        assert b2["data"]["type"] == "HEADING"

    def test_add_block_rejects_invalid_type(self, client, book):
        book_id, headers = book
        page = client.post("/pages", headers=headers, json={"bookId": book_id}).json()
        resp = client.post(
            "/blocks", headers=headers, json={"pageId": page["id"], "type": "BOGUS"}
        )
        assert resp.status_code == 422

    def test_update_block_data(self, client, book):
        book_id, headers = book
        page = client.post("/pages", headers=headers, json={"bookId": book_id}).json()
        block = client.post(
            "/blocks", headers=headers, json={"pageId": page["id"], "type": "TEXT"}
        ).json()
        resp = client.patch(
            f"/blocks/{block['id']}",
            headers=headers,
            json={"data": {"type": "TEXT", "content": "<p>Hello</p>"}},
        )
        assert resp.json()["data"]["content"] == "<p>Hello</p>"

    def test_delete_block_renumbers_order(self, client, book):
        book_id, headers = book
        page = client.post("/pages", headers=headers, json={"bookId": book_id}).json()
        b1 = client.post(
            "/blocks", headers=headers, json={"pageId": page["id"], "type": "TEXT"}
        ).json()
        client.post("/blocks", headers=headers, json={"pageId": page["id"], "type": "QUOTE"})
        client.delete(f"/blocks/{b1['id']}", headers=headers)
        full = client.get(f"/books/{book_id}", headers=headers).json()
        remaining = full["pages"][0]["blocks"]
        assert len(remaining) == 1 and remaining[0]["order"] == 0

    def test_duplicate_page_copies_blocks(self, client, book):
        book_id, headers = book
        page = client.post("/pages", headers=headers, json={"bookId": book_id}).json()
        client.post("/blocks", headers=headers, json={"pageId": page["id"], "type": "TEXT"})
        dup = client.post(f"/pages/{page['id']}/duplicate", headers=headers).json()
        assert dup["id"] != page["id"]
        assert len(dup["blocks"]) == 1
        assert dup["pageNumber"] == page["pageNumber"] + 1

    def test_non_owner_cannot_add_page(self, client, book, register):
        book_id, _ = book
        _, _, mallory_h = register("mallory")
        resp = client.post("/pages", headers=mallory_h, json={"bookId": book_id})
        assert resp.status_code == 403


def test_upload_requires_auth(client):
    assert client.post("/upload", files={"file": ("x.png", b"data", "image/png")}).status_code == 401


def test_upload_rejects_non_image(client, register):
    _, _, headers = register("alice")
    resp = client.post(
        "/upload", headers=headers, files={"file": ("x.txt", b"data", "text/plain")}
    )
    assert resp.status_code == 400


def test_upload_stores_image_and_returns_url(client, register):
    _, _, headers = register("alice")
    resp = client.post(
        "/upload",
        headers=headers,
        files={"file": ("pic.png", b"\x89PNG binary", "image/png")},
    )
    assert resp.status_code == 200
    assert "/uploads/" in resp.json()["url"]
