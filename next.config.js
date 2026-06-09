/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
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
