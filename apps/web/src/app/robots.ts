import type { MetadataRoute } from 'next'

// Soft-launch: keep the whole site out of search engines. This does NOT block
// access — direct links still work — it only tells crawlers to stay away, so we
// stay low-profile until public launch. Flip `disallow` → `allow: '/'` (and add
// a sitemap) when we open up.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
  }
}
