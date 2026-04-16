from __future__ import annotations

import json
import os
import re
import secrets
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal
from urllib.parse import urljoin

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
UPLOADS_DIR = ROOT_DIR / "public" / "uploads"

BOOKS_JSON_PATH = DATA_DIR / "books.json"
PAGES_JSON_PATH = DATA_DIR / "pages.json"
BLOCKS_JSON_PATH = DATA_DIR / "blocks.json"

BOOKS_CSV_PATH = DATA_DIR / "books.csv"
PAGES_CSV_PATH = DATA_DIR / "pages.csv"
BLOCKS_CSV_PATH = DATA_DIR / "blocks.csv"
USERS_CSV_PATH = DATA_DIR / "users.csv"
SESSIONS_CSV_PATH = DATA_DIR / "sessions.csv"

SESSION_HEADER_NAME = "x-session-token"

BOOK_COLUMNS = [
    "id",
    "ownerId",
    "title",
    "subtitle",
    "description",
    "slug",
    "coverImage",
    "authorName",
    "status",
    "viewCount",
    "tags",
    "category",
    "publishedAt",
    "createdAt",
    "updatedAt",
]

USER_COLUMNS = [
    "id",
    "username",
    "email",
    "password",
    "role",
    "createdAt",
    "updatedAt",
]

SESSION_COLUMNS = [
    "token",
    "userId",
    "createdAt",
    "updatedAt",
]

PAGE_COLUMNS = [
    "id",
    "bookId",
    "pageNumber",
    "title",
    "createdAt",
    "updatedAt",
]

BLOCK_COLUMNS = [
    "id",
    "pageId",
    "type",
    "order",
    "data",
    "createdAt",
    "updatedAt",
]

DB_LOCK = threading.Lock()

app = FastAPI(title="Folio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR, check_dir=False), name="uploads")


class RegisterPayload(BaseModel):
    username: str = Field(min_length=3, max_length=40)
    email: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=3, max_length=120)


class LoginPayload(BaseModel):
    identifier: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=120)


