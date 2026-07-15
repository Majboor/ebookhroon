<div align="center">

# 📖 Folio

### Your stories, *beautifully* bound.

Folio turns the browser into a bookshelf. Write rich text, drop in images and
YouTube videos, arrange it into pages — and read it back as a real, 3D
page-flipping book you can share with a single link.

_A full-stack digital flipbook studio: Next.js 15 on the front, FastAPI on the back,
and not a database server in sight._

<p>
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-backend-009688?logo=fastapi&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss&logoColor=white">
  <img alt="Tests" src="https://img.shields.io/badge/tests-55%20py%20%2B%2024%20ts-2E7D32">
  <img alt="No database" src="https://img.shields.io/badge/storage-CSV%20(no%20DB)-C9A24B">
</p>

### **[📚 Read it live at ebook.techrealm.ai →](https://ebook.techrealm.ai)**

![Folio in action](docs/media/demo.gif)

_Landing → library → a real page-turning read → full-text search inside every book._

</div>

---

## ✨ What makes it cool

- **A book that actually feels like a book.** Smooth 3D page-flip animations, a
  cover, a spine shadow, page numbers — the works. Reading a Folio isn't scrolling,
  it's turning pages.
- **A proper block editor.** Rich text (powered by TipTap), headings, images with
  captions, pull-quotes, dividers, and live YouTube embeds — dragged and dropped
  into place with `@dnd-kit`.
- **Draft → publish flow.** Keep books private while you tinker, then publish when
  they're ready. Share a clean `/read/your-slug` link with the world.
- **Zero-database storage.** Everything lives in tidy CSV files under `/data`, and
  uploads land in `/public/uploads`. Clone it, run it, done — no Postgres, no Redis,
  no Docker-compose incantations.
- **Salted password hashing.** Accounts use PBKDF2-SHA256 with per-user salts.
  (Yes, even the "no database" app takes your password seriously.)
- **Editorial by default.** Playfair Display + Inter, a warm cream-and-forest
  palette, and layouts that make every book look professionally produced.

---

## 🆕 What's new in this release

Folio just got a chapter longer. Here's everything that shipped:

### 🔎 Search *inside* every book
This isn't a title search — Folio reads the **full text of every published book**
(chapters, paragraphs, pull-quotes and captions) and drops you on the exact page.
Every hit shows a highlighted snippet and an **"Open at page N →"** deep link that
jumps straight into the reader at the right spread.

<div align="center">

![Full-text search inside books](docs/media/search.png)
_Search "sea" and land on the exact line — logbook entry 41 and all._

</div>

### 🔊 Read-aloud narration
A floating **Listen** control turns any book into an audiobook using the browser's
built-in speech synthesis — no API keys, no uploads. Play / pause, skip
sentence-by-sentence, pick a voice, and tune the speed. It reads the current spread
and turns the page for you as it goes.

### 🎨 Premium UI polish
An editorial pass across the whole app: an animated aurora hero backdrop, a
shimmering gold gradient headline, scroll-reveal entrances, card-lift + sheen hover
motion, and a smarter reader progress bar that gracefully switches from dots to a
scrub bar on long books. Every bit of decorative motion respects `prefers-reduced-motion`.

### ♿ Accessibility & performance
Skip-to-content link, proper landmark regions, ARIA on the reader controls,
reduced-motion support throughout, and a lazily-loaded editor so the marketing
pages stay feather-light.

### 🧪 A real test suite + CI
**55 backend pytest** cases (auth, books, pages, blocks, helpers) and **24 frontend
vitest** cases for the shared utilities — wired into GitHub Actions so every push
gets checked. See [`TESTING.md`](TESTING.md).

### 🔭 Built to be found (SEO)
Open Graph + Twitter cards with a dynamically-rendered social image, `Book` /
`WebSite` / `Organization` JSON-LD, an auto-generated `sitemap.xml` + `robots.txt`,
canonical URLs, a favicon, and an installable PWA manifest.

### 🧪 A/B hero, one query param away
The landing page ships with two hero designs. The default (**variant A**) is the
centered editorial hero; append **`?variant=b`** for a split-layout alternative —
handy for measuring which one converts. More in [`docs/hero-ab-variant.md`](docs/hero-ab-variant.md).

<div align="center">

| Variant A (default) | Variant B (`?variant=b`) |
| :---: | :---: |
| ![Hero variant A](docs/media/home.png) | ![Hero variant B](docs/media/hero-variant-b.png) |

</div>

---

<div align="center">

![The flipbook reader](docs/media/read.png)
_The reader: a real cover, real page turns, real charm — now with a Listen button._

</div>

---

## 🧱 How it's built

Folio is two small apps that hold hands:

| Layer        | Stack                                                        | Job                                                   |
| ------------ | ----------------------------------------------------------- | ----------------------------------------------------- |
| **Frontend** | Next.js 15 (App Router, React 19), Tailwind CSS, TipTap      | The UI, the editor, the flipbook reader               |
| **Backend**  | FastAPI + pandas                                            | A tiny JSON API over CSV "tables" (books/pages/blocks)|
| **Storage**  | CSV files in `/data`, images in `/public/uploads`           | State, without a database to babysit                  |

The Next.js server components call the FastAPI backend (default `http://127.0.0.1:8002`)
for every piece of data. Auth is a simple session-token flow stored in an httpOnly cookie.

---

## 🚀 Quick start (beginner-friendly, nothing assumed)

You'll run **two** things: the Python backend and the Next.js frontend. Two terminals, two commands each. Let's go.

### 0. Prerequisites

Make sure these are installed:

