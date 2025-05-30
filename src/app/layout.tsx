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
  description: 'Compile, decompile, encrypt, and decrypt code snippets with a custom HTML-like syntax.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark"> {/* Ensure dark theme is applied */}
      <body className={`${geistSans.variable} ${geistMono.variable} font-mono antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
