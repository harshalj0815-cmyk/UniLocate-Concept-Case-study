import type { NextConfig } from "next";
import path from "path";

/**
 * PROTO_EXPORT=1 builds a static snapshot for the case study
 * (served at /prototype-app/ from case-study/public). Normal dev is unchanged.
 */
const exporting = process.env.PROTO_EXPORT === "1";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  ...(exporting
    ? {
        output: "export" as const,
        assetPrefix: "/prototype-app",
        images: { unoptimized: true },
        /* Dev never type-checks; keep the snapshot build the same */
        typescript: { ignoreBuildErrors: true },
      }
    : {}),
};

export default nextConfig;
