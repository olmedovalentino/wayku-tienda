import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/finalizar-compra/', '/cuenta/'],
    },
    sitemap: 'https://wayku.ar/sitemap.xml',
  };
}
