import type { NextConfig } from "next";

/** Prototype snapshot lives in public/prototype-app and links assets from the site root. */
const prototypeAssetFolders = ["maps", "images", "animations", "icons", "logo"];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    return prototypeAssetFolders.map((folder) => ({
      source: `/${folder}/:path*`,
      destination: `/prototype-app/${folder}/:path*`,
    }));
  },
};

export default nextConfig;
