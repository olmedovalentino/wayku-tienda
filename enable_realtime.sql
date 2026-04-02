-- ============================================================
-- WAYKÚ — Habilitar Supabase Realtime en tablas del admin
-- Correr una sola vez en el SQL Editor de Supabase
-- ============================================================

-- Agregar tablas al canal de publicación REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscribers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- (Opcional) Ver qué tablas están publicadas ahora
-- SELECT pubname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
