import { MercadoPagoConfig } from 'mercadopago';

export const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-6200970094651487-032520-fce1b897941bce436a4ec6e175ba25d3-3293391852'
});
