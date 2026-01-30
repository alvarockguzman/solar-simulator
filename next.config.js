/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/:path*",
        destination: "/advanced/:path*",
        has: [{ type: "host", value: "advanced.renovatio.lat" }],
      },
    ];
  },
};

module.exports = nextConfig;
