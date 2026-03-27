-- ==============================================================================
-- WAYKÚ - UPGRADE: Carrito y Favoritos Cross-Device + Bucket de Imágenes
-- ==============================================================================
-- Copiá y pegá todo esto en el SQL Editor de tu Supabase y tocale "Run"
-- ==============================================================================

-- 1. Agregar columna "cart" a la tabla users (JSONB, puede guardar array de items)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS cart JSONB DEFAULT '[]'::jsonb;

-- 2. Agregar columna "favorites" a la tabla users (JSONB, puede guardar array de productos)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS favorites JSONB DEFAULT '[]'::jsonb;

-- ==============================================================================
-- IMPORTANTE: Para que las imágenes de productos funcionen,
-- el Storage Bucket "products" DEBE ser público.
-- 
-- Hacelo en el Dashboard de Supabase:
-- Storage → Buckets → products → Make Public
--   O si no existe el bucket, crealo:
-- Storage → New Bucket → Name: "products" → Make it public ✓
-- ==============================================================================

-- ==============================================================================
-- FIN DEL SCRIPT
-- ==============================================================================
