import type { NextConfig } from "next";

/** Prototype snapshot lives in public/prototype-app and links assets from the site root. */
const prototypeAssetFolders = ["maps", "images", "animations", "icons", "logo", "fonts"];

/* Public files are served with max-age=0 by default, so every visit revalidates
   each image, map page and script one by one (many of them inside nested iframes). */
const CACHE_PAGES = "public, max-age=600, stale-while-revalidate=86400";
const CACHE_IMAGES = "public, max-age=604800, stale-while-revalidate=86400";
const CACHE_IMMUTABLE = "public, max-age=31536000, immutable";

const cache = (source: string, value: string) => ({
  source,
  headers: [{ key: "Cache-Control", value }],
});

const nextConfig: NextConfig = {
  images: {
    /* Figures are pre-sized WebP (scripts/optimize-images.mjs). Re-encoding the
       tall ones on demand took several seconds per cold request. */
    unoptimized: true,
  },
  async rewrites() {
    return prototypeAssetFolders.map((folder) => ({
      source: `/${folder}/:path*`,
      destination: `/prototype-app/${folder}/:path*`,
    }));
  },
  async headers() {
    /* When several rules match, the last one wins: keep the specific ones at the end */
    return [
      cache("/prototype-app/:path*", CACHE_PAGES),
      ...prototypeAssetFolders.map((folder) => cache(`/${folder}/:path*`, CACHE_PAGES)),
      cache("/:all*(png|jpg|jpeg|webp|avif|gif|svg|woff2|mp4)", CACHE_IMAGES),
      cache("/prototype-app/_next/static/:path*", CACHE_IMMUTABLE),
    ];
  },
};

export default nextConfig;
