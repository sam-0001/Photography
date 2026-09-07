import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/public/PageHeader';
import PortfolioGrid, { PortfolioItem } from '../components/public/PortfolioGrid';
import connectDB from '@/lib/mongodb';
import { PortfolioMedia } from '@/lib/models';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Curated Portfolio Archive | Brother's Photography Atelier",
  description: "Browse fine-art wedding monographs, pre-wedding editorial sessions, and fine-art portraits documented worldwide.",
};

const DEFAULT_PORTFOLIO_FIXTURES: PortfolioItem[] = [
  {
    title: 'The Two-Continent Nuptials',
    subtitle: 'Lake Como, Italy · Ceremony',
    category: 'Weddings',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    aspectRatio: '4:5',
    isFeatured: true,
    exif: {
      camera: 'Leica M11-P',
      lens: '50mm Summilux-M f/1.4',
      aperture: 'f/1.4',
      shutter: '1/1000s',
      iso: 100,
    },
  },
  {
    title: 'Venetian Twilight & Gondola',
    subtitle: 'Grand Canal, Venice · Pre-Wedding',
    category: 'Pre-Wedding',
    url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80',
    aspectRatio: '16:9',
    isFeatured: false,
    exif: {
      camera: 'Hasselblad 907X 50C',
      lens: 'XCD 45mm f/4 P',
      aperture: 'f/4.0',
      shutter: '1/500s',
      iso: 200,
    },
  },
  {
    title: 'Éléonore & Julian — Parisian Dawn',
    subtitle: 'Place Vendôme, Paris · Editorial Session',
    category: 'Pre-Wedding',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80',
    aspectRatio: '4:3',
    isFeatured: false,
    exif: {
      camera: 'Sony A1',
      lens: 'FE 85mm f/1.4 GM',
      aperture: 'f/1.4',
      shutter: '1/2000s',
      iso: 100,
    },
  },
  {
    title: 'Udaipur Palace Royalty — The Royal Courtyard Session',
    subtitle: 'City Palace, Udaipur · Portraits',
    category: 'Portraits',
    url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80',
    aspectRatio: '1:1',
    isFeatured: false,
    exif: {
      camera: 'Leica SL2-S',
      lens: 'Vario-Elmarit-SL 24-70mm f/2.8',
      aperture: 'f/2.8',
      shutter: '1/800s',
      iso: 400,
    },
  },
  {
    title: 'Twilight Waltz under Chandeliers',
    subtitle: 'Villa Balbiano, Como · Reception Gala',
    category: 'Weddings',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80',
    aspectRatio: '16:9',
    isFeatured: true,
    exif: {
      camera: 'Leica M11-P',
      lens: '35mm Summicron-M f/2.0',
      aperture: 'f/2.0',
      shutter: '1/250s',
      iso: 800,
    },
  },
  {
    title: 'Silk & Sandalwood Bridal Monograph',
    subtitle: 'Pune Atelier Studio · Fine Art',
    category: 'Editorial',
    url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80',
    aspectRatio: '4:5',
    isFeatured: false,
    exif: {
      camera: 'Hasselblad 500C/M',
      lens: 'Zeiss Planar 80mm f/2.8',
      aperture: 'f/2.8',
      shutter: '1/125s',
      iso: 160,
    },
  },
];

export default async function PortfolioPage() {
  let mediaItems: PortfolioItem[] = [];

  try {
    await connectDB();
    const dbItems = await PortfolioMedia.find({ isPublished: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    if (dbItems && dbItems.length > 0) {
      mediaItems = JSON.parse(JSON.stringify(dbItems));
    }
  } catch (err) {
    console.error('[PortfolioPage] Error fetching from MongoDB:', err);
  }

  // Graceful fallback if database returns empty
  if (mediaItems.length === 0) {
    mediaItems = DEFAULT_PORTFOLIO_FIXTURES;
  }

  return (
    <>
      <Navbar />
      <main
        className="min-h-screen py-16 px-5 md:px-16"
        style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)', margin: '0 auto' }}
      >
        <PageHeader
          tag="02 — Curated Archive"
          title="Curated Portfolio Archive"
          subtitle="Browse fine-art wedding monographs, pre-wedding editorial sessions, and analog 35mm plates captured worldwide."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Portfolio', href: '/portfolio' },
          ]}
        />

        <PortfolioGrid initialMedia={mediaItems} showFilter={true} />
      </main>
      <Footer />
    </>
  );
}
