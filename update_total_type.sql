-- ==============================================================================
-- WAYKÚ - UPGRADE: Convertir "total" de texto a número en pedidos
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de Supabase
-- ==============================================================================

-- 1. Actualizar la columna 'total' de texto (ej. "$150,000" o "$150.000") a número puro (NUMERIC)
ALTER TABLE public.orders 
ALTER COLUMN total TYPE numeric 
USING (
  REGEXP_REPLACE(
    REPLACE(total, '$', ''), 
    '[^0-9.]', 
    '', 
    'g'
  )
)::numeric;

-- Nota: Esta expresión regular quita el símbolo $ y cualquier otra cosa que no sea número o punto decimal.
