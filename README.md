# Personal Website

A personal portfolio website built with React, TypeScript, and Vite.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

The static site is output to `dist`. Note the site is **not** purely static: the live portfolio
tracker depends on serverless functions in `api/` (quotes, chart history, suggestions), so it needs a
host that runs them.

## Deploy

**Vercel.** Connect this repository; build command `npm run build`, output directory `dist`. Routing
and function config live in `vercel.json`. A static-only host (GitHub Pages, Netlify) will serve the
pages but leave the tracker without live prices.

Optional environment variables (see `.env.example`):

- `BLOB_READ_WRITE_TOKEN` — persists portfolio suggestions to Vercel Blob. Without it, local dev
  writes to `data/portfolio-suggestions.json`.
- `PORTFOLIO_SUGGESTIONS_ADMIN_TOKEN` — unlocks moderation on the suggestions panel.

In `npm run dev`, Vite middleware in `vite.config.ts` emulates the `api/` routes, so live quotes work
locally without Vercel.
