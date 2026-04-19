'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { Product, StockVariant } from '@/lib/products';
import { Button } from '@/components/ui/Button';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    X,
    Upload,
    Eye,
    EyeOff,
    PlusCircle,
    MinusCircle,
    ChevronLeft,
    ChevronRight,
    Clock
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

export default function AdminProductsPage() {
    const { products, addProduct, updateProduct, deleteProduct } = useApp();

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todas');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form state
    const [formData, setFormData] = useState<Omit<Product, 'id'>>({
        name: '',
        description: '',
        price: 0,
        category: 'pendant',
        material: 'roble',
        images: [''],
        inStock: true,
        isVisible: true,
        stockCount: 0,
        isComingSoon: false,
        variants: []
    });

    const [showVariants, setShowVariants] = useState(false);

    const filteredProducts = [...products].reverse().filter(product => {
        const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = categoryFilter === 'Todas' || product.category === categoryFilter;
        return matchSearch && matchCategory;
    });

    const openAddModal = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            price: 0,
            category: 'pendant',
            material: 'roble',
            images: [''],
            inStock: true,
            isVisible: true,
            stockCount: 0,
            isComingSoon: false,
            variants: []
        });
        setShowVariants(false);
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            material: product.material,
            images: product.images,
            inStock: product.inStock,
            isVisible: product.isVisible ?? true,
            stockCount: product.stockCount ?? 0,
            isComingSoon: product.isComingSoon ?? false,
            variants: product.variants || []
        });
        setShowVariants(!!product.variants && product.variants.length > 0);
        setIsModalOpen(true);
    };

    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImages, setIsUploadingImages] = useState(false);
    const visibleImages = useMemo(
        () => formData.images.filter((img) => img && img.trim() !== ''),
        [formData.images]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isUploadingImages) {
            toast.error('Espera a que terminen de subirse las imagenes antes de guardar.');
            return;
        }
        setIsSaving(true);
        try {
            // Filter out empty image entries before saving
            const cleanedImages = formData.images.filter(img => img && img.trim() !== '');
            const dataToSave = { ...formData, images: cleanedImages };
            
            if (editingProduct) {
                const { error } = await updateProduct(editingProduct.id, dataToSave);
                if (error) {
                    toast.error(`Error al guardar en base de datos: ${error.message}`);
                } else {
                    toast.success('Producto actualizado correctamente');
                    setIsModalOpen(false);
                }
            } else {
                const { error } = await addProduct(dataToSave);
                if (error) {
                    toast.error(`Error al crear en base de datos: ${error.message}`);
                } else {
                    toast.success('Producto creado correctamente');
                    setIsModalOpen(false);
                }
            }
        } catch (submitError) {
            console.error("Submit Error:", submitError);
            toast.error('Error al procesar el formulario');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const files = Array.from(input.files || []);

        if (!files.length || !supabase) {
            input.value = '';
            return;
        }

        setIsUploadingImages(true);
        const loadingToastId = toast.loading(
            files.length === 1 ? 'Subiendo imagen...' : `Subiendo ${files.length} imagenes...`
        );

        try {
            const uploadedUrls: string[] = [];
            const failedUploads: string[] = [];

            for (const file of files) {
                const safeName = file.name
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-zA-Z0-9._-]/g, '-')
                    .replace(/-+/g, '-')
                    .toLowerCase();
                const filePath = `products/${crypto.randomUUID()}-${safeName}`;

                const { data, error } = await supabase.storage
                    .from('products')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false,
                    });

                if (error || !data?.path) {
                    console.error('Storage upload error:', error);
                    failedUploads.push(file.name);
                    continue;
                }

                const { data: publicData } = supabase.storage
                    .from('products')
                    .getPublicUrl(data.path);

                if (publicData.publicUrl) {
                    uploadedUrls.push(publicData.publicUrl);
                } else {
                    failedUploads.push(file.name);
                }
            }

            if (uploadedUrls.length > 0) {
                setFormData((current) => {
                    const currentImages = current.images.filter((img) => img && img.trim() !== '');
                    return { ...current, images: [...currentImages, ...uploadedUrls] };
                });
                toast.success(
                    uploadedUrls.length === 1
                        ? 'Imagen subida correctamente'
                        : `${uploadedUrls.length} imagenes subidas correctamente`
                );
            }

            if (failedUploads.length > 0) {
                toast.error(
                    failedUploads.length === 1
                        ? `No se pudo subir ${failedUploads[0]}`
                        : `Fallaron ${failedUploads.length} imagenes`
                );
            }
        } catch (uploadError) {
            console.error('Unexpected image upload error:', uploadError);
            toast.error('Ocurrio un error al subir las imagenes');
        } finally {
            toast.dismiss(loadingToastId);
            setIsUploadingImages(false);
            input.value = '';
        }
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Estas seguro de que quieres eliminar la lampara "${name}"?`)) {
            deleteProduct(id);
        }
    };

    const addVariant = () => {
        const isAmai = formData.name === 'Amai';
        setFormData({
            ...formData,
            variants: [
                ...(formData.variants || []),
                {
                    material: 'roble',
                    stock: 0,
                    ...(isAmai ? {} : { size: '1m' })
                }
            ]
        });
    };

    const removeVariant = (index: number) => {
        const newVariants = [...(formData.variants || [])];
        newVariants.splice(index, 1);
        setFormData({ ...formData, variants: newVariants });
    };

    const updateVariant = (index: number, field: keyof StockVariant, value: string | number) => {
        const newVariants = [...(formData.variants || [])];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setFormData({ ...formData, variants: newVariants });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Productos</h1>
                    <p className="text-stone-500">Gestiona el catalogo de lamparas de Wayku.</p>
                </div>
                <Button onClick={openAddModal} className="flex items-center gap-2">
                    <Plus size={20} />
                    Nuevo Producto
                </Button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o categoria..."
                        className="block w-full pl-10 pr-3 py-2 border border-stone-200 rounded-xl focus:ring-primary focus:border-primary sm:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-primary focus:border-primary text-sm font-medium text-stone-700"
                >
                    <option value="Todas">Todas las Categorias</option>
                    <option value="pendant">Colgantes</option>
                    <option value="table">Mesa</option>
                    <option value="floor">Pie</option>
                    <option value="wall">Aplique</option>
                </select>
            </div>

            {/* Products Table (Desktop) */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-medium">Producto</th>
                                <th className="px-6 py-4 font-medium">Categoria</th>
                                <th className="px-6 py-4 font-medium text-center">Precio</th>
                                <th className="px-6 py-4 font-medium text-center">Stock (U)</th>
                                <th className="px-6 py-4 font-medium text-center min-w-[140px]">Estado</th>
                                <th className="px-6 py-4 font-medium text-center">Visibilidad</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-sm">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-stone-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                                                <Image
                                                    src={product.images[0] || 'https://via.placeholder.com/150'}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p className="font-medium text-stone-900">{product.name}</p>
                                                <p className="text-xs text-stone-500 truncate max-w-[200px]">{product.description.substring(0, 50)}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="capitalize text-stone-600">{product.category}</span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-stone-900">
                                        ${product.price.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium text-stone-600">
                                        {product.stockCount ?? 0}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-center gap-1.5 min-w-[140px]">
                                            <button
                                                onClick={() => updateProduct(product.id, { inStock: !product.inStock })}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${product.inStock
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    }`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full ${product.inStock ? 'bg-green-600' : 'bg-red-600'
                                                    }`}></span>
                                                {product.inStock ? 'En Stock' : 'Sin Stock'}
                                            </button>
                                            
                                            <button
                                                onClick={() => updateProduct(product.id, { isComingSoon: !product.isComingSoon })}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${product.isComingSoon
                                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                    : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
                                                    }`}
                                            >
                                                <Clock size={10} className={product.isComingSoon ? 'text-yellow-600' : 'text-stone-300'} />
                                                {product.isComingSoon ? 'Proximamente' : 'Lanzado'}
                                            </button>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => updateProduct(product.id, { isVisible: !(product.isVisible ?? true) })}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${product.isVisible !== false
                                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                                }`}
                                        >
                                            {product.isVisible !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                                            {product.isVisible !== false ? 'Visible' : 'Oculto'}
                                        </button>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(product)}
                                                className="p-1.5 text-stone-400 hover:text-stone-900 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id, product.name)}
                                                className="p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Products List (Mobile) */}
            <div className="lg:hidden space-y-4">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100 border border-stone-200">
                                    <Image
                                        src={product.images[0] || 'https://via.placeholder.com/150'}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="font-bold text-stone-900">{product.name}</p>
                                    <p className="text-xs text-stone-500 capitalize">{product.category}</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => openEditModal(product)}
                                    className="p-1.5 text-stone-400 active:bg-stone-100 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id, product.name)}
                                    className="p-1.5 text-stone-400 active:bg-red-50 text-red-500 rounded-lg transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm py-2 border-y border-stone-100">
                            <div>
                                <span className="text-stone-500 block text-xs">Precio</span>
                                <span className="font-bold text-stone-900">${product.price.toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-stone-500 block text-xs">Stock Total</span>
                                <span className="font-bold text-stone-900">{product.stockCount ?? 0} U</span>
                            </div>
                        </div>

                        <div className="flex justify-between gap-2">
                            <button
                                onClick={() => updateProduct(product.id, { inStock: !product.inStock })}
                                className={`flex-1 flex justify-center items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${product.inStock
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                    }`}
                            >
                                <span className={`h-1.5 w-1.5 rounded-full ${product.inStock ? 'bg-green-600' : 'bg-red-600'
                                    }`}></span>
                                {product.inStock ? 'Stock' : 'Sin Stock'}
                            </button>
                            <button
                                onClick={() => updateProduct(product.id, { isComingSoon: !product.isComingSoon })}
                                className={`flex-1 flex justify-center items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${product.isComingSoon
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-stone-100 text-stone-400'
                                    }`}
                            >
                                <Clock size={12} className={product.isComingSoon ? 'text-yellow-600' : 'text-stone-300'} />
                                {product.isComingSoon ? 'Proximamente' : 'Lanzado'}
                            </button>
                            <button
                                onClick={() => updateProduct(product.id, { isVisible: !(product.isVisible ?? true) })}
                                className={`flex-1 flex justify-center items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${product.isVisible !== false
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-stone-100 text-stone-600'
                                    }`}
                            >
                                {product.isVisible !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                                {product.isVisible !== false ? 'Visible' : 'Oculto'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal for Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-stone-100">
                            <h2 className="text-xl font-bold text-stone-900">
                                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-stone-700">Nombre del Producto</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-primary focus:border-primary"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-stone-700">Categoria</label>
                                    <select
                                        className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-primary focus:border-primary"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as Product['category'] })}
                                    >
                                        <option value="pendant">Colgante</option>
                                        <option value="table">De Mesa</option>
                                        <option value="floor">De Pie</option>
                                        <option value="wall">Aplique</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-stone-700">Precio ($)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-primary focus:border-primary"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                    />
                                </div>
                                {/* Material Principal removed as per request to focus on variations */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-stone-700">Stock Global (Unidades)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-primary focus:border-primary disabled:bg-stone-100 disabled:text-stone-400"
                                        value={formData.stockCount}
                                        onChange={(e) => setFormData({ ...formData, stockCount: Number(e.target.value) })}
                                        disabled={showVariants}
                                    />
                                    {showVariants && <p className="text-xs text-stone-500">Gestionado por variantes</p>}
                                </div>
                            </div>

                            {/* Variants Section */}
                            <div className="space-y-4 border-t border-stone-100 pt-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="showVariants"
                                            className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary"
                                            checked={showVariants}
                                            onChange={(e) => {
                                                setShowVariants(e.target.checked);
                                                if (!e.target.checked) {
                                                    // Clear variants if unchecked? Or just hide? 
                                                    // Better to just hide but keep data, or maybe warn.
                                                    // For now, let's keep it simple.
                                                } else if ((formData.variants || []).length === 0) {
                                                    addVariant();
                                                }
                                            }}
                                        />
                                        <label htmlFor="showVariants" className="text-sm font-medium text-stone-900">
                                            Gestionar Stock por Variantes (Material/Tamano)
                                        </label>
                                    </div>
                                    {showVariants && (
                                        <Button type="button" size="sm" variant="outline" onClick={addVariant} className="gap-2">
                                            <PlusCircle size={16} /> Agregar Combinacion
                                        </Button>
                                    )}
                                </div>

                                {showVariants && (
                                    <div className="bg-stone-50 rounded-xl p-4 space-y-3">
                                        {(formData.variants || []).length === 0 ? (
                                            <p className="text-sm text-stone-500 text-center py-2">No hay variantes definidas.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-stone-500 uppercase px-1">
                                                    <div className="col-span-4">Material</div>
                                                    {formData.name !== 'Amai' && <div className="col-span-4">Tamano</div>}
                                                    <div className={formData.name !== 'Amai' ? "col-span-3" : "col-span-7"}>Stock</div>
                                                    <div className="col-span-1"></div>
                                                </div>
                                                {(formData.variants || []).map((variant, index) => (
                                                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                                        <div className="col-span-4">
                                                            <select
                                                                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:ring-primary focus:border-primary"
                                                                value={variant.material}
                                                                onChange={(e) => updateVariant(index, 'material', e.target.value)}
                                                            >
                                                                <option value="roble">Roble</option>
                                                                <option value="guayubira">Guayubira</option>
                                                            </select>
                                                        </div>
                                                        {formData.name !== 'Amai' && (
                                                            <div className="col-span-4">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Ej: 1m"
                                                                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:ring-primary focus:border-primary"
                                                                    value={variant.size || ''}
                                                                    onChange={(e) => updateVariant(index, 'size', e.target.value)}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className={formData.name !== 'Amai' ? "col-span-3" : "col-span-7"}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:ring-primary focus:border-primary"
                                                                value={variant.stock}
                                                                onChange={(e) => updateVariant(index, 'stock', Number(e.target.value))}
                                                            />
                                                        </div>
                                                        <div className="col-span-1 flex justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeVariant(index)}
                                                                className="text-stone-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <MinusCircle size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-stone-700">Descripcion</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-primary focus:border-primary"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-stone-700">Galeria de Imagenes</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {visibleImages.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-50 shadow-sm">
                                            <Image src={img} alt={`Imagen ${idx + 1}`} fill className="object-cover" sizes="(min-width: 1024px) 25vw, 50vw" />
                                            
                                            {/* Action Buttons Layer */}
                                            <div className="absolute inset-x-0 bottom-0 p-1.5 flex justify-between items-center bg-gradient-to-t from-black/50 to-transparent">
                                                <div className="flex gap-1">
                                                    {idx > 0 && (
                                                        <button type="button" 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                const newArr = [...visibleImages];
                                                                [newArr[idx-1], newArr[idx]] = [newArr[idx], newArr[idx-1]];
                                                                setFormData({...formData, images: newArr});
                                                            }} 
                                                            className="p-1 bgColor-white rounded-md text-stone-900 shadow-sm transition-all active:scale-95 bg-white/95"
                                                        >
                                                            <ChevronLeft size={14} />
                                                        </button>
                                                    )}
                                                    {idx < visibleImages.length - 1 && (
                                                        <button type="button" 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                const newArr = [...visibleImages];
                                                                [newArr[idx], newArr[idx+1]] = [newArr[idx+1], newArr[idx]];
                                                                setFormData({...formData, images: newArr});
                                                            }} 
                                                            className="p-1 bgColor-white rounded-md text-stone-900 shadow-sm transition-all active:scale-95 bg-white/95"
                                                        >
                                                            <ChevronRight size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <button type="button" 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const newArr = visibleImages.filter((_, i) => i !== idx);
                                                        setFormData({...formData, images: newArr.length ? newArr : []});
                                                    }} 
                                                    className="p-1 bg-red-500 rounded-md text-white shadow-sm transition-all active:scale-95 hover:bg-red-600"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-stone-200 group cursor-pointer hover:bg-stone-50 hover:border-primary transition-all flex flex-col items-center justify-center">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            disabled={isUploadingImages}
                                            onChange={handleImageUpload}
                                        />
                                        <Upload className="h-6 w-6 text-stone-400 group-hover:text-primary mb-2" />
                                        <p className="text-xs font-medium text-stone-600 text-center px-2">
                                            {isUploadingImages ? 'Subiendo...' : 'Subir fotos (Multiples)'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1" disabled={isSaving || isUploadingImages}>
                                    {isUploadingImages
                                        ? 'Subiendo imagenes...'
                                        : isSaving
                                            ? 'Guardando...'
                                            : editingProduct
                                                ? 'Guardar Cambios'
                                                : 'Crear Producto'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

