import { MercadoPagoConfig } from 'mercadopago';

export const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-3962266255631867-092011-73566a13c713c4d3d9cec01756c66d88-2698724971'
});
