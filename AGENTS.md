<!-- BEGIN:nextjs-agent-rules -->
# Next.js 16 — key differences from training data

- **App Router only** — use `app/` conventions (Server Components, layouts, `loading.tsx`, etc.)
- **Slow navigations**: `<Suspense>` alone is not enough — also export `unstable_instant` from the route. Read `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.mdx` before touching navigation performance.
- **Unknown API?** Check `node_modules/next/dist/docs/` before guessing — this version has breaking changes from older Next.js.
<!-- END:nextjs-agent-rules -->
