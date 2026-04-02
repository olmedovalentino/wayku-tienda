-- Agregar columna de fecha de expiración
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- El NULL significa que no expira (ilimitado)
