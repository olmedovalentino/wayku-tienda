'use client';

import { ProductCard } from '@/components/products/ProductCard';
import { useApp } from '@/context/AppContext';
import { useState, useMemo, Suspense } from 'react';
import { ChevronDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

type SortOption = 'relevance' | 'price-asc' | 'price-desc';

function ProductsContent() {
    const { products } = useApp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const categoryQuery = searchParams.get('category');

    const handleCategoryClick = (catId: string | null) => {
        if (catId) {
            router.push(`/productos?category=${catId}`, { scroll: false });
        } else {
            router.push('/productos', { scroll: false });
        }
    };
    const [sortBy, setSortBy] = useState<SortOption>('relevance');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showFiltersMobile, setShowFiltersMobile] = useState(false);
    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });

    // Filter and sort products
    const filteredAndSortedProducts = useMemo(() => {
        let result = products.filter(p => p.isVisible !== false);


        // Filter by category
        if (categoryQuery) {
            result = result.filter(p => p.category === categoryQuery);
        }

        // Filter by materials
        if (selectedMaterials.length > 0) {
            result = result.filter(p => selectedMaterials.includes(p.material));
        }

        // Filter by price range
        result = result.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);

        // Sort
        result.sort((a, b) => {
            // Priority 1: Available NOW (inStock = true AND isComingSoon = false)
            const aAvailableNow = a.inStock && !a.isComingSoon;
            const bAvailableNow = b.inStock && !b.isComingSoon;

            if (aAvailableNow !== bAvailableNow) {
                return aAvailableNow ? -1 : 1;
            }
            
            // Priority 2: If neither is available now, "Agotado" comes before "Próximamente"
            // (So Coming Soon is always last)
            if (!aAvailableNow && !bAvailableNow) {
                if (a.isComingSoon !== b.isComingSoon) {
                    return a.isComingSoon ? 1 : -1;
                }
            }

            // Second priority: selected sort option
            if (sortBy === 'price-asc') {
                return a.price - b.price;
            } else if (sortBy === 'price-desc') {
                return b.price - a.price;
            }
            return 0; // 'relevance' keeps original order
        });

        return result;
    }, [products, categoryQuery, selectedMaterials, priceRange, sortBy]);


    const categories = [
        { id: 'pendant', name: 'Colgantes' },
        { id: 'table', name: 'De Mesa' },
        { id: 'floor', name: 'De Pie' },
        { id: 'wall', name: 'Apliques' },
    ];

    const materials = [
        { id: 'guayubira', name: 'Guayubira' },
        { id: 'roble', name: 'Roble' },
    ];

    const sortOptions = [
        { id: 'relevance', name: 'Relevancia' },
        { id: 'price-asc', name: 'Menor precio' },
        { id: 'price-desc', name: 'Mayor precio' },
    ];

    const toggleMaterial = (materialId: string) => {
        setSelectedMaterials(prev =>
            prev.includes(materialId)
                ? prev.filter(m => m !== materialId)
                : [...prev, materialId]
        );
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

                {/* Mobile Categories Pills */}
                <div className="lg:hidden w-full overflow-x-auto hide-scrollbar -mx-4 px-4 pb-2">
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleCategoryClick(null)}
                            className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-all border ${!categoryQuery ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'}`}
                        >
                            Ver todo
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.id)}
                                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-all border ${categoryQuery === cat.id ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mobile Filter Toggle Button */}
                <div className="lg:hidden flex justify-between items-center -mt-2">
                     <button
                        onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                        className="flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50"
                    >
                        <span>Filtros</span>
                        <ChevronDown className={`transform transition-transform ${showFiltersMobile ? 'rotate-180' : ''}`} size={16} />
                    </button>
                     <div className="relative">
                        <button
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            className="flex items-center gap-2 text-sm font-medium text-stone-900 border border-stone-200 bg-white px-4 py-2.5 rounded-lg shadow-sm"
                        >
                            <span>Ordenar</span>
                            <ChevronDown size={14} />
                        </button>
                        {showSortMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-lg shadow-lg z-20 overflow-hidden">
                                {sortOptions.map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            setSortBy(option.id as SortOption);
                                            setShowSortMenu(false);
                                        }}
                                        className={`block w-full text-left px-4 py-3 text-sm hover:bg-stone-50 ${sortBy === option.id ? 'text-primary font-bold bg-stone-50' : 'text-stone-700'}`}
                                    >
                                        {option.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Filters Sidebar */}
                <aside className={`w-full lg:w-64 flex-shrink-0 space-y-8 ${showFiltersMobile ? 'block bg-stone-50 p-6 rounded-2xl border border-stone-100' : 'hidden lg:block'}`}>
                    <div>
                        <h2 className="font-serif text-xl border-b border-stone-200 pb-4 mb-6 hidden lg:block">Filtros</h2>

                        {/* Categories (Desktop only) */}
                        <div className="space-y-4 hidden lg:block">
                            <h3 className="font-medium text-stone-900 text-sm uppercase tracking-wider">Categorías</h3>
                            <ul className="space-y-3">
                                <li>
                                    <button
                                        onClick={() => handleCategoryClick(null)}
                                        className={`text-sm ${!categoryQuery ? 'text-primary font-medium' : 'text-stone-500 hover:text-stone-900'}`}
                                    >
                                        Ver todo
                                    </button>
                                </li>
                                {categories.map(cat => (
                                    <li key={cat.id}>
                                        <button
                                            onClick={() => handleCategoryClick(cat.id)}
                                            className={`text-sm ${categoryQuery === cat.id ? 'text-primary font-medium' : 'text-stone-500 hover:text-stone-900'}`}
                                        >
                                            {cat.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Price Range */}
                        <div className="pt-8">
                            <h3 className="font-medium text-stone-900 text-sm uppercase tracking-wider mb-4">Precio</h3>
                            <div className="space-y-3">
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        value={priceRange.min}
                                        onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                                        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="Min"
                                    />
                                    <span className="text-stone-400">-</span>
                                    <input
                                        type="number"
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                                        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="Max"
                                    />
                                </div>
                                <div className="text-xs text-stone-500">
                                    ${priceRange.min.toLocaleString()} - ${priceRange.max.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Material - Wood Types */}
                        <div className="pt-8">
                            <h3 className="font-medium text-stone-900 text-sm uppercase tracking-wider mb-4">Madera</h3>
                            <ul className="space-y-3">
                                {materials.map(material => (
                                    <li key={material.id} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={material.id}
                                            checked={selectedMaterials.includes(material.id)}
                                            onChange={() => toggleMaterial(material.id)}
                                            className="w-4 h-4 text-primary border-stone-300 rounded focus:ring-primary"
                                        />
                                        <label htmlFor={material.id} className="text-sm text-stone-600 cursor-pointer">
                                            {material.name}
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1">
                    <div className="mb-8 hidden lg:flex items-center justify-between">
                        <span className="text-sm text-stone-500">Mostrando {filteredAndSortedProducts.length} productos</span>
                        <div className="relative">
                            <button
                                onClick={() => setShowSortMenu(!showSortMenu)}
                                className="flex items-center gap-2 text-sm font-medium text-stone-900 hover:text-primary"
                            >
                                <span className="text-sm text-stone-600">Ordenar por:</span>
                                {sortOptions.find(opt => opt.id === sortBy)?.name} <ChevronDown size={14} />
                            </button>
                            {showSortMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-md shadow-lg z-10">
                                    {sortOptions.map(option => (
                                        <button
                                            key={option.id}
                                            onClick={() => {
                                                setSortBy(option.id as SortOption);
                                                setShowSortMenu(false);
                                            }}
                                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-stone-50 ${sortBy === option.id ? 'text-primary font-medium' : 'text-stone-700'}`}
                                        >
                                            {option.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {filteredAndSortedProducts.length > 0 ? (
                        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredAndSortedProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : categoryQuery === 'floor' ? (
                        <div className="rounded-3xl border border-stone-200 bg-stone-50 px-6 py-12 text-center">
                            <h2 className="text-2xl font-serif text-stone-900">Por ahora no hay lamparas de pie</h2>
                            <p className="mt-3 text-sm text-stone-600">
                                Estamos preparando nuevos modelos. Mientras tanto, podes ver las opciones de mesa, colgantes y apliques.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-stone-200 bg-stone-50 px-6 py-12 text-center">
                            <h2 className="text-2xl font-serif text-stone-900">No encontramos productos con esos filtros</h2>
                            <p className="mt-3 text-sm text-stone-600">
                                Proba limpiando materiales o cambiando la categoria para ver mas opciones.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-stone-200 border-t-primary rounded-full animate-spin"></div></div>}>
            <ProductsContent />
        </Suspense>
    );
}

