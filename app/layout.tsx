import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Brother's Photography — Archival & Editorial",
  description: 'Professional Photography & Cinematography for Weddings, Events, Celebrations & Every Special Moment.',
  openGraph: {
    title: "Brother's Photography",
    description: 'Turning Moments into Lifelong Memories.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-jakarta)" }}>
        {children}
      </body>
    </html>
  );
}
