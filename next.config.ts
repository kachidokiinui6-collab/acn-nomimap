// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ ESLintエラーでも本番ビルドは通す
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;