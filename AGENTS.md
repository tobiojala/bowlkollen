<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
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
