-- Actualizar pedidos antiguos a los nuevos estados estandarizados
UPDATE orders 
SET status = 'Pedido recibido' 
WHERE status IN ('Pendiente', 'A Verificar', 'Confirmado', 'Procesando');

UPDATE orders 
SET status = 'Despachado' 
WHERE status = 'Enviado';

UPDATE orders 
SET status = 'Pago acreditado' 
WHERE status = 'Pagado';