- **Node.js 18.18+** (20 or 22 recommended) — check with `node -v`
- **Python 3.10+** — check with `python3 --version`
- **npm** (comes with Node) — check with `npm -v`

### 1. Grab the code

```bash
git clone https://github.com/waleedsworld/ebookhroon.git
cd ebookhroon
```

### 2. Set up your environment file

```bash
cp .env.example .env.local
```

The defaults already point the frontend at the local backend, so you don't need
to change anything to run locally.

### 3. Start the backend (Terminal 1)

```bash
# create an isolated Python environment
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# install the backend's dependencies
pip install -r backend/requirements.txt

# run the API on port 8002
python -m uvicorn backend.main:app --reload --port 8002
```

You should see `Uvicorn running on http://127.0.0.1:8002`. Visit
[http://127.0.0.1:8002/health](http://127.0.0.1:8002/health) and you'll get
`{"status":"ok"}`. Interactive API docs live at `/docs`.

### 4. Start the frontend (Terminal 2)

```bash
npm install
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and you're in. 🎉

The repo ships with a few **demo books** already seeded in `/data`, so the shelf
isn't empty on your first visit. Head to **Explore** to read them, **Search** to
dig inside them, or **Create Account → Create Your Book** to make your own.

> **Tip:** the very first account you register becomes the `admin`. After that,
> everyone else is a regular `user`.

---

## 🗺️ A tour of the app

<div align="center">

![Explore the library](docs/media/explore.png)
_The Explore shelf — browse and filter the public library._

</div>

- `/` — the landing page and freshly published books (add `?variant=b` for the alt hero)
- `/explore` — browse and filter the public library
- `/search` — full-text search across every published book
- `/read/[slug]` — the flipbook reader (with read-aloud)
- `/create` — start a new book
- `/edit/[bookId]` — the block editor
- `/dashboard` — your own books (drafts + published)

---

## 📱 Looks good on your phone, too

Folio is responsive top to bottom — the shelf, the editor, and the reader all
adapt to small screens, right down to a `dvh`-sized reader that doesn't fight
mobile browser chrome.

<div align="center">

| Home (mobile) | Reader (mobile) |
| :---: | :---: |
| <img src="docs/media/home-mobile.png" width="260" alt="Home on mobile" /> | <img src="docs/media/read-mobile.png" width="260" alt="Reader on mobile" /> |

</div>

---

## 🛠️ Scripts

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Start the Next.js dev server (hot reload)       |
| `npm run build`     | Production build                                |
| `npm run start`     | Serve the production build                      |
| `npm run lint`      | Lint the frontend                               |
| `npm run test`      | Run the frontend vitest suite                   |
| `npm run api:dev`   | Start the FastAPI backend with reload (port 8002) |

Backend tests: `pip install -r backend/requirements-dev.txt && pytest`.

---

## 📂 Project structure

```
ebookhroon/
├── backend/            # FastAPI app — the CSV-backed JSON API
│   ├── main.py         #   all routes: auth, books, pages, blocks, search, uploads
│   ├── tests/          #   pytest suite (auth, books, pages, blocks, helpers)
│   └── requirements.txt
├── data/               # CSV "tables" (demo seed data lives here)
│   ├── books.csv
│   ├── pages.csv
│   └── blocks.csv
├── docs/media/         # README screenshots + demo GIF
├── public/uploads/     # uploaded images (gitignored, kept with .gitkeep)
└── src/
    ├── app/            # Next.js App Router pages + API routes + SEO (sitemap/robots/OG)
    ├── components/     # editor blocks, marketing, reader, search, UI kit
    ├── lib/            # server actions, auth, backend client, utils
    └── types/          # shared TypeScript types
```

---

## 🔎 Built to be found (SEO & sharing)

Every published book is shareable *and* discoverable — the metadata does the
heavy lifting so a single link looks great everywhere it lands:

- **Rich link previews.** Open Graph + Twitter `summary_large_image` cards on
  every page, with a dynamically-rendered 1200×630 social image
  (`/opengraph-image`) generated on the edge. Individual books use their own
  cover art in the preview.
- **Structured data (JSON-LD).** `WebSite` + `Organization` schema site-wide, and
  a `Book` schema on each reader page — so search engines understand titles,
  authors, and publish dates.
- **`sitemap.xml` & `robots.txt`.** Auto-generated. The sitemap lists every
  published book (refreshed hourly); private surfaces like `/dashboard` and
  `/edit` are kept out of the crawl.
- **Canonical URLs, favicon, and a PWA manifest** — the app is installable to a
  home screen and won't trip up on duplicate-content warnings.

Point it at your real domain by setting `NEXT_PUBLIC_APP_URL` in `.env.local`;
all canonical/OG/sitemap URLs derive from it. Verify the endpoints locally:

```bash
curl http://localhost:3000/robots.txt
curl http://localhost:3000/sitemap.xml
curl http://localhost:3000/manifest.webmanifest
```

---

## 🔐 A note on data & auth

Folio is intentionally a lightweight, no-database **MVP**. Data is stored in flat
CSV files and passwords are salted + hashed (PBKDF2-SHA256). It's perfect for
demos, personal libraries, and small deployments — for a high-traffic production
setup you'd want to swap the CSV layer for a real database. The seam is small:
it all lives in `backend/main.py`.

---

## 🌐 Live demo

The reader is live at **[ebook.techrealm.ai](https://ebook.techrealm.ai)** — go
turn a few pages, search inside a book, and hit **Listen**.

---

## 💛 Made with care

Folio started as a weekend "could a book feel like a *book* in the browser?"
experiment and kept growing from there. If you build something lovely with it,
that's the whole point — go bind some stories.
