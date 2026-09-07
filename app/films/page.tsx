import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/public/PageHeader';
import FilmsGrid, { FilmItem } from '../components/public/FilmsGrid';
import connectDB from '@/lib/mongodb';
import { PortfolioMedia } from '@/lib/models';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Cinematic Films & Motion Monographs | Brother's Photography",
  description: "Fine-art wedding films, pre-wedding destination trailers, and cinematic event reels captured on 35mm and 4K anamorphic cinema.",
};

const DEFAULT_FILM_FIXTURES: FilmItem[] = [
  {
    title: 'The Vows at Villa Balbiano Master Film',
    subtitle: 'Lake Como, Italy · 4K Anamorphic Cinema Master',
    category: 'Films',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    aspectRatio: '16:9',
    isFeatured: true,
    exif: {
      camera: 'Arri Alexa Mini LF',
      lens: 'Cooke Anamorphic /i Full Frame Plus 40mm',
      shutter: '1/48s (180°)',
      iso: 800,
    },
  },
  {
    title: 'Venetian Lagoon Twilight Monograph',
    subtitle: 'Venice, Italy · Pre-Wedding Cinematic Teaser',
    category: 'Films',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80',
    aspectRatio: '16:9',
    isFeatured: false,
    exif: {
      camera: 'Sony FX6 Cinema Line',
      lens: 'Sony FE C 16-35mm T/3.1 G',
      shutter: '1/50s',
      iso: 800,
    },
  },
  {
    title: 'Royal Courtyard Gala at City Palace',
    subtitle: 'Udaipur, Rajasthan · Grand Matrimonial Highlights',
    category: 'Films',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80',
    aspectRatio: '16:9',
    isFeatured: false,
    exif: {
      camera: 'RED V-Raptor 8K VV',
      lens: 'Atlas Orion Anamorphic 50mm T2',
      shutter: '1/48s',
      iso: 800,
    },
  },
];

export default async function FilmsPage() {
  let films: FilmItem[] = [];

  try {
    await connectDB();
    const dbFilms = await PortfolioMedia.find({
      isPublished: true,
      $or: [{ category: /films/i }, { mediaType: 'video' }],
    })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    if (dbFilms && dbFilms.length > 0) {
      films = JSON.parse(JSON.stringify(dbFilms));
    }
  } catch (err) {
    console.error('[FilmsPage] DB query error:', err);
  }

  if (films.length === 0) {
    films = DEFAULT_FILM_FIXTURES;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-16 px-5 md:px-16 bg-[#0d0d0c] text-white">
        <div style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)', margin: '0 auto' }}>
          <header className="mb-12 pb-6 border-b border-white/20">
            <span className="font-sans text-[0.6875rem] font-semibold tracking-[0.2em] text-[#c49e62] uppercase">
              03 — Cinema Archive
            </span>
            <h1 className="font-serif text-4xl md:text-6xl text-white mt-2">
              Cinematic Films &amp; Motion Monographs
            </h1>
            <p className="font-sans text-base text-white/70 mt-3 max-w-2xl font-light">
              Anamorphic cinema and natural sound design capturing the emotion, cadence, and atmosphere of your celebration.
            </p>
          </header>

          <FilmsGrid initialFilms={films} />
        </div>
      </main>
      <Footer />
    </>
  );
}
