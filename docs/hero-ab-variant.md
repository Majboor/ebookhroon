# Landing Hero — A/B Variant

The marketing landing page (`/`) ships with two interchangeable hero
treatments, selectable at request time via a `?variant=` query parameter. This
lets us A/B-test messaging and layout without a second deploy.

## How to use it

| URL | Hero shown |
| --- | --- |
| `/` or `/?variant=a` | **Variant A** (default) |
| `/?variant=b` | **Variant B** |

Any value other than `b` falls back to variant A, so existing links and crawlers
keep seeing the default experience.

## What differs

Only the hero section changes. The navbar, features grid, "Recently Published"
strip, CTA band, and footer are shared and identical across both variants.

| | Variant A (default) | Variant B |
| --- | --- | --- |
| Headline | "Your stories, **beautifully** bound." | "Publish a book the world can **actually read.**" |
| Angle | Brand / craft | Benefit / outcome |
| Layout | Centered, symmetrical, book mockup below the fold | Asymmetric split — copy left, book mockup right |
| Backdrop | Light `bg-gradient-cream` | Dark `bg-gradient-forest` |
| Pill tag | "Premium Digital Publishing Platform" | "Free to start — no credit card" |
| Primary CTA | "Create Your Book" → `/create` | "Start Writing Free" → `/create` |
| Secondary CTA | "Browse Library" (outline button) → `/explore` | "See example books" (ghost link) → `/explore` |

## Implementation

- **Variant A** stays inline in `src/app/page.tsx` (unchanged copy/markup).
- **Variant B** lives in its own component,
  `src/components/marketing/hero-variant-b.tsx`, so the two treatments evolve
  independently and merge cleanly.
- `src/app/page.tsx` reads `searchParams.variant` (awaited — Next 15 async
  searchParams) and renders `<HeroVariantB />` when it equals `"b"`, otherwise
  the default inline hero.

Both CTAs point at the same destinations (`/create`, `/explore`), so downstream
funnel/attribution stays comparable between the two arms.

## Verified

- `npm run build` — compiles clean.
- `npm run dev` on port 8750 — `/?variant=a` and `/?variant=b` both return 200
  with the expected, mutually-exclusive headline and CTA copy.
- Playwright (chromium headless shell) screenshots confirm the distinct layouts
  render correctly at 1280×900.
