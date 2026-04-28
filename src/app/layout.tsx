import type { Metadata } from "next";
import { Ubuntu, Ubuntu_Mono } from "next/font/google";
import "./globals.css";

/**
 * Tipografía corporativa de TodoCESPED definida en el manual de marca.
 * Se cargan los pesos necesarios para titulares (negrita) y texto (regular).
 */
const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

/**
 * Variante monoespaciada para usos técnicos (código, identificadores,
 * datos estructurados). Mantiene coherencia visual con la familia Ubuntu.
 */
const ubuntuMono = Ubuntu_Mono({
  variable: "--font-ubuntu-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Iron Brain · TodoCESPED",
  description:
    "Ecosistema central de decisiones de TodoCESPED. Centraliza información operativa y proporciona a cada departamento herramientas para tomar decisiones basadas en datos.",
  applicationName: "Iron Brain",
  authors: [{ name: "Daniel Sanagustín López" }],
  keywords: ["Iron Brain", "TodoCESPED", "TFG", "Universidad de Zaragoza"],
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${ubuntu.variable} ${ubuntuMono.variable}`} suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}