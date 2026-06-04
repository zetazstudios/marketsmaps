import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MarketsMaps | Geolocated Marketplace',
  description: 'Global geolocated real-time marketplace where the map is the core of the experience.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-[#07090E] text-white min-h-screen overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
