import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { MetaPixel } from '@/components/analytics/MetaPixel';
import { ConditionalWrapper } from "@/components/layout/ConditionalWrapper";
import { Toaster } from 'sonner';
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "4002367400057449";

export const metadata: Metadata = {
  metadataBase: new URL('https://wayku.ar'),
  title: "Wayku | Lamparas artesanales y diseno de autor",
  description: "Iluminacion de diseno en madera natural y ceramica. Creamos lamparas artesanales, sustentables, unicas y exclusivas para transformar tus espacios. Hechas a mano en Cordoba, Argentina.",
  keywords: ["lamparas de madera", "lamparas artesanales", "diseno de autor", "iluminacion sustentable", "decoracion de interiores", "lamparas nordicas", "diseno argentino", "lamparas cordoba"],
  openGraph: {
    title: "Wayku | Lamparas artesanales",
    description: "Iluminacion de diseno hecha a mano con madera natural y ceramica para transformar tus espacios.",
    url: "https://wayku.ar",
    siteName: "Wayku",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wayku | Lamparas artesanales",
    description: "Iluminacion de diseno hecha a mano con madera natural y ceramica para transformar tus espacios.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://wayku.ar",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${playfair.variable} antialiased bg-stone-50 text-stone-900 flex flex-col min-h-screen`}
      >
        {metaPixelId ? <MetaPixel pixelId={metaPixelId} /> : null}
        {metaPixelId ? (
          <noscript>
            {/* Meta Pixel requiere este fallback con img para navegadores sin JavaScript. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        ) : null}
        <AuthProvider>
          <AppProvider>
            <CartProvider>
              <FavoritesProvider>
                <ConditionalWrapper>
                  {children}
                </ConditionalWrapper>
                <Toaster position="top-center" richColors />
              </FavoritesProvider>
            </CartProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
