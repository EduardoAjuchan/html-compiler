import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Codecloak',
  description: 'Compila, decompila, encripta y desencripta fragmentos de código con una sintaxis personalizada similar a HTML.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark"> {/* Ensure dark theme is applied */}
      <body className={`${geistSans.variable} ${geistMono.variable} font-mono antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
