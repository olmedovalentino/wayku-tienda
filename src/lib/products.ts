export interface StockVariant {
    material: string;
    size?: string;
    stock: number;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: 'pendant' | 'table' | 'floor' | 'wall';
    material: 'guayubira' | 'roble';
    images: string[];
    inStock: boolean;
    isVisible?: boolean;
    stockCount?: number;
    isComingSoon?: boolean;
    variants?: StockVariant[];
}

// Converts a product name to a URL-friendly slug.
// e.g. "Amai" -> "amai"
export function slugify(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}

export function findBySlug(productList: Product[], slug: string): Product | undefined {
    return productList.find((product) => slugify(product.name) === slug);
}

export const products: Product[] = [
    {
        id: 'new-1',
        name: 'Taini',
        description: 'Lampara colgante lineal de madera, ideal para iluminar islas de cocina o comedores con una luz calida y difusa.',
        price: 220000,
        category: 'pendant',
        material: 'roble',
        images: ['/productos/pendant-kitchen.png', '/productos/pendant-detail.png'],
        inStock: true,
        stockCount: 15,
        variants: [
            { material: 'roble', size: '1m', stock: 5 },
            { material: 'roble', size: '1.5m', stock: 3 },
            { material: 'roble', size: '2m', stock: 0 },
            { material: 'guayubira', size: '1m', stock: 2 },
            { material: 'guayubira', size: '1.5m', stock: 0 },
            { material: 'guayubira', size: '2m', stock: 4 },
        ],
    },
    {
        id: 'new-2',
        name: 'Amai',
        description: 'Lampara de mesa con base de madera y pantalla de lino natural. Perfecta para mesas de luz o escritorios.',
        price: 120000,
        category: 'table',
        material: 'guayubira',
        images: ['/productos/table-lamp.png'],
        inStock: true,
        variants: [
            { material: 'roble', stock: 2 },
            { material: 'guayubira', stock: 2 },
        ],
    },
    {
        id: 'new-3',
        name: 'Kiru',
        description: 'Aplique de pared en madera con foco direccional negro. Combina funcionalidad y diseno moderno.',
        price: 80000,
        category: 'wall',
        material: 'roble',
        images: ['/productos/wall-sconce.png'],
        inStock: true,
        stockCount: 12,
    },
    {
        id: 'new-4',
        name: 'Unui',
        description: 'Lampara colgante de diseno minimalista, ideal para crear ambientes serenos.',
        price: 200000,
        category: 'pendant',
        material: 'guayubira',
        images: ['/productos/unui.png'],
        inStock: true,
        stockCount: 10,
    },
];
