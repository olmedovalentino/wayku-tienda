import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { products as initialProducts } from '@/lib/products';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://waykulamparas.com';

  let activeProducts = initialProducts.filter(p => p.isVisible !== false);
  try {
    if (supabase) {
      const { data } = await supabase.from('products').select('id, updated_at, "isVisible"').eq('"isVisible"', true);
      if (data && data.length > 0) {
        activeProducts = data as any;
      }
    }
  } catch (e) {}

  const productUrls: MetadataRoute.Sitemap = activeProducts.map((product: any) => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...productUrls,
  ];
}
