import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // لتجاوز أخطاء الأنواع أثناء البناء
  },
};

export default nextConfig;