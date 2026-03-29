-- Agregar la columna para que el estado "Próximamente" se guarde en la base de datos
-- IMPORTANTE: Ejecutá esto en el SQL Editor de Supabase
ALTER TABLE products ADD COLUMN IF NOT EXISTS "isComingSoon" BOOLEAN DEFAULT FALSE;

-- También podés correr este para limpiar estados viejos si no lo hiciste antes
UPDATE orders 
SET status = 'Pedido recibido' 
WHERE status IN ('Pendiente', 'A Verificar', 'Confirmado', 'Procesando');

UPDATE orders 
SET status = 'Despachado' 
WHERE status = 'Enviado';

UPDATE orders 
SET status = 'Pago acreditado' 
WHERE status = 'Pagado';
