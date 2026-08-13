/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/.well-known/openid-configuration",
        destination: "/api/well-known/openid-configuration",
      },
      {
        source: "/.well-known/jwks.json",
        destination: "/api/well-known/jwks.json",
      },
    ];
  },
};

export default nextConfig;
