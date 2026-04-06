import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/products', destination: '/productos', permanent: true },
      { source: '/products/:id', destination: '/productos/:id', permanent: true },
      { source: '/story', destination: '/historia', permanent: true },
      { source: '/contact', destination: '/contacto', permanent: true },
      { source: '/account', destination: '/cuenta', permanent: true },
      { source: '/login', destination: '/ingresar', permanent: true },
      { source: '/register', destination: '/registro', permanent: true },
      { source: '/shipping', destination: '/envios', permanent: true },
      { source: '/terms', destination: '/terminos', permanent: true },
      { source: '/privacy', destination: '/privacidad', permanent: true },
      { source: '/faq', destination: '/preguntas-frecuentes', permanent: true },
      { source: '/checkout', destination: '/finalizar-compra', permanent: true },
      { source: '/checkout/success', destination: '/finalizar-compra/exito', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'bsanjkllusdrtbfvffvf.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      }
    ],
  },
};

export default nextConfig;
