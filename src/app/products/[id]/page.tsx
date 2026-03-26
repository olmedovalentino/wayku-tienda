'use client';

import { useApp } from '@/context/AppContext';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Check, Truck, Shield, ArrowLeft, Star, Heart, Hammer } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import { use, useState, useEffect, useMemo } from 'react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ProductPage(props: PageProps) {
    const params = use(props.params);
    const { products, reviews, addReview } = useApp();
    const { user } = useAuth();

    const product = products.find((p) => p.id === params.id);
    const [selectedMaterial, setSelectedMaterial] = useState<'guayubira' | 'roble' | 'palo-santo'>('roble');
    const [selectedSize, setSelectedSize] = useState<'1m' | '1.5m' | '2m'>('1m');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [shadeType, setShadeType] = useState<'lino' | 'blanco-calido' | 'blanco-frio'>('lino');
    const [cableColor, setCableColor] = useState<'blanco' | 'negro'>('blanco');
    const [canopyColor, setCanopyColor] = useState<'blanco' | 'negro'>('blanco');

    const [reviewComment, setReviewComment] = useState('');
    const [reviewRating, setReviewRating] = useState(5);

    const { addItem } = useCart();
    const { toggleFavorite, isFavorite } = useFavorites();


    const similarProducts = useMemo(() => {
        if (!product) return [];
        return products
            .filter(p => p.category === product.category && p.id !== product.id && p.isVisible !== false)
            .slice(0, 3);
    }, [product, products]);

    const productReviews = useMemo(() => {
        return reviews.filter(r => r.productId === params.id);
    }, [reviews, params.id]);

    if (products.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product || product.isVisible === false) {
        console.error('NOT FOUND TRIGGERED. Products available:', products.map(p => p.id), 'Requested ID:', params.id, 'Product state:', product);
        notFound();
    }

    const handleAddToCart = () => {
        addItem(
            product,
            selectedMaterial,
            hasSizeVariants ? selectedSize : undefined,
            product.category === 'table' ? shadeType : undefined,
            (product.category === 'table' || (product.category === 'pendant' && product.id !== 'new-1' && product.id !== 'new-4')) ? cableColor : undefined,
            product.category === 'pendant' ? canopyColor : undefined
        );
    };

    const handleAddReview = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        addReview({
            productId: params.id,
            userName: user.name,
            rating: reviewRating,
            comment: reviewComment
        });
        setReviewComment('');
    };

    const materials = useMemo(() => {
        const allMaterials = [
            { id: 'guayubira' as const, name: 'Guayubira' },
            { id: 'roble' as const, name: 'Roble' },
            { id: 'palo-santo' as const, name: 'Palo Santo' },
        ];

        if (product && product.name === 'Taini') {
            return allMaterials.filter(m => m.id !== 'palo-santo');
        }
        return allMaterials;
    }, [product]);

    const sizes = useMemo(() => {
        if (product.variants && product.variants.some(v => !!v.size)) {
            // Get unique sizes from variants
            const uniqueSizes = Array.from(new Set(product.variants.map(v => v.size).filter(s => !!s)));
            // Map to the format needed for buttons. 
            // Try to map known codes to nice names, otherwise pass through
            const getName = (s: string) => {
                if (s === '1m') return '1 metro';
                if (s === '1.5m') return '1.5 metros';
                if (s === '2m') return '2 metros';
                return s;
            };
            return uniqueSizes.map(s => ({ id: s as string, name: getName(s as string) }));
        }

        return [
            { id: '1m', name: '1 metro' },
            { id: '1.5m', name: '1.5 metros' },
            { id: '2m', name: '2 metros' },
        ];
    }, [product]);

    const shadeTypes = [
        { id: 'lino' as const, name: 'Lino' },
        { id: 'blanco-calido' as const, name: 'Blanco Cálido' },
        { id: 'blanco-frio' as const, name: 'Blanco Frío' },
    ];

    const colors = [
        { id: 'blanco' as const, name: 'Blanco' },
        { id: 'negro' as const, name: 'Negro' },
    ];

    const getVariantStock = (material: string, size?: string) => {
        if (!product.variants) return product.stockCount ?? 0;
        const variant = product.variants.find(v => v.material === material && v.size === size);
        return variant ? variant.stock : 0;
    };

    const hasSizeVariants = useMemo(() => {
        return (product.variants?.some(v => !!v.size)) || product.id === 'new-1';
    }, [product]);

    const isSelectionInStock = () => {
        if (!product.variants) return product.inStock;

        const sizeToCheck = hasSizeVariants ? selectedSize : undefined;
        return getVariantStock(selectedMaterial, sizeToCheck) > 0;
    };


    return (
        <div className="mx-auto max-w-7xl px-0 lg:px-8 py-4 lg:py-16">
            <Link
                href="/products"
                className="mb-6 px-4 lg:px-0 inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-primary"
            >
                <ArrowLeft size={16} /> Volver a la tienda
            </Link>

            <div className="grid grid-cols-1 gap-x-8 gap-y-8 lg:grid-cols-2">
                {/* Product Gallery */}
                <div className="space-y-4">
                    
                    {/* --- SWIPEABLE GALLERY (ALL DEVICES) --- */}
                    <div className="relative w-full aspect-square bg-stone-100 rounded-2xl overflow-hidden group">
                        <div 
                            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar cursor-grab active:cursor-grabbing" 
                            id="product-gallery"
                            onScroll={(e) => {
                                const scrollLeft = e.currentTarget.scrollLeft;
                                const width = e.currentTarget.offsetWidth;
                                setSelectedImageIndex(Math.round(scrollLeft / width));
                            }}
                        >
                            {product.images.map((img, idx) => (
                                <div key={idx} className="w-full h-full shrink-0 snap-center relative">
                                    <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-cover" priority={idx === 0} sizes="(max-width: 1024px) 100vw, 50vw" />
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Dots Indicator (Mobile mainly, but useful anywhere) */}
                    {product.images.length > 1 && (
                        <div className="flex justify-center gap-2 mt-3 mb-6 lg:hidden">
                            {product.images.map((_, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => {
                                        const el = document.getElementById('product-gallery');
                                        if (el) el.scrollTo({ left: idx * el.offsetWidth, behavior: 'smooth' });
                                    }} 
                                    aria-label={`Ir a foto ${idx + 1}`}
                                    className={`h-2 rounded-full transition-all ${selectedImageIndex === idx ? 'w-6 bg-stone-800' : 'w-2 bg-stone-300'}`} 
                                />
                            ))}
                        </div>
                    )}

                    {/* Desktop Thumbnails */}
                    {product.images.length > 1 && (
                        <div className="hidden lg:grid grid-cols-4 gap-4 mt-4">
                            {product.images.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        const el = document.getElementById('product-gallery');
                                        if (el) el.scrollTo({ left: index * el.offsetWidth, behavior: 'smooth' });
                                    }}
                                    className={`relative aspect-square overflow-hidden rounded-xl bg-stone-100 transition-all ${selectedImageIndex === index ? 'ring-2 ring-stone-900 border-2 border-white opacity-100 shadow-md transform scale-105' : 'opacity-70 hover:opacity-100'}`}
                                >
                                    <Image
                                        src={image}
                                        alt={`${product.name} ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="12vw"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex flex-col px-4 lg:px-0">
                    <h1 className="text-3xl font-normal tracking-tight text-stone-900 sm:text-4xl">
                        {product.name}
                    </h1>

                    <div className="mt-4 flex items-center gap-4">
                        <p className="text-3xl font-normal text-stone-900">${product.price.toLocaleString()}</p>
                        {product.inStock ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-sm font-medium text-green-700">
                                <Check size={14} /> En Stock
                            </span>
                        ) : (
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-sm font-medium text-red-700">
                                Agotado
                            </span>
                        )}
                    </div>

                    <div className="mt-8 space-y-6">
                        <p className="text-base text-stone-600 leading-relaxed">
                            {product.description}
                        </p>

                        {/* Material Selector */}
                        <div>
                            <h3 className="text-sm font-medium text-stone-900 mb-3">Tipo de Madera</h3>
                            <div className={`grid gap-3 ${materials.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                {materials.map((material) => {
                                    return (
                                        <button
                                            key={material.id}
                                            onClick={() => setSelectedMaterial(material.id)}
                                            className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-colors
                                                ${selectedMaterial === material.id
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-stone-200 text-stone-700 hover:border-stone-300'}
                                            `}
                                        >
                                            {material.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Size Selector - Dynamic */}
                        {hasSizeVariants && (
                            <div>
                                <h3 className="text-sm font-medium text-stone-900 mb-3">Tamaño</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {sizes.map((size) => {
                                        const isAvailable = product.variants
                                            ? getVariantStock(selectedMaterial, size.id) > 0
                                            : true;
                                        return (
                                            <button
                                                key={size.id}
                                                // @ts-ignore
                                                onClick={() => setSelectedSize(size.id)}
                                                disabled={!isAvailable && !!product.variants}
                                                className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-colors
                                                    ${selectedSize === size.id
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-stone-200 text-stone-700 hover:border-stone-300'}
                                                    ${(!isAvailable && !!product.variants) ? 'opacity-50 cursor-not-allowed bg-stone-100 text-stone-400 border-stone-100' : ''}
                                                `}
                                            >
                                                {size.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Shade Type - Only for Table Lamps */}
                        {product.category === 'table' && (
                            <div>
                                <h3 className="text-sm font-medium text-stone-900 mb-3">Tipo de Pantalla</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {shadeTypes.map((shade) => (
                                        <button
                                            key={shade.id}
                                            onClick={() => setShadeType(shade.id)}
                                            className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-colors ${shadeType === shade.id
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-stone-200 text-stone-700 hover:border-stone-300'
                                                }`}
                                        >
                                            {shade.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cable Color Selector */}
                        {(product.category === 'table' || (product.category === 'pendant' && product.id !== 'new-1' && product.id !== 'new-4')) && (
                            <div>
                                <h3 className="text-sm font-medium text-stone-900 mb-3">
                                    {product.category === 'pendant' ? 'Color Cable y Florón' : 'Color Cable'}
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {colors.map((color) => (
                                        <button
                                            key={color.id}
                                            onClick={() => setCableColor(color.id)}
                                            className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-colors ${cableColor === color.id
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-stone-200 text-stone-700 hover:border-stone-300'
                                                }`}
                                        >
                                            {color.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Canopy Selector */}
                        {product.category === 'pendant' && (
                            <div>
                                <h3 className="text-sm font-medium text-stone-900 mb-3">Color Florón</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {colors.map((color) => (
                                        <button
                                            key={color.id}
                                            onClick={() => setCanopyColor(color.id)}
                                            className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-colors ${canopyColor === color.id
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-stone-200 text-stone-700 hover:border-stone-300'
                                                }`}
                                        >
                                            {color.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="rounded-xl bg-stone-50 p-6 space-y-5 border border-stone-100 shadow-sm">
                            <div className="flex items-start gap-4">
                                <Hammer className="mt-0.5 h-6 w-6 text-[#5E6F5E]" />
                                <div>
                                    <p className="font-bold text-stone-900 text-sm">Hecho a mano en Argentina 🇦🇷</p>
                                    <p className="text-xs text-stone-500 mt-1">Cada lámpara es ensamblada y probada artesanalmente en Córdoba.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Truck className="mt-0.5 h-6 w-6 text-[#5E6F5E]" />
                                <div>
                                    <p className="font-bold text-stone-900 text-sm">Envíos a todo el país</p>
                                    <p className="text-xs text-stone-500 mt-1">Gratis en pedidos superiores a $100.000.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Shield className="mt-0.5 h-6 w-6 text-[#5E6F5E]" />
                                <div>
                                    <p className="font-bold text-stone-900 text-sm">1 Año de Garantía</p>
                                    <p className="text-xs text-stone-500 mt-1">Calidad estructural y eléctrica asegurada en tu compra.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                        <Button
                            size="lg"
                            className="w-full flex-1 min-h-[56px] text-lg font-bold shadow-md hover:shadow-lg transition-all"
                            disabled={!product.inStock || (!!product.variants && !isSelectionInStock())}
                            onClick={handleAddToCart}
                        >
                            {product.inStock && (!product.variants || isSelectionInStock()) ? 'Añadir al Carrito' : 'Sin Stock'}
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="px-6 min-h-[56px] border-2 hover:border-red-500 hover:text-red-500 transition-colors"
                            onClick={() => toggleFavorite(product)}
                        >
                            <Heart
                                size={24}
                                className={isFavorite(product.id) ? 'fill-current text-red-500' : ''}
                            />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-16 lg:mt-20 border-t border-stone-200 pt-16 px-4 lg:px-0">
                <h2 className="text-2xl font-normal text-stone-900 mb-8">Reseñas y Comentarios</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Review List */}
                    <div className="space-y-6">
                        {productReviews.length === 0 ? (
                            <div className="bg-stone-50 rounded-xl p-8 text-center">
                                <Star className="mx-auto h-12 w-12 text-stone-300 mb-4" />
                                <p className="text-stone-600">Aún no hay reseñas para este producto</p>
                            </div>
                        ) : (
                            productReviews.map(review => (
                                <div key={review.id} className="bg-white border border-stone-100 p-6 rounded-xl shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-medium text-stone-900">{review.userName}</p>
                                            <p className="text-xs text-stone-400">{review.date}</p>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-stone-200"} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-stone-600 text-sm leading-relaxed">{review.comment}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add Review Form */}
                    <div className="bg-stone-50 p-8 rounded-2xl h-fit">
                        <h3 className="text-lg font-medium text-stone-900 mb-6">Deja tu opinión</h3>
                        {user ? (
                            <form onSubmit={handleAddReview} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">Puntuación</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setReviewRating(star)}
                                                className="focus:outline-none"
                                            >
                                                <Star size={24} className={star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-stone-300"} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">Tu comentario</label>
                                    <textarea
                                        required
                                        rows={4}
                                        className="w-full rounded-xl border border-stone-200 p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="Cuéntanos qué te pareció el producto..."
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    Publicar Reseña
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-stone-600 text-sm mb-4">Debes iniciar sesión para dejar una reseña.</p>
                                <Link href="/login">
                                    <Button variant="outline" size="sm">Iniciar Sesión</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Similar Products */}
            {similarProducts.length > 0 && (
                <div className="mt-20 border-t border-stone-200 pt-16 px-4 lg:px-0 mb-10">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-start">
                        <div className="lg:col-span-8 w-full">
                            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 sm:grid sm:grid-cols-3 sm:gap-6 sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {similarProducts.map((similarProduct) => (
                                    <Link key={similarProduct.id} href={`/products/${similarProduct.id}`} className="group block min-w-[70vw] sm:min-w-0 snap-center shrink-0">
                                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F9F5F0]">
                                            <Image
                                                src={similarProduct.images[0]}
                                                alt={similarProduct.name}
                                                fill
                                                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>
                                        <div className="bg-[#F9F5F0] p-4 text-center">
                                            <h3 className="text-lg font-medium text-stone-900">{similarProduct.name}</h3>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div className="lg:col-span-4 flex flex-col justify-start">
                            <h2 className="text-3xl font-normal tracking-tight text-stone-900 sm:text-4xl">Productos Similares</h2>
                            <p className="mt-20 text-base text-stone-600">
                                Descubre otras piezas de nuestra colección que complementan perfectamente este diseño.
                            </p>
                            <div className="mt-10">
                                <Link href="/products">
                                    <Button variant="outline" size="md" className="rounded-full gap-2 hover:bg-[#5E6F5E] hover:text-white hover:border-[#5E6F5E]">
                                        Ver más
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
