import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/public/PageHeader';
import Link from 'next/link';

export const metadata = {
  title: "Studio Heritage & Philosophy | Brother's Photography Atelier",
  description: "A decade of archival documentation, fine-art medium format photography, and visual poetry for high-profile celebrations.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen py-16 px-5 md:px-16" style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)', margin: '0 auto' }}>
        <PageHeader
          tag="01 — Heritage & Philosophy"
          title="Studio Heritage & Philosophy"
          subtitle="Archival integrity, medium format analog craft, and timeless editorial composition for monumental celebrations."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'About', href: '/about' },
          ]}
        />

        {/* Narrative Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
          <div className="lg:col-span-6 relative aspect-[4/5] overflow-hidden border border-[var(--color-outline-variant,#ccc5bd)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1554080353-a576cf803bda?w=1000&q=80"
              alt="Studio Principal & Master Photographer"
              className="w-full h-full object-cover"
              style={{ objectPosition: 'top center' }}
            />
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
              <p className="font-serif text-xl">The Brother&apos;s Atelier</p>
              <p className="font-sans text-xs tracking-widest uppercase text-white/70">Est. 2014 · Pune Atelier</p>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-semibold tracking-[0.2em] text-[var(--color-secondary,#775927)] uppercase">
              Our Vision
            </span>
            <h2 className="font-serif text-3xl md:text-5xl text-[var(--color-primary,#000000)] leading-tight">
              We don&apos;t simply document your wedding; we craft visual heirlooms.
            </h2>
            <p className="font-sans text-base text-[var(--color-on-surface-variant,#4a4640)] leading-relaxed font-light">
              Founded in 2014, Brother&apos;s Photography Atelier was born from a singular passion: treating wedding and portrait photography not as transactional record-keeping, but as fine-art monograph creation. Over the past decade, we have traveled across India, Europe, and Asia to capture celebrations where intimate emotion meets grand architectural beauty.
            </p>
            <p className="font-sans text-base text-[var(--color-on-surface-variant,#4a4640)] leading-relaxed font-light">
              Our studio philosophy marries the tactile soul of analog 35mm and medium format film with the uncompromising dynamic range of modern digital cinema sensors. Every frame is hand-curated, color-calibrated, and preserved for generations.
            </p>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-[var(--color-outline-variant,#ccc5bd)]">
              <div>
                <p className="font-serif text-3xl text-black">450+</p>
                <p className="font-sans text-[0.625rem] font-semibold tracking-wider text-gray-500 uppercase mt-1">Events Captured</p>
              </div>
              <div>
                <p className="font-serif text-3xl text-black">10+</p>
                <p className="font-sans text-[0.625rem] font-semibold tracking-wider text-gray-500 uppercase mt-1">Years Heritage</p>
              </div>
              <div>
                <p className="font-serif text-3xl text-black">5000+</p>
                <p className="font-sans text-[0.625rem] font-semibold tracking-wider text-gray-500 uppercase mt-1">Happy Clients</p>
              </div>
              <div>
                <p className="font-serif text-3xl text-black">14</p>
                <p className="font-sans text-[0.625rem] font-semibold tracking-wider text-gray-500 uppercase mt-1">Countries Documented</p>
              </div>
            </div>
          </div>
        </section>

        {/* The Atelier Craft */}
        <section className="mb-20 p-8 md:p-12 bg-[var(--color-surface-container-low,#f8f3ec)] border border-[var(--color-outline-variant,#ccc5bd)]">
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-semibold tracking-[0.2em] text-[var(--color-secondary,#775927)] uppercase">
              Analog &amp; Digital Precision
            </span>
            <h3 className="font-serif text-2xl md:text-4xl text-black mt-2">
              The Master Optics &amp; Darkroom Discipline
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border-t border-black/20 pt-4">
              <h4 className="font-serif text-xl mb-2">Medium Format &amp; 35mm</h4>
              <p className="font-sans text-xs text-gray-600 leading-relaxed">
                Leica M11-P, Hasselblad 500C/M, and custom rangefinder glass capturing natural skin tones with genuine organic grain and dimensional depth.
              </p>
            </div>
            <div className="border-t border-black/20 pt-4">
              <h4 className="font-serif text-xl mb-2">Cinematic Motion Picture</h4>
              <p className="font-sans text-xs text-gray-600 leading-relaxed">
                Arri Alexa Mini LF paired with Cooke Anamorphic optics for cinematic cadence, intimate audio capture, and master color grading.
              </p>
            </div>
            <div className="border-t border-black/20 pt-4">
              <h4 className="font-serif text-xl mb-2">Archival Pigment Printing</h4>
              <p className="font-sans text-xs text-gray-600 leading-relaxed">
                Handcrafted Italian leather albums and museum-grade cotton rag prints rated for 150+ years of archival longevity without fading.
              </p>
            </div>
          </div>
        </section>

        {/* Forward Navigation CTAs */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-6 py-8 border-t border-[var(--color-outline-variant,#ccc5bd)]">
          <div>
            <h4 className="font-serif text-xl text-black">Ready to explore our curated collections?</h4>
            <p className="font-sans text-xs text-gray-500 mt-1">Browse monographs across weddings, destination sessions, and cinema.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/portfolio"
              className="py-3 px-6 bg-black text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#775927] transition-colors"
            >
              Explore Portfolio →
            </Link>
            <Link
              href="/contact"
              className="py-3 px-6 border border-black text-black text-xs font-semibold tracking-widest uppercase hover:bg-black hover:text-white transition-colors"
            >
              Inquire Now
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
