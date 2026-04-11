# Wayku Web

Sitio ecommerce de Wayku construido con Next.js 16, React 19 y TypeScript. Incluye catalogo, checkout, panel admin, integracion con Supabase y pagos con Mercado Pago.

## Stack

- Next.js App Router
- React 19
- TypeScript
- Supabase
- Mercado Pago
- Nodemailer
- Vitest

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
```

## Variables de entorno

Revisar `.env.example` y completar segun el entorno. Las mas importantes para que el proyecto funcione completo son:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `CHECKOUT_RELEASE_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`
- `NEXT_PUBLIC_SITE_URL`

## Flujos importantes

- Checkout: crea pedido, reserva stock y genera preferencia de pago.
- Webhook de Mercado Pago: acredita pagos y cancela pedidos rechazados.
- Admin: acceso protegido por cookie firmada.
- Newsletter, campanias y respuestas: envio por email usando SMTP.

## Estado de calidad

Validaciones usadas en la pasada final:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
