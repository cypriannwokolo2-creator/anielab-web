import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from MinIO and common external sources.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "minio.anielab.app",
        pathname: "/anielab-media/**",
      },
      {
        // Local MinIO for development.
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/anielab-media/**",
      },
      // Placeholder image services.
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
    ],
    // Optimize images at build + request time.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
