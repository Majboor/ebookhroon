"""Integration tests for the authentication endpoints."""
from __future__ import annotations

from backend.tests.conftest import auth_headers


def test_health_and_root(client):
    assert client.get("/health").json() == {"status": "ok"}
    root = client.get("/").json()
    assert root["status"] == "ok" and root["name"] == "Folio API"


def test_first_user_becomes_admin(client):
    resp = client.post(
        "/auth/register",
        json={"username": "root", "email": "root@example.com", "password": "pw123"},
    )
    assert resp.status_code == 200
    assert resp.json()["user"]["role"] == "admin"


def test_second_user_is_regular_user(register):
    register("first")
    _, user, _ = register("second")
    assert user["role"] == "user"


def test_register_rejects_duplicate_username(client, register):
    register("dupe", email="a@example.com")
    resp = client.post(
        "/auth/register",
        json={"username": "dupe", "email": "b@example.com", "password": "pw123"},
    )
    assert resp.status_code == 400
    assert "username" in resp.json()["detail"].lower()


def test_register_rejects_duplicate_email(client, register):
    register("one", email="shared@example.com")
    resp = client.post(
        "/auth/register",
        json={"username": "two", "email": "shared@example.com", "password": "pw123"},
    )
    assert resp.status_code == 400
    assert "email" in resp.json()["detail"].lower()


def test_register_validation_rejects_short_username(client):
    resp = client.post(
        "/auth/register",
        json={"username": "ab", "email": "x@example.com", "password": "pw123"},
    )
    assert resp.status_code == 422


def test_login_succeeds_with_username_or_email(client, register):
    register("carol", email="carol@example.com", password="topsecret")

    by_username = client.post(
        "/auth/login", json={"identifier": "carol", "password": "topsecret"}
    )
    by_email = client.post(
        "/auth/login", json={"identifier": "carol@example.com", "password": "topsecret"}
    )
    assert by_username.status_code == 200
    assert by_email.status_code == 200
    assert by_username.json()["user"]["id"] == by_email.json()["user"]["id"]


def test_login_rejects_wrong_password(client, register):
    register("dave", password="rightpw")
    resp = client.post("/auth/login", json={"identifier": "dave", "password": "wrongpw"})
    assert resp.status_code == 401


def test_login_rejects_unknown_user(client):
    resp = client.post("/auth/login", json={"identifier": "ghost", "password": "x"})
    assert resp.status_code == 401


def test_me_requires_authentication(client):
    assert client.get("/auth/me").status_code == 401


def test_me_returns_current_user(client, register):
    token, user, headers = register("eve")
    resp = client.get("/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == user["id"]
    # The password hash must never be exposed.
    assert "password" not in resp.json()


def test_logout_invalidates_session(client, register):
    token, _, headers = register("frank")
    assert client.get("/auth/me", headers=headers).status_code == 200
    assert client.post("/auth/logout", headers=headers).json() == {"loggedOut": True}
    assert client.get("/auth/me", headers=headers).status_code == 401


def test_session_cookie_is_accepted(client, register):
    token, _, _ = register("grace")
    resp = client.get("/auth/me", cookies={"folio_session": token})
    assert resp.status_code == 200
