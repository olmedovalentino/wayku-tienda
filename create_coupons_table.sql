-- Crear tabla de cupones
CREATE TABLE IF NOT EXISTS public.coupons (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   code TEXT UNIQUE NOT NULL,
   discount_percentage NUMERIC NOT NULL,
   is_active BOOLEAN DEFAULT true,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Políticas
-- Lectura pública para que el frontend pueda comprobar el cupón
CREATE POLICY "Lectura pública de cupones" ON public.coupons
    FOR SELECT USING (true);

-- Modificaciones solo para rol de servicio (admin)
CREATE POLICY "Admin puede modificar cupones" ON public.coupons
    FOR ALL USING (auth.role() = 'service_role');

-- Insertar algunos cupones por defecto (opcional)
INSERT INTO public.coupons (code, discount_percentage, is_active)
VALUES ('BIENVENIDO5', 5, true)
ON CONFLICT (code) DO NOTHING;
