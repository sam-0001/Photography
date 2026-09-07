import React from 'react';
import Link from 'next/link';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import InquireForm from './components/InquireForm';
import ComposedImage from './components/public/ComposedImage';
import PortfolioGrid from './components/public/PortfolioGrid';
import connectDB from '@/lib/mongodb';
import { PortfolioMedia } from '@/lib/models';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Brother's Photography Atelier | Editorial & Archival Matrimonial Monographs",
  description: "Turning moments into lifelong memories. Fine-art editorial wedding documentation, cinematic films, and archival monographs across India and worldwide.",
};

const DEFAULT_FEATURED_STORIES = [
  {
    id: 'story-1',
    client: 'Rahul & Priya',
    type: 'Wedding',
    location: 'Pune & Lake Como',
    date: '20.12.2026',
    span: '8',
    aspect: 'aspect-[16/10]',
    img: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1200&q=80',
    featured: true,
    composition: { focalX: 50, focalY: 35, zoom: 1 },
  },
  {
    id: 'story-2',
    client: 'Riya & Aarav',
    type: 'Pre-Wedding',
    location: 'Mumbai & Venice',
    date: '2026',
    span: '4',
    aspect: 'aspect-[3/4]',
    img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    featured: false,
    composition: { focalX: 50, focalY: 25, zoom: 1 },
  },
  {
    id: 'story-3',
    client: 'Meera & Dev',
    type: 'Engagement',
    location: 'Goa',
    date: '2026',
    span: '5',
    aspect: 'aspect-[4/3]',
    img: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1000&q=80',
    featured: false,
    composition: { focalX: 50, focalY: 30, zoom: 1 },
  },
  {
    id: 'story-4',
    client: 'Ananya & Kabir',
    type: 'Wedding',
    location: 'Udaipur',
    date: '2026',
    span: '7',
    aspect: 'aspect-[16/9]',
    img: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&q=80',
    featured: false,
    composition: { focalX: 50, focalY: 30, zoom: 1 },
  },
];

const DEFAULT_FILMS = [
  {
    title: 'Rahul × Priya',
    subtitle: 'The Two-Continent Nuptials',
    category: 'Wedding Films',
    img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
  },
  {
    title: 'Riya × Aarav',
    subtitle: 'Venetian Twilight & Gondola',
    category: 'Pre-Wedding Films',
    img: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80',
  },
  {
    title: 'Meera × Dev',
    subtitle: 'Goa Coastal Celebration',
    category: 'Event Highlights',
    img: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80',
  },
];

const SERVICES = [
  { num: '01', name: 'Weddings', desc: 'Complete wedding photography & cinematography — from traditional rituals to grand receptions.' },
  { num: '02', name: 'Pre-Weddings', desc: 'Cinematic destination sessions capturing your love story before the wedding celebrations.' },
  { num: '03', name: 'Celebrations', desc: 'Birthdays, engagements, galas, and milestone events preserved with fine-art precision.' },
  { num: '04', name: 'Portraits', desc: 'Couple, individual, and multi-generational family portraits with an editorial artistic touch.' },
  { num: '05', name: 'Cinematic Films', desc: 'Short-form cinematic wedding and event films that tell your complete narrative in motion.' },
  { num: '06', name: 'Albums', desc: 'Handcrafted Italian leather albums, master album designing, and archival printing services.' },
];

const TESTIMONIALS = [
  {
    quote: "Every photograph brought the day back to us. Brother's Photography truly captured the emotions we felt.",
    author: 'Rahul & Priya',
    event: 'Wedding, Pune & Lake Como',
  },
  {
    quote: 'Our pre-wedding shoot was a dream. They made us feel so comfortable and the photos are absolutely stunning.',
    author: 'Riya & Aarav',
    event: 'Pre-Wedding, Mumbai & Venice',
  },
  {
    quote: 'The team was professional, creative, and delivered beyond our expectations. Highly recommend!',
    author: 'Meera & Dev',
    event: 'Engagement, Goa',
  },
];

