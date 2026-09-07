import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/public/PageHeader';
import Link from 'next/link';

export const metadata = {
  title: "Fine-Art Archival Albums | Brother's Photography Atelier",
  description: "Handcrafted Italian leather albums, acid-free cotton rag printing, and bespoke heirloom monographs.",
};

export default function AlbumsPage() {
  return (
    <>
      <Navbar />
      <main
        className="min-h-screen py-16 px-5 md:px-16"
        style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)', margin: '0 auto' }}
      >
        <PageHeader
          tag="08 — Heirloom Print Works"
          title="Fine-Art Archival Albums &amp; Monographs"
          subtitle="Hand-bound in Florence with full-grain Tuscan leather, archival pigment printing on acid-free cotton rag, and heirloom presentation cases."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Albums', href: '/albums' },
          ]}
        />

        {/* Hero Feature */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
          <div className="lg:col-span-7 relative aspect-[16/10] overflow-hidden border border-[var(--color-outline-variant,#ccc5bd)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&q=80"
              alt="Handcrafted Italian Leather Wedding Album"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-semibold tracking-[0.2em] text-[var(--color-secondary,#775927)] uppercase">
              Tactile Longevity
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-black leading-tight">
              An heirloom designed to outlive digital screens.
            </h2>
            <p className="font-sans text-sm text-[var(--color-on-surface-variant,#4a4640)] leading-relaxed font-light">
              Digital files reside on clouds and hard drives, but an authentic archival album is an enduring tactile presence in your family home. Each volume is individually designed by our master layout artists, printed using pigment inks rated for 150+ years of permanence, and bound by master bookbinders.
            </p>

            <div className="pt-4 border-t border-gray-200">
              <Link
                href="/contact?service=Albums"
                className="inline-block py-3 px-6 bg-black text-white text-xs font-semibold uppercase tracking-widest hover:bg-[#775927] transition-colors"
              >
                Inquire For Custom Album →
              </Link>
            </div>
          </div>
        </section>

        {/* Album Specifications */}
        <section className="mb-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 border border-[var(--color-outline-variant,#ccc5bd)] bg-[var(--color-surface-container-low,#f8f3ec)]">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#775927]">Materials</span>
            <h3 className="font-serif text-xl text-black mt-2 mb-3">Tuscan Full-Grain Leather</h3>
            <p className="font-sans text-xs text-gray-600 leading-relaxed font-light">
              Ethically sourced vegetable-tanned Italian leathers, French linen, and Japanese bookbinding silks available in curated earth tones.
            </p>
          </div>

          <div className="p-8 border border-[var(--color-outline-variant,#ccc5bd)] bg-[var(--color-surface-container-low,#f8f3ec)]">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#775927]">Print Quality</span>
            <h3 className="font-serif text-xl text-black mt-2 mb-3">Museum Cotton Rag</h3>
            <p className="font-sans text-xs text-gray-600 leading-relaxed font-light">
              Heavyweight 310gsm Hahnemühle Photo Rag paper with archival pigment inks delivering rich blacks and luminous skin tones.
            </p>
          </div>

          <div className="p-8 border border-[var(--color-outline-variant,#ccc5bd)] bg-[var(--color-surface-container-low,#f8f3ec)]">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#775927]">Curation</span>
            <h3 className="font-serif text-xl text-black mt-2 mb-3">Bespoke Monograph Layout</h3>
            <p className="font-sans text-xs text-gray-600 leading-relaxed font-light">
              Seamless lay-flat panoramic binding with custom foil debossing of couple names, wedding date, and monogram.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