class CreateBookPayload(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    subtitle: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    authorName: str = Field(min_length=1, max_length=80)
    coverImage: str | None = None
    category: str | None = None
    tags: list[str] = Field(default_factory=list)


class UpdateBookPayload(CreateBookPayload):
    status: Literal["draft", "published"] | None = None


class AddPagePayload(BaseModel):
    bookId: str
    afterPageNumber: int | None = None


class ReorderPagesPayload(BaseModel):
    bookId: str
    orderedPageIds: list[str]


class UpdatePageTitlePayload(BaseModel):
    title: str


class AddBlockPayload(BaseModel):
    pageId: str
    type: Literal["TEXT", "IMAGE", "YOUTUBE", "QUOTE", "DIVIDER", "HEADING"]
    afterOrder: int | None = None


class UpdateBlockPayload(BaseModel):
    data: dict[str, Any]


class ReorderBlocksPayload(BaseModel):
    pageId: str
    orderedBlockIds: list[str]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def normalize_email(value: str) -> str:
    return value.strip().lower()


def get_upload_public_base_url(request: Request) -> str:
    configured_base = (
        os.getenv("UPLOAD_PUBLIC_BASE_URL")
        or os.getenv("PUBLIC_UPLOAD_BASE_URL")
        or os.getenv("NEXT_PUBLIC_UPLOAD_PUBLIC_BASE_URL")
        or os.getenv("NEXT_PUBLIC_FASTAPI_BASE_URL")
        or os.getenv("FASTAPI_BASE_URL")
    )
    if configured_base:
        return configured_base.rstrip("/")

    forwarded_host = request.headers.get("x-forwarded-host")
    if forwarded_host:
        forwarded_proto = request.headers.get("x-forwarded-proto", request.url.scheme)
        return f"{forwarded_proto}://{forwarded_host}".rstrip("/")

    return str(request.base_url).rstrip("/")


def generate_id() -> str:
    return str(uuid.uuid4())


def slugify_title(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "book"


def make_unique_slug(base: str, existing_slugs: list[str]) -> str:
    slug = slugify_title(base)
    if slug not in existing_slugs:
        return slug

    counter = 1
    while f"{slug}-{counter}" in existing_slugs:
        counter += 1
    return f"{slug}-{counter}"


def normalize_optional(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and pd.isna(value):
        return ""
    return str(value)


def parse_optional(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, float) and pd.isna(value):
        return None
    value_str = str(value)
    return value_str if value_str else None


def write_csv(path: Path, dataframe: pd.DataFrame, columns: list[str]) -> None:
    normalized = dataframe.copy()
    for column in columns:
        if column not in normalized.columns:
            normalized[column] = ""
    normalized = normalized[columns]
    normalized.to_csv(path, index=False)


def load_json(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    raw = path.read_text(encoding="utf-8").strip()
    if not raw:
        return []
    return json.loads(raw)


def bootstrap_csv(path: Path, columns: list[str], rows: list[dict[str, Any]]) -> None:
    dataframe = pd.DataFrame(rows, columns=columns)
    write_csv(path, dataframe, columns)


def ensure_storage() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    if not BOOKS_CSV_PATH.exists():
        json_rows = load_json(BOOKS_JSON_PATH)
        book_rows = [
            {
                "id": row.get("id", generate_id()),
                "ownerId": normalize_optional(row.get("ownerId")),
                "title": row.get("title", ""),
                "subtitle": normalize_optional(row.get("subtitle")),
                "description": normalize_optional(row.get("description")),
                "slug": row.get("slug", ""),
                "coverImage": normalize_optional(row.get("coverImage")),
                "authorName": row.get("authorName", ""),
                "status": row.get("status", "draft"),
                "viewCount": int(row.get("viewCount", 0)),
                "tags": json.dumps(row.get("tags", [])),
                "category": normalize_optional(row.get("category")),
                "publishedAt": normalize_optional(row.get("publishedAt")),
                "createdAt": row.get("createdAt", now_iso()),
                "updatedAt": row.get("updatedAt", now_iso()),
            }
            for row in json_rows
        ]
        bootstrap_csv(BOOKS_CSV_PATH, BOOK_COLUMNS, book_rows)

    if not USERS_CSV_PATH.exists():
        bootstrap_csv(USERS_CSV_PATH, USER_COLUMNS, [])

    if not SESSIONS_CSV_PATH.exists():
        bootstrap_csv(SESSIONS_CSV_PATH, SESSION_COLUMNS, [])

    if not PAGES_CSV_PATH.exists():
        json_rows = load_json(PAGES_JSON_PATH)
        page_rows = [
            {
                "id": row.get("id", generate_id()),
                "bookId": row.get("bookId", ""),
                "pageNumber": int(row.get("pageNumber", 0)),
                "title": normalize_optional(row.get("title")),
                "createdAt": row.get("createdAt", now_iso()),
                "updatedAt": row.get("updatedAt", now_iso()),
            }
            for row in json_rows
        ]
        bootstrap_csv(PAGES_CSV_PATH, PAGE_COLUMNS, page_rows)

    if not BLOCKS_CSV_PATH.exists():
        json_rows = load_json(BLOCKS_JSON_PATH)
        block_rows = [
            {
                "id": row.get("id", generate_id()),
                "pageId": row.get("pageId", ""),
                "type": row.get("type", "TEXT"),
                "order": int(row.get("order", 0)),
                "data": json.dumps(row.get("data", {})),
                "createdAt": row.get("createdAt", now_iso()),
                "updatedAt": row.get("updatedAt", now_iso()),
            }
            for row in json_rows
        ]
        bootstrap_csv(BLOCKS_CSV_PATH, BLOCK_COLUMNS, block_rows)


def read_books_df() -> pd.DataFrame:
    ensure_storage()
    dataframe = pd.read_csv(BOOKS_CSV_PATH, dtype=str, keep_default_na=False)
    for column in BOOK_COLUMNS:
        if column not in dataframe.columns:
            dataframe[column] = ""
    dataframe["viewCount"] = (
        pd.to_numeric(dataframe["viewCount"], errors="coerce").fillna(0).astype(int)
    )
    return dataframe[BOOK_COLUMNS]


def read_pages_df() -> pd.DataFrame:
    ensure_storage()
    dataframe = pd.read_csv(PAGES_CSV_PATH, dtype=str, keep_default_na=False)
    for column in PAGE_COLUMNS:
        if column not in dataframe.columns:
            dataframe[column] = ""
    dataframe["pageNumber"] = (
        pd.to_numeric(dataframe["pageNumber"], errors="coerce").fillna(0).astype(int)
    )
    return dataframe[PAGE_COLUMNS]


def read_blocks_df() -> pd.DataFrame:
    ensure_storage()
    dataframe = pd.read_csv(BLOCKS_CSV_PATH, dtype=str, keep_default_na=False)
    for column in BLOCK_COLUMNS:
        if column not in dataframe.columns:
            dataframe[column] = ""
    dataframe["order"] = pd.to_numeric(dataframe["order"], errors="coerce").fillna(0).astype(int)
    return dataframe[BLOCK_COLUMNS]


def read_users_df() -> pd.DataFrame:
    ensure_storage()
    dataframe = pd.read_csv(USERS_CSV_PATH, dtype=str, keep_default_na=False)
    for column in USER_COLUMNS:
        if column not in dataframe.columns:
            dataframe[column] = ""
    return dataframe[USER_COLUMNS]


def read_sessions_df() -> pd.DataFrame:
    ensure_storage()
    dataframe = pd.read_csv(SESSIONS_CSV_PATH, dtype=str, keep_default_na=False)
    for column in SESSION_COLUMNS:
        if column not in dataframe.columns:
            dataframe[column] = ""
    return dataframe[SESSION_COLUMNS]


def write_books_df(dataframe: pd.DataFrame) -> None:
    write_csv(BOOKS_CSV_PATH, dataframe, BOOK_COLUMNS)


def write_pages_df(dataframe: pd.DataFrame) -> None:
    write_csv(PAGES_CSV_PATH, dataframe, PAGE_COLUMNS)


def write_blocks_df(dataframe: pd.DataFrame) -> None:
    write_csv(BLOCKS_CSV_PATH, dataframe, BLOCK_COLUMNS)


def write_users_df(dataframe: pd.DataFrame) -> None:
    write_csv(USERS_CSV_PATH, dataframe, USER_COLUMNS)


def write_sessions_df(dataframe: pd.DataFrame) -> None:
    write_csv(SESSIONS_CSV_PATH, dataframe, SESSION_COLUMNS)


def serialize_user(row: pd.Series) -> dict[str, Any]:
    return {
        "id": row["id"],
        "username": row["username"],
        "email": row["email"],
        "role": row["role"] or "user",
        "createdAt": row["createdAt"],
        "updatedAt": row["updatedAt"],
    }


def serialize_book(row: pd.Series) -> dict[str, Any]:
    return {
        "id": row["id"],
        "ownerId": parse_optional(row["ownerId"]),
        "title": row["title"],
        "subtitle": parse_optional(row["subtitle"]),
        "description": parse_optional(row["description"]),
        "slug": row["slug"],
        "coverImage": parse_optional(row["coverImage"]),
        "authorName": row["authorName"],
        "status": row["status"],
        "viewCount": int(row["viewCount"]),
        "tags": json.loads(row["tags"] or "[]"),
        "category": parse_optional(row["category"]),
        "publishedAt": parse_optional(row["publishedAt"]),
        "createdAt": row["createdAt"],
        "updatedAt": row["updatedAt"],
    }


def serialize_page(row: pd.Series) -> dict[str, Any]:
    return {
        "id": row["id"],
        "bookId": row["bookId"],
        "pageNumber": int(row["pageNumber"]),
        "title": parse_optional(row["title"]),
        "createdAt": row["createdAt"],
        "updatedAt": row["updatedAt"],
    }


def serialize_block(row: pd.Series) -> dict[str, Any]:
    return {
        "id": row["id"],
        "pageId": row["pageId"],
        "type": row["type"],
        "order": int(row["order"]),
        "data": json.loads(row["data"] or "{}"),
        "createdAt": row["createdAt"],
        "updatedAt": row["updatedAt"],
    }


def get_default_block_data(block_type: str) -> dict[str, Any]:
    if block_type == "TEXT":
        return {"type": "TEXT", "content": "<p></p>"}
    if block_type == "HEADING":
        return {"type": "HEADING", "content": "Heading", "level": 2}
    if block_type == "IMAGE":
        return {"type": "IMAGE", "url": "", "alt": ""}
    if block_type == "YOUTUBE":
        return {"type": "YOUTUBE", "videoId": "", "url": ""}
    if block_type == "QUOTE":
        return {"type": "QUOTE", "content": ""}
    return {"type": "DIVIDER", "style": "solid"}


def assemble_book_with_pages(book_row: pd.Series, pages_df: pd.DataFrame, blocks_df: pd.DataFrame) -> dict[str, Any]:
    book = serialize_book(book_row)
    page_rows = pages_df[pages_df["bookId"] == book["id"]].sort_values("pageNumber")
    pages: list[dict[str, Any]] = []
    for _, page_row in page_rows.iterrows():
        page = serialize_page(page_row)
        block_rows = blocks_df[blocks_df["pageId"] == page["id"]].sort_values("order")
        page["blocks"] = [serialize_block(block_row) for _, block_row in block_rows.iterrows()]
        pages.append(page)
    book["pages"] = pages
    return book


def get_book_row_by_id(books_df: pd.DataFrame, book_id: str) -> pd.Series | None:
    matches = books_df[books_df["id"] == book_id]
    if matches.empty:
        return None
    return matches.iloc[0]


def get_page_row_by_id(pages_df: pd.DataFrame, page_id: str) -> pd.Series | None:
    matches = pages_df[pages_df["id"] == page_id]
    if matches.empty:
        return None
    return matches.iloc[0]


def get_block_row_by_id(blocks_df: pd.DataFrame, block_id: str) -> pd.Series | None:
    matches = blocks_df[blocks_df["id"] == block_id]
    if matches.empty:
        return None
    return matches.iloc[0]


def get_user_row_by_id(users_df: pd.DataFrame, user_id: str) -> pd.Series | None:
    matches = users_df[users_df["id"] == user_id]
    if matches.empty:
        return None
    return matches.iloc[0]


def get_user_row_by_identifier(users_df: pd.DataFrame, identifier: str) -> pd.Series | None:
    normalized_identifier = normalize_email(identifier)
    matches = users_df[
        (users_df["email"].str.lower() == normalized_identifier)
        | (users_df["username"].str.lower() == normalized_identifier)
    ]
    if matches.empty:
        return None
    return matches.iloc[0]


def get_session_token_from_request(request: Request) -> str | None:
    token = request.headers.get(SESSION_HEADER_NAME) or request.cookies.get("folio_session")
    if token:
        return token.strip()
    return None


def get_current_user_row(request: Request) -> pd.Series | None:
    session_token = get_session_token_from_request(request)
    if not session_token:
        return None

    users_df = read_users_df()
    sessions_df = read_sessions_df()
    matches = sessions_df[sessions_df["token"] == session_token]
    if matches.empty:
        return None

    session_row = matches.iloc[0]
    return get_user_row_by_id(users_df, session_row["userId"])


def require_authenticated_user(request: Request) -> pd.Series:
    user_row = get_current_user_row(request)
    if user_row is None:
        raise HTTPException(status_code=401, detail="Please sign in to continue")
    return user_row


def user_is_admin(user_row: pd.Series | None) -> bool:
    if user_row is None:
        return False
    return (user_row.get("role") or "user") == "admin"


def can_manage_book(user_row: pd.Series | None, book_row: pd.Series) -> bool:
    if user_row is None:
        return False
    if user_is_admin(user_row):
        return True
    return book_row.get("ownerId", "") == user_row["id"]


def ensure_book_owner(request: Request, book_row: pd.Series) -> pd.Series:
    user_row = require_authenticated_user(request)
    if not can_manage_book(user_row, book_row):
        raise HTTPException(status_code=403, detail="You do not have access to this flipbook")
    return user_row


def ensure_page_owner(request: Request, pages_df: pd.DataFrame, page_id: str) -> tuple[pd.Series, pd.Series]:
    page_row = get_page_row_by_id(pages_df, page_id)
    if page_row is None:
        raise HTTPException(status_code=404, detail="Page not found")

    books_df = read_books_df()
    book_row = get_book_row_by_id(books_df, page_row["bookId"])
    if book_row is None:
        raise HTTPException(status_code=404, detail="Book not found")

    ensure_book_owner(request, book_row)
    return page_row, book_row


def ensure_block_owner(request: Request, blocks_df: pd.DataFrame, block_id: str) -> tuple[pd.Series, pd.Series, pd.Series]:
    block_row = get_block_row_by_id(blocks_df, block_id)
    if block_row is None:
        raise HTTPException(status_code=404, detail="Block not found")

    pages_df = read_pages_df()
    page_row = get_page_row_by_id(pages_df, block_row["pageId"])
    if page_row is None:
        raise HTTPException(status_code=404, detail="Page not found")

    books_df = read_books_df()
    book_row = get_book_row_by_id(books_df, page_row["bookId"])
    if book_row is None:
        raise HTTPException(status_code=404, detail="Book not found")

    ensure_book_owner(request, book_row)
    return block_row, page_row, book_row


@app.on_event("startup")
def on_startup() -> None:
    ensure_storage()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/register")
def register_user(payload: RegisterPayload) -> dict[str, Any]:
    username = payload.username.strip()
    email = normalize_email(payload.email)
    password = payload.password.strip()

    if not username:
        raise HTTPException(status_code=400, detail="Username is required")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    if not password:
        raise HTTPException(status_code=400, detail="Password is required")

    with DB_LOCK:
        users_df = read_users_df()
        sessions_df = read_sessions_df()

        username_match = users_df[users_df["username"].str.lower() == username.lower()]
        if not username_match.empty:
            raise HTTPException(status_code=400, detail="That username is already taken")

        email_match = users_df[users_df["email"].str.lower() == email]
        if not email_match.empty:
            raise HTTPException(status_code=400, detail="That email is already in use")

        current_time = now_iso()
        role = "admin" if users_df.empty else "user"
        user_row = pd.DataFrame(
            [
                {
                    "id": generate_id(),
                    "username": username,
                    "email": email,
                    "password": password,
                    "role": role,
                    "createdAt": current_time,
                    "updatedAt": current_time,
                }
            ],
            columns=USER_COLUMNS,
        )
        users_df = pd.concat([users_df, user_row], ignore_index=True)
        write_users_df(users_df)

        session_row = pd.DataFrame(
            [
                {
                    "token": secrets.token_urlsafe(32),
                    "userId": user_row.iloc[0]["id"],
                    "createdAt": current_time,
                    "updatedAt": current_time,
                }
            ],
            columns=SESSION_COLUMNS,
        )
        sessions_df = pd.concat([sessions_df, session_row], ignore_index=True)
        write_sessions_df(sessions_df)

    return {
        "token": session_row.iloc[0]["token"],
        "user": serialize_user(user_row.iloc[0]),
    }


@app.post("/auth/login")
def login_user(payload: LoginPayload) -> dict[str, Any]:
    identifier = payload.identifier.strip()
    password = payload.password.strip()

    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Username/email and password are required")

    with DB_LOCK:
        users_df = read_users_df()
        sessions_df = read_sessions_df()
        user_row = get_user_row_by_identifier(users_df, identifier)
        if user_row is None or user_row["password"] != password:
            raise HTTPException(status_code=401, detail="Invalid login details")

        current_time = now_iso()
        session_row = pd.DataFrame(
            [
                {
                    "token": secrets.token_urlsafe(32),
                    "userId": user_row["id"],
                    "createdAt": current_time,
                    "updatedAt": current_time,
                }
            ],
            columns=SESSION_COLUMNS,
        )
        sessions_df = pd.concat([sessions_df, session_row], ignore_index=True)
        write_sessions_df(sessions_df)

    return {
        "token": session_row.iloc[0]["token"],
        "user": serialize_user(user_row),
    }


@app.post("/auth/logout")
def logout_user(request: Request) -> dict[str, bool]:
    session_token = get_session_token_from_request(request)
    if not session_token:
        return {"loggedOut": True}

    with DB_LOCK:
        sessions_df = read_sessions_df()
        sessions_df = sessions_df[sessions_df["token"] != session_token].reset_index(drop=True)
        write_sessions_df(sessions_df)

    return {"loggedOut": True}


@app.get("/auth/me")
def get_current_user(request: Request) -> dict[str, Any]:
    user_row = require_authenticated_user(request)
    return serialize_user(user_row)


@app.get("/books/published")
def list_published_books(
    search: str | None = None,
    category: str | None = None,
    sort: Literal["newest", "popular"] = "newest",
    limit: int | None = None,
) -> list[dict[str, Any]]:
    books_df = read_books_df()
    published = books_df[books_df["status"] == "published"].copy()

    if search:
        query = search.lower()
        published = published[
            published["title"].str.lower().str.contains(query, regex=False)
            | published["authorName"].str.lower().str.contains(query, regex=False)
            | published["description"].str.lower().str.contains(query, regex=False)
        ]

    if category and category != "all":
        published = published[published["category"] == category]

    if sort == "popular":
        published = published.sort_values(["viewCount", "createdAt"], ascending=[False, False])
    else:
        published = published.sort_values("createdAt", ascending=False)

    if limit is not None:
        published = published.head(limit)

    return [serialize_book(row) for _, row in published.iterrows()]


@app.get("/books/mine")
def list_my_books(request: Request) -> list[dict[str, Any]]:
    current_user = require_authenticated_user(request)
    books_df = read_books_df()

    if user_is_admin(current_user):
        mine = books_df.copy()
    else:
        mine = books_df[books_df["ownerId"] == current_user["id"]].copy()

    mine = mine.sort_values(["updatedAt", "createdAt"], ascending=[False, False])
    return [serialize_book(row) for _, row in mine.iterrows()]


@app.get("/books/{book_id}")
def get_book_with_pages(book_id: str, request: Request) -> dict[str, Any]:
    books_df = read_books_df()
    pages_df = read_pages_df()
    blocks_df = read_blocks_df()

    book_row = get_book_row_by_id(books_df, book_id)
    if book_row is None:
        raise HTTPException(status_code=404, detail="Book not found")

    ensure_book_owner(request, book_row)
    return assemble_book_with_pages(book_row, pages_df, blocks_df)


@app.get("/books/by-slug/{slug}")
def get_book_by_slug(slug: str, request: Request) -> dict[str, Any]:
    books_df = read_books_df()
    pages_df = read_pages_df()
    blocks_df = read_blocks_df()

    matches = books_df[books_df["slug"] == slug]
    if matches.empty:
        raise HTTPException(status_code=404, detail="Book not found")

    book_row = matches.iloc[0]
    current_user = get_current_user_row(request)
    if book_row["status"] != "published" and not can_manage_book(current_user, book_row):
        raise HTTPException(status_code=404, detail="Book not found")

    return assemble_book_with_pages(book_row, pages_df, blocks_df)


@app.post("/books")
def create_book(payload: CreateBookPayload, request: Request) -> dict[str, str]:
    current_user = require_authenticated_user(request)

    with DB_LOCK:
        books_df = read_books_df()
        slug = make_unique_slug(payload.title, books_df["slug"].tolist())
        current_time = now_iso()

        book_row = pd.DataFrame(
            [
                {
                    "id": generate_id(),
                    "ownerId": current_user["id"],
                    "title": payload.title,
                    "subtitle": normalize_optional(payload.subtitle),
                    "description": normalize_optional(payload.description),
                    "slug": slug,
                    "coverImage": normalize_optional(payload.coverImage),
                    "authorName": payload.authorName,
                    "status": "draft",
                    "viewCount": 0,
                    "tags": json.dumps([tag for tag in payload.tags if tag]),
                    "category": normalize_optional(payload.category),
                    "publishedAt": "",
                    "createdAt": current_time,
                    "updatedAt": current_time,
                }
            ],
            columns=BOOK_COLUMNS,
        )

        books_df = pd.concat([books_df, book_row], ignore_index=True)
        write_books_df(books_df)
        book_id = book_row.iloc[0]["id"]

    return {"bookId": book_id, "slug": slug}


@app.put("/books/{book_id}")
def update_book(book_id: str, payload: UpdateBookPayload, request: Request) -> dict[str, Any]:
    with DB_LOCK:
        books_df = read_books_df()
        matches = books_df[books_df["id"] == book_id]
        if matches.empty:
            raise HTTPException(status_code=404, detail="Book not found")

        index = matches.index[0]
        existing = books_df.loc[index]
        ensure_book_owner(request, existing)
        current_time = now_iso()
        published_at = existing["publishedAt"]
        if payload.status == "published" and not published_at:
            published_at = current_time

        books_df.loc[index, "title"] = payload.title
        books_df.loc[index, "subtitle"] = normalize_optional(payload.subtitle)
        books_df.loc[index, "description"] = normalize_optional(payload.description)
        books_df.loc[index, "coverImage"] = normalize_optional(payload.coverImage)
        books_df.loc[index, "authorName"] = payload.authorName
        books_df.loc[index, "category"] = normalize_optional(payload.category)
        books_df.loc[index, "tags"] = json.dumps([tag for tag in payload.tags if tag])
        if payload.status:
            books_df.loc[index, "status"] = payload.status
        books_df.loc[index, "publishedAt"] = published_at
        books_df.loc[index, "updatedAt"] = current_time
        write_books_df(books_df)

        updated_row = books_df.loc[index]

    return serialize_book(updated_row)


@app.post("/books/{book_id}/publish")
def publish_book(book_id: str, request: Request) -> dict[str, Any]:
    with DB_LOCK:
        books_df = read_books_df()
        matches = books_df[books_df["id"] == book_id]
        if matches.empty:
            raise HTTPException(status_code=404, detail="Book not found")

        index = matches.index[0]
        ensure_book_owner(request, books_df.loc[index])
        current_time = now_iso()
        books_df.loc[index, "status"] = "published"
        if not books_df.loc[index, "publishedAt"]:
            books_df.loc[index, "publishedAt"] = current_time
        books_df.loc[index, "updatedAt"] = current_time
        write_books_df(books_df)
        updated_row = books_df.loc[index]

    return serialize_book(updated_row)


@app.post("/books/{book_id}/unpublish")
def unpublish_book(book_id: str, request: Request) -> dict[str, Any]:
    with DB_LOCK:
        books_df = read_books_df()
        matches = books_df[books_df["id"] == book_id]
        if matches.empty:
            raise HTTPException(status_code=404, detail="Book not found")

        index = matches.index[0]
        ensure_book_owner(request, books_df.loc[index])
        books_df.loc[index, "status"] = "draft"
        books_df.loc[index, "updatedAt"] = now_iso()
        write_books_df(books_df)
        updated_row = books_df.loc[index]

    return serialize_book(updated_row)


@app.delete("/books/{book_id}")
def delete_book(book_id: str, request: Request) -> dict[str, bool]:
    with DB_LOCK:
        books_df = read_books_df()
        pages_df = read_pages_df()
        blocks_df = read_blocks_df()

        matches = books_df[books_df["id"] == book_id]
        if matches.empty:
            raise HTTPException(status_code=404, detail="Book not found")
        ensure_book_owner(request, matches.iloc[0])

        book_page_ids = pages_df[pages_df["bookId"] == book_id]["id"].tolist()

        books_df = books_df[books_df["id"] != book_id].reset_index(drop=True)
        pages_df = pages_df[pages_df["bookId"] != book_id].reset_index(drop=True)
        if book_page_ids:
            blocks_df = blocks_df[~blocks_df["pageId"].isin(book_page_ids)].reset_index(drop=True)

        write_books_df(books_df)
        write_pages_df(pages_df)
        write_blocks_df(blocks_df)

    return {"deleted": True}


@app.post("/books/{book_id}/views")
def increment_book_views(book_id: str) -> dict[str, int]:
    with DB_LOCK:
        books_df = read_books_df()
        matches = books_df[books_df["id"] == book_id]
        if matches.empty:
            raise HTTPException(status_code=404, detail="Book not found")

        index = matches.index[0]
        if books_df.loc[index, "status"] != "published":
            raise HTTPException(status_code=404, detail="Book not found")
        books_df.loc[index, "viewCount"] = int(books_df.loc[index, "viewCount"]) + 1
        write_books_df(books_df)
        view_count = int(books_df.loc[index, "viewCount"])

    return {"viewCount": view_count}


@app.post("/pages")
def add_page(payload: AddPagePayload, request: Request) -> dict[str, Any]:
    with DB_LOCK:
        books_df = read_books_df()
        pages_df = read_pages_df()

        book_row = get_book_row_by_id(books_df, payload.bookId)
        if book_row is None:
            raise HTTPException(status_code=404, detail="Book not found")
        ensure_book_owner(request, book_row)

        existing_pages = pages_df[pages_df["bookId"] == payload.bookId].copy()

        if payload.afterPageNumber is not None:
            mask = (pages_df["bookId"] == payload.bookId) & (
                pages_df["pageNumber"] > payload.afterPageNumber
            )
            pages_df.loc[mask, "pageNumber"] = pages_df.loc[mask, "pageNumber"] + 1
            page_number = payload.afterPageNumber + 1
        else:
            page_number = len(existing_pages.index) + 1

        current_time = now_iso()
        page_row = pd.DataFrame(
            [
                {
                    "id": generate_id(),
                    "bookId": payload.bookId,
                    "pageNumber": page_number,
                    "title": "",
                    "createdAt": current_time,
                    "updatedAt": current_time,
                }
            ],
            columns=PAGE_COLUMNS,
        )

        pages_df = pd.concat([pages_df, page_row], ignore_index=True)
        write_pages_df(pages_df)
        created_row = page_row.iloc[0]

    return serialize_page(created_row)


@app.post("/pages/{page_id}/duplicate")
def duplicate_page(page_id: str, request: Request) -> dict[str, Any]:
    with DB_LOCK:
        pages_df = read_pages_df()
        blocks_df = read_blocks_df()
        page_row, _ = ensure_page_owner(request, pages_df, page_id)

        mask = (pages_df["bookId"] == page_row["bookId"]) & (
            pages_df["pageNumber"] > int(page_row["pageNumber"])
        )
        pages_df.loc[mask, "pageNumber"] = pages_df.loc[mask, "pageNumber"] + 1

        current_time = now_iso()
        new_page_id = generate_id()
        new_page_row = pd.DataFrame(
            [
                {
                    "id": new_page_id,
                    "bookId": page_row["bookId"],
                    "pageNumber": int(page_row["pageNumber"]) + 1,
                    "title": f"{page_row['title']} (copy)" if page_row["title"] else "",
                    "createdAt": current_time,
                    "updatedAt": current_time,
                }
            ],
            columns=PAGE_COLUMNS,
        )

        original_blocks = blocks_df[blocks_df["pageId"] == page_id].sort_values("order")
        duplicated_blocks: list[dict[str, Any]] = []
        for _, block_row in original_blocks.iterrows():
            duplicated_blocks.append(
                {
                    "id": generate_id(),
                    "pageId": new_page_id,
                    "type": block_row["type"],
                    "order": int(block_row["order"]),
                    "data": block_row["data"],
                    "createdAt": current_time,
                    "updatedAt": current_time,
                }
            )

        pages_df = pd.concat([pages_df, new_page_row], ignore_index=True)
        if duplicated_blocks:
            duplicated_blocks_df = pd.DataFrame(duplicated_blocks, columns=BLOCK_COLUMNS)
            blocks_df = pd.concat([blocks_df, duplicated_blocks_df], ignore_index=True)

        write_pages_df(pages_df)
        write_blocks_df(blocks_df)

    page = serialize_page(new_page_row.iloc[0])
    page["blocks"] = [
        serialize_block(pd.Series(block_row))
        for block_row in duplicated_blocks
    ]
    return page


@app.delete("/pages/{page_id}")
def delete_page(page_id: str, request: Request) -> dict[str, str]:
    with DB_LOCK:
        pages_df = read_pages_df()
        blocks_df = read_blocks_df()
        page_row, _ = ensure_page_owner(request, pages_df, page_id)

        book_id = page_row["bookId"]
        deleted_page_number = int(page_row["pageNumber"])

        pages_df = pages_df[pages_df["id"] != page_id].reset_index(drop=True)
        blocks_df = blocks_df[blocks_df["pageId"] != page_id].reset_index(drop=True)

        mask = (pages_df["bookId"] == book_id) & (pages_df["pageNumber"] > deleted_page_number)
        pages_df.loc[mask, "pageNumber"] = pages_df.loc[mask, "pageNumber"] - 1

        write_pages_df(pages_df)
        write_blocks_df(blocks_df)

    return {"bookId": book_id}


@app.post("/pages/reorder")
def reorder_pages(payload: ReorderPagesPayload, request: Request) -> dict[str, str]:
    with DB_LOCK:
        books_df = read_books_df()
        pages_df = read_pages_df()
        book_row = get_book_row_by_id(books_df, payload.bookId)
        if book_row is None:
            raise HTTPException(status_code=404, detail="Book not found")
        ensure_book_owner(request, book_row)
        for index, page_id in enumerate(payload.orderedPageIds):
            mask = (pages_df["id"] == page_id) & (pages_df["bookId"] == payload.bookId)
            pages_df.loc[mask, "pageNumber"] = index + 1
            pages_df.loc[mask, "updatedAt"] = now_iso()
        write_pages_df(pages_df)

    return {"bookId": payload.bookId}


@app.patch("/pages/{page_id}/title")
def update_page_title(page_id: str, payload: UpdatePageTitlePayload, request: Request) -> dict[str, Any]:
    with DB_LOCK:
        pages_df = read_pages_df()
        ensure_page_owner(request, pages_df, page_id)
        matches = pages_df[pages_df["id"] == page_id]

        index = matches.index[0]
        pages_df.loc[index, "title"] = payload.title
        pages_df.loc[index, "updatedAt"] = now_iso()
        write_pages_df(pages_df)
        updated_row = pages_df.loc[index]

    return serialize_page(updated_row)


@app.post("/blocks")
def add_block(payload: AddBlockPayload, request: Request) -> dict[str, Any]:
    with DB_LOCK:
        pages_df = read_pages_df()
        blocks_df = read_blocks_df()
        ensure_page_owner(request, pages_df, payload.pageId)

        existing_blocks = blocks_df[blocks_df["pageId"] == payload.pageId]

        if payload.afterOrder is not None:
            mask = (blocks_df["pageId"] == payload.pageId) & (blocks_df["order"] > payload.afterOrder)
            blocks_df.loc[mask, "order"] = blocks_df.loc[mask, "order"] + 1
            order = payload.afterOrder + 1
        else:
            order = len(existing_blocks.index)

        current_time = now_iso()
        block_row = pd.DataFrame(
            [
                {
                    "id": generate_id(),
                    "pageId": payload.pageId,
                    "type": payload.type,
                    "order": order,
                    "data": json.dumps(get_default_block_data(payload.type)),
                    "createdAt": current_time,
                    "updatedAt": current_time,
                }
            ],
            columns=BLOCK_COLUMNS,
        )

        blocks_df = pd.concat([blocks_df, block_row], ignore_index=True)
        write_blocks_df(blocks_df)
        created_row = block_row.iloc[0]

    return serialize_block(created_row)


@app.patch("/blocks/{block_id}")
def update_block(block_id: str, payload: UpdateBlockPayload, request: Request) -> dict[str, Any]:
    with DB_LOCK:
        blocks_df = read_blocks_df()
        ensure_block_owner(request, blocks_df, block_id)
        matches = blocks_df[blocks_df["id"] == block_id]

        index = matches.index[0]
        blocks_df.loc[index, "data"] = json.dumps(payload.data)
        blocks_df.loc[index, "updatedAt"] = now_iso()
        write_blocks_df(blocks_df)
        updated_row = blocks_df.loc[index]

    return serialize_block(updated_row)


@app.delete("/blocks/{block_id}")
def delete_block(block_id: str, request: Request) -> dict[str, str]:
    with DB_LOCK:
        blocks_df = read_blocks_df()
        block_row, _, _ = ensure_block_owner(request, blocks_df, block_id)

        page_id = block_row["pageId"]
        deleted_order = int(block_row["order"])
        blocks_df = blocks_df[blocks_df["id"] != block_id].reset_index(drop=True)

        mask = (blocks_df["pageId"] == page_id) & (blocks_df["order"] > deleted_order)
        blocks_df.loc[mask, "order"] = blocks_df.loc[mask, "order"] - 1
        write_blocks_df(blocks_df)

    return {"pageId": page_id}


@app.post("/blocks/reorder")
def reorder_blocks(payload: ReorderBlocksPayload, request: Request) -> dict[str, str]:
    with DB_LOCK:
        pages_df = read_pages_df()
        blocks_df = read_blocks_df()
        ensure_page_owner(request, pages_df, payload.pageId)
        for index, block_id in enumerate(payload.orderedBlockIds):
            mask = (blocks_df["id"] == block_id) & (blocks_df["pageId"] == payload.pageId)
            blocks_df.loc[mask, "order"] = index
            blocks_df.loc[mask, "updatedAt"] = now_iso()
        write_blocks_df(blocks_df)

    return {"pageId": payload.pageId}


@app.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)) -> dict[str, str]:
    require_authenticated_user(request)
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only images are allowed")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    extension = Path(file.filename or "").suffix.lower() or ".jpg"
    filename = f"{secrets.token_hex(12)}{extension}"
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOADS_DIR / filename).write_bytes(contents)
    public_base_url = get_upload_public_base_url(request)
    return {"url": urljoin(f"{public_base_url}/", f"uploads/{filename}")}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8002, reload=True)
