/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Rutas antiguas → URLs canónicas (opción A: un solo dominio)
      {
        source: "/advanced",
        destination: "/calculadora",
        permanent: true,
      },
      {
        source: "/advanced/:path*",
        destination: "/calculadora/:path*",
        permanent: true,
      },
      {
        source: "/relevamiento",
        destination: "/presupuesto",
        permanent: true,
      },
      {
        source: "/relevamiento/:path*",
        destination: "/presupuesto/:path*",
        permanent: true,
      },
      {
        source: "/api/relevamiento/:path*",
        destination: "/api/presupuesto/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
