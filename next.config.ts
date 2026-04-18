import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images : {
    remotePatterns : [
      {
        protocol : 'https',
        hostname : 'res.cloudinary.com'
      }
    ]
  },
  reactCompiler : true,
  experimental : {
    turbopackFileSystemCacheForDev : true
  }
};

export default nextConfig;