export default async function HomePage() {
  let mediaItems: any[] = [];
  let films = DEFAULT_FILMS;

  try {
    await connectDB();

    // Query dynamic PortfolioMedia for the homepage grid
    const dbItems = await PortfolioMedia.find({ isPublished: true, mediaType: 'image' })
      .sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 })
      .limit(6)
      .lean();

    if (dbItems && dbItems.length > 0) {
      mediaItems = JSON.parse(JSON.stringify(dbItems));
    }

    // Query dynamic films from MongoDB
    const dbFilms = await PortfolioMedia.find({
      isPublished: true,
      $or: [{ category: /films/i }, { mediaType: 'video' }],
    })
      .sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 })
      .limit(3)
      .lean();

    if (dbFilms && dbFilms.length > 0) {
      films = dbFilms.map((item: any) => ({
        title: item.title,
        subtitle: item.subtitle || 'Cinematic Film',
        category: item.category || 'Films',
        img: item.thumbnailUrl || item.url,
      }));
    }
  } catch (err) {
    console.error('[HomePage] MongoDB query fallback to fixtures:', err);
  }

  return (
    <>
      <Navbar />

      {/* ── HERO MONOGRAPH ── */}
      <section
        id="home"
        className="relative flex flex-col justify-center overflow-hidden border-b border-[var(--color-outline-variant,#ccc5bd)]"
        style={{ minHeight: '90vh' }}
      >
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1920&q=80"
            alt="Hero background — wedding ceremony"
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.35)' }}
          />
        </div>

        <div
          className="relative z-10 mx-auto px-5 md:px-16 py-24 w-full"
          style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)' }}
        >
          <div className="max-w-2xl">
            <p
              style={{
                fontFamily: 'var(--font-jakarta)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'uppercase',
                marginBottom: '1.5rem',
              }}
            >
              VOL. I — THE PHOTOGRAPHY ATELIER
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-bodoni)',
                fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                color: '#ffffff',
                marginBottom: '1.5rem',
              }}
            >
              Turning Moments into<br /><em>Lifelong Memories.</em>
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-jakarta)',
                fontSize: '1.125rem',
                fontWeight: 300,
                lineHeight: 1.75,
                color: 'rgba(255,255,255,0.75)',
                marginBottom: '2.5rem',
                maxWidth: '42rem',
              }}
            >
              Professional Photography &amp; Cinematography for Weddings, Events, Celebrations &amp; Every Special Moment.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/portfolio"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  fontFamily: 'var(--font-jakarta)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '1rem 2rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                className="hover:bg-gray-100 transition-colors"
              >
                Explore Our Work →
              </Link>
              <Link
                href="/contact"
                style={{
                  border: '1px solid rgba(255,255,255,0.6)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-jakarta)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '1rem 2rem',
                  textDecoration: 'none',
                }}
                className="hover:bg-white hover:text-black transition-colors"
              >
                Book Your Event →
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
            Scroll
          </span>
          <div style={{ width: '1px', height: '40px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
        </div>
      </section>

      {/* ── BRAND STATEMENT TEASER ── */}
      <section style={{ padding: '6rem var(--spacing-margin-mobile, 1.25rem)', backgroundColor: 'var(--color-surface, #fef9f2)', borderBottom: '1px solid var(--color-outline-variant, #ccc5bd)' }}>
        <div className="mx-auto px-5 md:px-16" style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-1">
              <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.15em', color: 'var(--color-secondary, #775927)', textTransform: 'uppercase', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                01 — The Art
              </p>
            </div>
            <div className="lg:col-span-7">
              <h2 style={{ fontFamily: 'var(--font-bodoni)', fontSize: 'clamp(2rem, 4vw, 3.75rem)', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--color-primary, #000000)' }}>
                We don&apos;t simply document<br /><em>your wedding.</em>
              </h2>
              <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '1.125rem', fontWeight: 300, lineHeight: 1.75, color: 'var(--color-on-surface-variant, #4a4640)', marginTop: '1.5rem', maxWidth: '40rem' }}>
                We capture the people, the emotions, and the moments between moments — creating photographs and films that tell your complete story.
              </p>
              <div className="mt-8">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#775927] hover:text-black transition-colors"
                >
                  Discover Our Heritage &amp; Philosophy →
                </Link>
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-6 pt-4">
              {[['450+', 'Events Captured'], ['10+', 'Years of Experience'], ['5000+', 'Happy Clients']].map(([num, label]) => (
                <div key={label} style={{ borderTop: '1px solid var(--color-outline-variant, #ccc5bd)', paddingTop: '1.25rem' }}>
                  <p style={{ fontFamily: 'var(--font-bodoni)', fontSize: '2.25rem', fontWeight: 400, color: 'var(--color-primary, #000000)' }}>{num}</p>
                  <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.15em', color: 'var(--color-on-surface-variant, #4a4640)', textTransform: 'uppercase', marginTop: '0.25rem' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SELECTED STORIES / PORTFOLIO HIGHLIGHTS ── */}
      <section id="portfolio" className="py-24 px-5 md:px-16" style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)', margin: '0 auto' }}>
        <div
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6"
          style={{ borderBottom: '1px solid var(--color-outline-variant, #ccc5bd)' }}
        >
          <div>
            <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.2em', color: 'var(--color-secondary, #775927)', textTransform: 'uppercase' }}>
              02 — Selected Stories
            </span>
            <h2 style={{ fontFamily: 'var(--font-bodoni)', fontSize: 'clamp(2rem, 4vw, 3.75rem)', fontWeight: 400, lineHeight: 1.15, color: 'var(--color-primary, #000000)', marginTop: '0.5rem' }}>
              Portfolio
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            {['All Works', 'Weddings', 'Pre-Wedding', 'Events', 'Portraits'].map((cat) => (
              <Link
                key={cat}
                href={cat === 'All Works' ? '/portfolio' : `/portfolio?category=${encodeURIComponent(cat)}`}
                style={{
                  padding: '0.375rem 1rem',
                  borderRadius: '9999px',
                  border: '1px solid var(--color-outline-variant, #ccc5bd)',
                  backgroundColor: cat === 'All Works' ? 'var(--color-primary, #000000)' : 'var(--color-surface-container, #f2ede7)',
                  color: cat === 'All Works' ? 'var(--color-on-primary, #ffffff)' : 'var(--color-on-surface, #1d1b18)',
                  fontFamily: 'var(--font-jakarta)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Full-bleed Carousel */}
      <section className="px-5 md:px-16" style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)', margin: '0 auto' }}>
        <PortfolioGrid initialMedia={mediaItems.length > 0 ? mediaItems : undefined} showFilter={false} />
      </section>

      <section className="pb-24 px-5 md:px-16" style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)', margin: '0 auto' }}>
        <div className="mt-12 text-center">
          <Link
            href="/portfolio"
            className="inline-block py-3 px-8 bg-black text-white text-xs font-semibold uppercase tracking-widest hover:bg-[#775927] transition-colors"
          >
            View Complete Portfolio Archive (84+ Works) →
          </Link>
        </div>
      </section>

      {/* ── CINEMATIC FILMS SPOTLIGHT ── */}
      <section id="films" className="py-24 bg-[#0d0d0c] text-white">
        <div className="mx-auto px-5 md:px-16" style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)' }}>
          <div
            className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}
          >
            <div>
              <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.2em', color: '#c49e62', textTransform: 'uppercase' }}>
                03 — Films
              </span>
              <h2 style={{ fontFamily: 'var(--font-bodoni)', fontSize: 'clamp(2rem, 4vw, 3.75rem)', fontWeight: 400, lineHeight: 1.15, color: '#ffffff', marginTop: '0.5rem' }}>
                Stories in Motion.
              </h2>
            </div>
            <Link
              href="/films"
              className="mt-4 md:mt-0 text-xs font-semibold tracking-widest uppercase text-[#c49e62] hover:text-white transition-colors"
            >
              Explore Cinema Archive &amp; Master Trailers →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {films.map((f, idx) => (
              <div key={idx} className="group cursor-pointer">
                <Link href="/films" className="block text-inherit no-underline">
                  <div className="relative aspect-[16/10] overflow-hidden mb-4 border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.img}
                      alt={f.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                      <span className="w-12 h-12 rounded-full bg-black/70 border border-white/40 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-[#775927] transition-all">
                        ▶
                      </span>
                    </div>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-bodoni)', fontSize: '1.25rem', color: '#ffffff' }}>
                    {f.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
                    {f.subtitle}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BESPOKE SERVICES SUMMARY ── */}
      <section id="services" className="py-24 px-5 md:px-16" style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)', margin: '0 auto' }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-[var(--color-outline-variant,#ccc5bd)]">
          <div>
            <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.2em', color: 'var(--color-secondary, #775927)', textTransform: 'uppercase' }}>
              04 — What We Do
            </span>
            <h2 style={{ fontFamily: 'var(--font-bodoni)', fontSize: 'clamp(2rem, 4vw, 3.75rem)', fontWeight: 400, lineHeight: 1.15, color: 'var(--color-primary, #000000)', marginTop: '0.5rem' }}>
              Bespoke Services
            </h2>
          </div>
          <Link
            href="/services"
            className="mt-4 md:mt-0 text-xs font-semibold tracking-widest uppercase text-[#775927] hover:text-black transition-colors"
          >
            Explore All Commission Tiers &amp; Pricing →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((s) => (
            <div key={s.num} className="p-8 border border-[var(--color-outline-variant,#ccc5bd)] bg-[var(--color-surface,#fef9f2)] flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-[#775927] font-bold">{s.num}</span>
                <h3 style={{ fontFamily: 'var(--font-bodoni)', fontSize: '1.5rem', color: 'var(--color-primary, #000000)', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                  {s.name}
                </h3>
                <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-on-surface-variant, #4a4640)' }}>
                  {s.desc}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Link href="/services" className="text-xs font-semibold uppercase tracking-wider text-black hover:text-[#775927]">
                  View Deliverables →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PHYSICAL ATELIER SPOTLIGHT ── */}
      <section id="studio" className="py-24 bg-[var(--color-surface-container-low,#f8f3ec)] border-y border-[var(--color-outline-variant,#ccc5bd)]">
        <div className="mx-auto px-5 md:px-16" style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 relative aspect-[4/3] overflow-hidden border border-[var(--color-outline-variant,#ccc5bd)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80"
                alt="Physical Atelier Interior"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-6 space-y-6">
              <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.2em', color: 'var(--color-secondary, #775927)', textTransform: 'uppercase' }}>
                05 — The Studio
              </span>
              <h2 style={{ fontFamily: 'var(--font-bodoni)', fontSize: 'clamp(2rem, 4vw, 3.25rem)', fontWeight: 400, lineHeight: 1.15, color: 'var(--color-primary, #000000)' }}>
                Physical Atelier &amp; Silver Halide Darkroom
              </h2>
              <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '1rem', lineHeight: 1.7, color: 'var(--color-on-surface-variant, #4a4640)', fontStyle: 'normal' }}>
                Located in Pune, Maharashtra, our studio is dedicated to quiet contemplation, tactile print selection, and personal consultations. Experience our handcrafted Italian leather albums and darkroom prints in person.
              </p>
              <div className="space-y-1 text-sm font-sans text-gray-700">
                <p><strong>Address:</strong> Pune, Maharashtra, India</p>
                <p><strong>Hours:</strong> Monday – Saturday: 10:00 AM – 7:00 PM</p>
              </div>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  href="/studio"
                  className="py-3 px-6 bg-black text-white text-xs font-semibold uppercase tracking-widest hover:bg-[#775927] transition-colors"
                >
                  Explore The Atelier Studio →
                </Link>
                <a
                  href="https://wa.me/919999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-6 border border-black text-black text-xs font-semibold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                >
                  WhatsApp Concierge
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CLIENT TESTIMONIALS PREVIEW ── */}
      <section id="testimonials" className="py-24 px-5 md:px-16" style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)', margin: '0 auto' }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-[var(--color-outline-variant,#ccc5bd)]">
          <div>
            <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.2em', color: 'var(--color-secondary, #775927)', textTransform: 'uppercase' }}>
              06 — Words From Our Clients
            </span>
            <h2 style={{ fontFamily: 'var(--font-bodoni)', fontSize: 'clamp(2rem, 4vw, 3.75rem)', fontWeight: 400, lineHeight: 1.15, color: 'var(--color-primary, #000000)', marginTop: '0.5rem' }}>
              Client Accolades
            </h2>
          </div>
          <Link
            href="/testimonials"
            className="mt-4 md:mt-0 text-xs font-semibold tracking-widest uppercase text-[#775927] hover:text-black transition-colors"
          >
            Read All Client Accolades &amp; Stories →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div key={idx} className="p-8 border border-[var(--color-outline-variant,#ccc5bd)] bg-[var(--color-surface,#fef9f2)] flex flex-col justify-between">
              <p style={{ fontFamily: 'var(--font-bodoni)', fontSize: '1.125rem', lineHeight: 1.6, fontStyle: 'italic', color: 'var(--color-primary, #000000)', marginBottom: '1.5rem' }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <p style={{ fontFamily: 'var(--font-bodoni)', fontSize: '1rem', fontWeight: 500, color: 'var(--color-primary, #000000)' }}>
                  {t.author}
                </p>
                <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-secondary, #775927)', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                  {t.event}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CALL-TO-ACTION BANNER ── */}
      <section className="py-20 bg-black text-white text-center">
        <div className="mx-auto px-5 md:px-16" style={{ maxWidth: '48rem' }}>
          <p className="font-sans text-xs uppercase tracking-[0.25em] text-[#c49e62] mb-3">
            Commission Availability
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-normal leading-tight">
            Your Story Only Happens Once.<br /><em>Make It Last.</em>
          </h2>
          <p className="font-sans text-sm text-white/70 mt-4 leading-relaxed font-light">
            We are currently reviewing and accepting commissions for the 2026 &amp; 2027 wedding seasons.
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-block py-3.5 px-8 bg-white text-black text-xs font-semibold uppercase tracking-widest hover:bg-[#c49e62] hover:text-white transition-colors"
            >
              Book Your Date →
            </Link>
          </div>
        </div>
      </section>

      {/* ── INQUIRE BOOKING PORTAL ── */}
      <section id="contact" className="py-24 px-5 md:px-16" style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)', margin: '0 auto' }}>
        <div className="text-center mb-12">
          <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.2em', color: 'var(--color-secondary, #775927)', textTransform: 'uppercase' }}>
            07 — Get In Touch
          </span>
          <h2 style={{ fontFamily: 'var(--font-bodoni)', fontSize: 'clamp(2rem, 4vw, 3.75rem)', fontWeight: 400, lineHeight: 1.15, color: 'var(--color-primary, #000000)', marginTop: '0.5rem' }}>
            Inquire &amp; Book Your Event
          </h2>
          <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '1rem', color: 'var(--color-on-surface-variant, #4a4640)', marginTop: '0.75rem', maxWidth: '36rem', margin: '0.75rem auto 0' }}>
            Tell us about your celebration, your vision, and the moments you want preserved forever.
          </p>
        </div>

        <InquireForm />
      </section>

      <Footer />
    </>
  );
}
