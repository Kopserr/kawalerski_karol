import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proof uploads (photos, short clips) go through submitProofAction as
  // multipart FormData — the framework default (1MB) is far too small.
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
