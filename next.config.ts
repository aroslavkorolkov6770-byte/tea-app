import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    appIsrStatus: false, // Это убирает тот самый кружок с буквой N
  },
};

export default nextConfig;