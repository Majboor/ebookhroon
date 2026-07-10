# Testing

This repo has two test suites, both run in CI via `.github/workflows/tests.yml`.

## Backend (pytest)

Integration + unit tests for the FastAPI API in `backend/tests/`. Each test runs
against an isolated temp data store (no repo demo data is touched) using
`fastapi.testclient.TestClient`.

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements-dev.txt
python -m pytest
```

Covers: auth (register/login/logout/session, first-user-is-admin, password
hashing), book CRUD + slug uniqueness, publish/unpublish + public listing,
view counting, page/block create/reorder/delete/duplicate with renumbering,
uploads, and owner/auth access control.

## Frontend (vitest)

Unit tests for the pure helpers in `src/lib/utils.ts` (slugs, YouTube ID
parsing, relative dates, asset-URL resolution, HTML sanitization).

```bash
npm install
npm test
```
