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
    material: 'guayubira' | 'roble' | 'palo-santo';
    images: string[];
    inStock: boolean;
    isVisible?: boolean;
    stockCount?: number;
    variants?: StockVariant[];
}



export const products: Product[] = [
    {
        id: 'new-1',
        name: 'Taini',
        description: 'Lámpara colgante lineal de madera, ideal para iluminar islas de cocina o comedores con una luz cálida y difusa.',
        price: 185000,
        category: 'pendant',
        material: 'roble',
        images: ['/products/pendant-kitchen.png', '/products/pendant-detail.png'],
        inStock: true,
        stockCount: 15,
        variants: [
            { material: 'roble', size: '1m', stock: 5 },
            { material: 'roble', size: '1.5m', stock: 3 },
            { material: 'roble', size: '2m', stock: 0 }, // Out of stock example
            { material: 'guayubira', size: '1m', stock: 2 },
            { material: 'guayubira', size: '1.5m', stock: 0 }, // Out of stock example
            { material: 'guayubira', size: '2m', stock: 4 },
        ]
    },
    {
        id: 'new-2',
        name: 'Amaí',
        description: 'Lámpara de mesa con base de madera y pantalla de lino natural. Perfecta para mesas de luz o escritorios.',
        price: 125000,
        category: 'table',
        material: 'guayubira',
        images: ['/products/table-lamp.png'],
        inStock: true,
        variants: [
            { material: 'roble', stock: 2 },
            { material: 'guayubira', stock: 2 },
            { material: 'palo-santo', stock: 2 }
        ]
    },
    {
        id: 'new-3',
        name: 'Kirú',
        description: 'Aplique de pared en madera con foco direccional negro. Combina funcionalidad y diseño moderno.',
        price: 110000,
        category: 'wall',
        material: 'palo-santo',
        images: ['/products/wall-sconce.png'],
        inStock: true,
        stockCount: 12
    },

    {
        id: 'new-4',
        name: 'Unui',
        description: 'Lámpara colgante de diseño minimalista, ideal para crear ambientes serenos.',
        price: 150000,
        category: 'pendant',
        material: 'guayubira',
        images: ['/products/unui.png'],
        inStock: true,
        stockCount: 10
    },
];
