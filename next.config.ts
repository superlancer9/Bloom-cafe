import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the repo free of generated agent files.
  agentRules: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
