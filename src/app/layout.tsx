import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/organisms/navbar";
import { Footer } from "@/components/organisms/footer";
import { WhatsAppFloat } from "@/components/organisms/whatsapp-float";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_TITLE =
  "CENTA Inmobiliaria | Decisiones inmobiliarias pensadas a largo plazo";
const SITE_DESCRIPTION =
  "CENTA es una inmobiliaria que te acompaña con claridad, estructura y confianza en cada decisión inmobiliaria. Propiedades en Buenos Aires.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.centapropiedades.com"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Centa Propiedades",
    url: "https://www.centapropiedades.com",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // og:image is supplied by the colocated app/opengraph-image.tsx route.
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // twitter:image is supplied by the colocated app/twitter-image.tsx route.
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-centa-off-white font-sans text-centa-black">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
