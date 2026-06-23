<!-- BEGIN:nextjs-agent-rules -->
# Next.js 16 — key differences from training data

- **App Router only** — use `app/` conventions (Server Components, layouts, `loading.tsx`, etc.)
- **Slow navigations**: `<Suspense>` alone is not enough — also export `unstable_instant` from the route. Read `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.mdx` before touching navigation performance.
- **Unknown API?** Check `node_modules/next/dist/docs/` before guessing — this version has breaking changes from older Next.js.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Overview

Bowlkollen is a single Next.js 16 app (npm, `package-lock.json`). There is no monorepo, Docker dev stack, or `test` script. Hosted **Supabase** is the only external runtime dependency for real data and auth.

### Commands

See `package.json` scripts: `npm run dev` (http://localhost:3000), `npm run build`, `npm run start`, `npm run lint`. Typecheck: `npx tsc --noEmit`. No automated test runner is wired (Playwright is installed but unused).

### Environment

Create `.env.local` (gitignored) with:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional for import scripts: `SUPABASE_SERVICE_ROLE_KEY`, `BITS_COOKIE`.

**Without Supabase:** `npm run build` and `npm run dev` still work. Use demo/mock routes for smoke tests: `/puls` (`DEMO = true`), `/sllm` (falls back to demo players). Home (`/`) and `/teams` expect live Supabase data (`DEMO = false` on the home page).

### Services

| Service | Required? |
|---------|-----------|
| Next.js dev server (`npm run dev`) | Yes |
| Supabase (cloud) | For real data, login, `/admin` |
| BITS / SBF / bowlres APIs | Optional (imports and API stubs) |

Run the dev server in tmux if it must stay up across commands (e.g. session `next-dev-server`).

### Lint

`npm run lint` runs ESLint over the whole repo; the codebase currently has many pre-existing violations (mostly `@typescript-eslint/no-explicit-any` and `@next/next/no-html-link-for-pages`). Lint failure does not block `npm run build` or `npx tsc --noEmit`.

### Next.js version note

This project uses Next.js 16 with breaking changes vs older versions. Read guides under `node_modules/next/dist/docs/` before changing framework code.
