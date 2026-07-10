"""Unit tests for the pure helper functions in backend.main."""
from __future__ import annotations

import backend.main as main


class TestSlugify:
    def test_lowercases_and_hyphenates(self):
        assert main.slugify_title("Hello World") == "hello-world"

    def test_strips_punctuation_and_collapses_separators(self):
        assert main.slugify_title("  A, B & C!! ") == "a-b-c"

    def test_empty_falls_back_to_book(self):
        assert main.slugify_title("!!!") == "book"
        assert main.slugify_title("") == "book"


class TestUniqueSlug:
    def test_returns_base_when_free(self):
        assert main.make_unique_slug("My Book", []) == "my-book"

    def test_appends_counter_on_collision(self):
        existing = ["my-book"]
        assert main.make_unique_slug("My Book", existing) == "my-book-1"

    def test_skips_taken_counters(self):
        existing = ["my-book", "my-book-1", "my-book-2"]
        assert main.make_unique_slug("My Book", existing) == "my-book-3"


class TestPasswordHashing:
    def test_hash_is_salted_and_verifies(self):
        stored = main.hash_password("hunter2")
        assert stored.startswith("pbkdf2_sha256$")
        assert main.verify_password("hunter2", stored) is True

    def test_wrong_password_rejected(self):
        stored = main.hash_password("hunter2")
        assert main.verify_password("nope", stored) is False

    def test_distinct_salts_produce_distinct_hashes(self):
        assert main.hash_password("same") != main.hash_password("same")

    def test_legacy_plaintext_fallback(self):
        # Records that predate hashing are compared as plaintext.
        assert main.verify_password("plainpw", "plainpw") is True
        assert main.verify_password("plainpw", "other") is False

    def test_empty_stored_rejects(self):
        assert main.verify_password("anything", "") is False

    def test_corrupt_hash_rejected_gracefully(self):
        assert main.verify_password("x", "pbkdf2_sha256$broken") is False


class TestNormalizeEmail:
    def test_trims_and_lowercases(self):
        assert main.normalize_email("  Foo@Bar.COM ") == "foo@bar.com"


class TestBlockDefaults:
    def test_text_default(self):
        assert main.get_default_block_data("TEXT") == {"type": "TEXT", "content": "<p></p>"}

    def test_heading_default(self):
        data = main.get_default_block_data("HEADING")
        assert data["type"] == "HEADING" and data["level"] == 2

    def test_unknown_falls_back_to_divider(self):
        assert main.get_default_block_data("WHATEVER")["type"] == "DIVIDER"


class TestNowIso:
    def test_ends_with_z(self):
        assert main.now_iso().endswith("Z")
