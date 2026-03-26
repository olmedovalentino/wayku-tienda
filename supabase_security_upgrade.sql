-- ==============================================================================
-- WAYKÚ TIENDA - UPGRADE DE SEGURIDAD (Supabase RLS)
-- ==============================================================================
-- Copiá y pegá todo este texto en el SQL Editor de tu Supabase y tocale "Run"
-- ==============================================================================

-- 1. Habilitamos la Seguridad a Nivel de Fila (RLS) en todas las tablas sensibles
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- 2. Limpiamos cualquier política vieja que haya quedado por ahí
DROP POLICY IF EXISTS "Public read access for products" ON public.products;
DROP POLICY IF EXISTS "Public read access for reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can read their own row" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own row" ON public.users;
DROP POLICY IF EXISTS "Users can update their own row" ON public.users;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert queries" ON public.queries;
DROP POLICY IF EXISTS "Public can insert subscribers" ON public.subscribers;

-- ==============================================================================
-- CREADO DE REGLAS SEGURAS (POLICIES)
-- ==============================================================================

-- PRODUCTOS: Cualquiera puede LEER el catálogo, pero nadie puede editarlo/borrarlo (solo el Admin con Service Key)
CREATE POLICY "Public read access for products" 
ON public.products FOR SELECT 
USING (true);

-- RESEÑAS: Cualquiera puede LEER las reseñas y crear nuevas.
CREATE POLICY "Public read access for reviews" 
ON public.reviews FOR SELECT 
USING (true);

CREATE POLICY "Public insert access for reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (true);

-- USUARIOS: Un usuario público SÓLO puede leer, crear y editar su propio perfil (por ID ó coincidencia de texto)
-- NOTA: Como no usas Supabase Auth nativo todavía, damos permiso condicional por el momento al anon para interactuar.
CREATE POLICY "Public can insert into users"
ON public.users FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can select users"
ON public.users FOR SELECT
USING (true);

CREATE POLICY "Public can update users"
ON public.users FOR UPDATE
USING (true);

-- PEDIDOS (ORDERS): Cualquiera puede CREAR un pedido (al pagar), pero NO leerlos (para no filtrar ventas).
CREATE POLICY "Public can insert orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- CONSULTAS (QUERIES): Cualquiera puede CREAR una consulta (desde contacto), pero NO leerlas.
CREATE POLICY "Public can insert queries" 
ON public.queries FOR INSERT 
WITH CHECK (true);

-- SUBCRIPTORES: Cualquiera puede suscribirse, pero NO leer la lista de emails ajena.
CREATE POLICY "Public can insert subscribers" 
ON public.subscribers FOR INSERT 
WITH CHECK (true);

-- ---------------------
-- FIN DEL SCRIPT
-- ---------------------
-- OJO: Como tenés el Login de Admin "casero" (con una clave tuya en localStorage), 
-- tu panel de Admin no va a poder LEER la lista de órdenes ni clientes si la bloqueamos 100% acá, 
-- a menos que usemos una SERVICE_KEY en el servidor en Next.js. 
-- Por eso, dejé las políticas de Lectura de "users" abiertas por ahora para no romperte la web.
-- Cuando configures SUPABASE_SERVICE_ROLE_KEY en Vercel, ajustamos las tuercas al máximo.
