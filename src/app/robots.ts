import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://fixtrack.company";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/billing", "/receipt/", "/track/", "/home"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}