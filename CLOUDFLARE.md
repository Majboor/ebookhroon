## Cloudflare deployment

This app is a full-stack Next.js 15 app. It is not a static export.

Use Cloudflare's Workers/OpenNext deployment path, not the `Next.js (Static HTML Export)` Pages preset.

Required env vars in Cloudflare:

```env
FASTAPI_BASE_URL=https://book.heyharoon.io
NEXT_PUBLIC_FASTAPI_BASE_URL=https://book.heyharoon.io
```

Local commands:

```bash
npm run preview
npm run deploy
```

Files added for Cloudflare:

- `open-next.config.ts`
- `wrangler.jsonc`

If the homepage renders blank in production, the first things to check are:

1. The project was deployed through the Workers/OpenNext path, not static Pages export.
2. Both backend URL env vars are set in Cloudflare.
3. The backend health endpoint returns `200 OK`:

```bash
curl -i https://book.heyharoon.io/health
```
