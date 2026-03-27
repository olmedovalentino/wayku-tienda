import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { ConditionalWrapper } from "@/components/layout/ConditionalWrapper";
import { Toaster } from 'sonner';
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Waykú | Lámparas Artesanales y Diseño de Autor",
  description: "Iluminación de diseño en madera natural y cerámica. Creamos lámparas artesanales, sustentables, únicas y exclusivas para transformar tus espacios. Hechas a mano en Córdoba, Argentina.",
  keywords: ["lámparas de madera", "lámparas artesanales", "diseño de autor", "iluminación sustentable", "decoración de interiores", "lámparas nórdicas", "diseño argentino"],
  openGraph: {
    title: "Waykú | Lámparas Artesanales",
    description: "Iluminación de diseño hecha a mano con madera natural y cerámica para transformar tus espacios.",
    url: "https://waykulámparas.com",
    siteName: "Waykú Lámparas",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Waykú | Lámparas Artesanales",
    description: "Iluminación de diseño hecha a mano con madera natural y cerámica para transformar tus espacios.",
  },
  robots: {
    index: true,
    follow: true,
  }
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



