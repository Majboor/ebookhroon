"""Shared pytest fixtures for the Folio backend API.

Every test runs against an isolated, empty on-disk store: the module-level
CSV/JSON path constants in ``backend.main`` are redirected to a per-test
temporary directory so tests never touch the repo's demo data and never leak
state into one another.
"""
from __future__ import annotations

from pathlib import Path
from typing import Iterator

import pytest
from fastapi.testclient import TestClient

import backend.main as main


@pytest.fixture()
def store(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Redirect all persistence paths to a fresh temp dir for one test."""
    data_dir = tmp_path / "data"
    uploads_dir = tmp_path / "uploads"
    data_dir.mkdir()
    uploads_dir.mkdir()

    monkeypatch.setattr(main, "DATA_DIR", data_dir)
    monkeypatch.setattr(main, "UPLOADS_DIR", uploads_dir)
    # JSON seeds point at non-existent files -> stores bootstrap empty.
    monkeypatch.setattr(main, "BOOKS_JSON_PATH", data_dir / "books.json")
    monkeypatch.setattr(main, "PAGES_JSON_PATH", data_dir / "pages.json")
    monkeypatch.setattr(main, "BLOCKS_JSON_PATH", data_dir / "blocks.json")
    monkeypatch.setattr(main, "BOOKS_CSV_PATH", data_dir / "books.csv")
    monkeypatch.setattr(main, "PAGES_CSV_PATH", data_dir / "pages.csv")
    monkeypatch.setattr(main, "BLOCKS_CSV_PATH", data_dir / "blocks.csv")
    monkeypatch.setattr(main, "USERS_CSV_PATH", data_dir / "users.csv")
    monkeypatch.setattr(main, "SESSIONS_CSV_PATH", data_dir / "sessions.csv")
    return tmp_path


@pytest.fixture()
def client(store: Path) -> Iterator[TestClient]:
    with TestClient(main.app) as test_client:
        yield test_client


def auth_headers(token: str) -> dict[str, str]:
    return {main.SESSION_HEADER_NAME: token}


@pytest.fixture()
def register(client: TestClient):
    """Factory that registers a user and returns (token, user, headers)."""

    def _register(username: str = "alice", email: str | None = None, password: str = "s3cret"):
        email = email or f"{username}@example.com"
        resp = client.post(
            "/auth/register",
            json={"username": username, "email": email, "password": password},
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        return body["token"], body["user"], auth_headers(body["token"])

    return _register
