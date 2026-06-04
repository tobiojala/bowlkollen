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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Security setup (required for production)

After deploying or cloning, complete these steps so admin access and live scoring are properly locked down:

1. **Environment variables** — Copy `.env.example` to `.env.local` and set at least:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_EMAILS` — comma-separated emails allowed to use `/admin` (must match Supabase Auth users)
   - Optional: `ADMIN_USER_IDS`, `SUPABASE_SERVICE_ROLE_KEY` (scripts only; never use a `NEXT_PUBLIC_` prefix)

2. **Rotate the BITS API key** — If the repo ever contained a committed key, request a new key from BITS/Swebowl and set `BITS_API_KEY` in `.env.local` for import scripts (`scripts/import-bits-teams.ts`).

3. **Supabase RLS** — In the Supabase SQL editor, run `supabase/rls_security.sql`. Then either:
   - Insert your user into `app_admins`, or
   - Set `app_metadata.role` to `"admin"` on your auth user in the Supabase dashboard.

   Before running the migration, remove any old policies that allow unrestricted writes on `matches`, `match_lineups`, and `match_results`.

Until step 3 is done, `/admin` is blocked in the app for non-admins, but direct Supabase client writes may still succeed if RLS is too permissive.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
