import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { products as initialProducts } from '@/lib/products';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://wayku.ar';

  let activeProducts: Array<{ id: string; updated_at?: string }> = initialProducts.filter((product) => product.isVisible !== false);
  try {
    if (supabase) {
      const { data } = await supabase.from('products').select('id, updated_at, "isVisible"').eq('"isVisible"', true);
      if (data && data.length > 0) {
        activeProducts = data as Array<{ id: string; updated_at?: string }>;
      }
    }
  } catch {}

  const productUrls: MetadataRoute.Sitemap = activeProducts.map((product) => ({
    url: `${baseUrl}/productos/${product.id}`,
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
      url: `${baseUrl}/productos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...productUrls,
  ];
}
