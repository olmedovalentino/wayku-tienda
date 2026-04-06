import Image from 'next/image';
import Link from 'next/link';
import { Product, slugify } from '@/lib/products';
import { Button } from '@/components/ui/Button';

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    return (
        <Link href={`/productos/${slugify(product.name)}`} className="group block">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-stone-100">
                <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {(!product.inStock || !(product.variants && product.variants.length > 0 ? product.variants.some(v => v.stock > 0) : (product.stockCount !== undefined && product.stockCount > 0))) && !product.isComingSoon && (
                    <div className="absolute left-2 top-2 rounded bg-stone-900/80 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        Agotado
                    </div>
                )}
                {product.isComingSoon && (
                    <div className="absolute left-2 top-2 rounded bg-[#5E6F5E] px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        Próximamente
                    </div>
                )}
            </div>
            <div className="mt-4 flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-medium text-stone-900 group-hover:text-primary">
                        {product.name}
                    </h3>
                    <p className="mt-1 text-sm text-stone-500 line-clamp-2">
                        {product.description}
                    </p>
                </div>
                <p className="text-lg font-semibold text-stone-900">${product.price.toLocaleString()}</p>
            </div>
            <div className="mt-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <Button className="w-full" size="sm">
                    Ver Detalles
                </Button>
            </div>
        </Link>
    );
}
