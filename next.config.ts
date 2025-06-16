import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_NYLAS_CLIENT_ID: process.env.NYLAS_CLIENT_ID,
  },
};

export default nextConfig;
