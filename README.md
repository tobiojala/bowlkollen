This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser (Bowlkollen uses **3001** by default so port 3000 can stay free for other projects).

```bash
npm run dev
# → http://localhost:3001
```

To run on port 3000 instead: `npm run dev:3000`

### Everything 404?

You are probably on the wrong port or the wrong project. Check the terminal after `npm run dev` — it prints the exact URL. Bowlkollen on 3001 should show `/` and `/login` working, not a blank 404 from another app on 3000.

## Styling (Tailwind)

The app is moving from inline `style={{}}` to **Tailwind CSS v4**. New UI should use Tailwind; convert old pages when you touch them.

- **Migration guide:** [docs/TAILWIND_MIGRATION.md](docs/TAILWIND_MIGRATION.md)
- **Reusable pieces:** `src/components/ui/` (`Card`, `Button`, `SectionHeader`, `GlassPill`)
- **Design tokens:** `src/app/globals.css` (`@theme` colors, `dark:` variant)

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
