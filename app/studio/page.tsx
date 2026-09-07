import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/public/PageHeader';
import Link from 'next/link';

export const metadata = {
  title: "The Physical Atelier & Darkroom | Brother's Photography",
  description: "Visit our creative sanctuary and silver halide darkroom in Pune, Maharashtra. Schedule a private album consultation.",
};

export default function StudioPage() {
  return (
    <>
      <Navbar />
      <main
        className="min-h-screen py-16 px-5 md:px-16"
        style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)', margin: '0 auto' }}
      >
        <PageHeader
          tag="05 — The Physical Atelier"
          title="The Studio &amp; Physical Darkroom"
          subtitle="A sanctuary designed for quiet contemplation, tactile print selection, and private matrimonial album consultations."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Studio', href: '/studio' },
          ]}
        />

        {/* Hero Studio Imagery & Narrative */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
          <div className="lg:col-span-7 relative aspect-[16/10] overflow-hidden border border-[var(--color-outline-variant,#ccc5bd)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1400&q=80"
              alt="Physical Atelier Interior in Pune"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-sm text-white px-4 py-2 text-xs font-sans uppercase tracking-widest">
              Natural Light Studio Bay &amp; Print Salon · Pune
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-semibold tracking-[0.2em] text-[var(--color-secondary,#775927)] uppercase">
              Creative Sanctuary
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-black leading-snug">
              A place to create. A place to meet. A place to remember.
            </h2>
            <p className="font-sans text-sm text-[var(--color-on-surface-variant,#4a4640)] leading-relaxed font-light">
              Nestled in Pune, Maharashtra, our atelier is more than a commercial photography studio. It is a working sanctuary equipped with controlled natural daylight shooting bays, calibrated color grading suites, and our dedicated silver halide darkroom where analog negatives are inspected and processed.
            </p>
            <p className="font-sans text-sm text-[var(--color-on-surface-variant,#4a4640)] leading-relaxed font-light">
              We warmly invite couples and families to visit our studio by appointment to view sample Italian leather monographs, touch fine-art cotton rag papers, and discuss their celebration over artisanal coffee.
            </p>

            <div className="pt-4 flex flex-wrap gap-4">
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-6 bg-[#128C7E] text-white text-xs font-semibold tracking-widest uppercase hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <span>💬</span> WhatsApp Atelier
              </a>
              <Link
                href="/contact?type=consultation"
                className="py-3 px-6 bg-black text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#775927] transition-colors"
              >
                Book Private Visit →
              </Link>
            </div>
          </div>
        </section>

        {/* Studio Details & Visiting Hours */}
        <section className="mb-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 border border-[var(--color-outline-variant,#ccc5bd)] bg-[var(--color-surface-container-low,#f8f3ec)]">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#775927]">Location</span>
            <h3 className="font-serif text-xl text-black mt-2 mb-3">Pune Atelier</h3>
            <p className="font-sans text-xs text-gray-600 leading-relaxed font-light">
              Brother&apos;s Photography Atelier<br />
              Koregaon Park / Pune Central<br />
              Maharashtra 411001, India
            </p>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-xs font-semibold uppercase tracking-wider text-black underline hover:text-[#775927]"
            >
              Get Driving Directions ↗
            </a>
          </div>

          <div className="p-8 border border-[var(--color-outline-variant,#ccc5bd)] bg-[var(--color-surface-container-low,#f8f3ec)]">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#775927]">Hours &amp; Access</span>
            <h3 className="font-serif text-xl text-black mt-2 mb-3">Visiting Hours</h3>
            <div className="space-y-1.5 font-sans text-xs text-gray-600 font-light">
              <p><strong className="font-semibold text-black">Monday – Friday:</strong> 10:00 AM – 7:00 PM</p>
              <p><strong className="font-semibold text-black">Saturday:</strong> 11:00 AM – 6:00 PM</p>
              <p><strong className="font-semibold text-black">Sunday:</strong> By Prior Appointment Only</p>
            </div>
            <p className="font-sans text-[0.6875rem] text-gray-500 mt-4 italic">
              Private consultations are held in our dedicated salon suite.
            </p>
          </div>

          <div className="p-8 border border-[var(--color-outline-variant,#ccc5bd)] bg-[var(--color-surface-container-low,#f8f3ec)]">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#775927]">Contact Concierge</span>
            <h3 className="font-serif text-xl text-black mt-2 mb-3">Direct Channels</h3>
            <div className="space-y-2 font-sans text-xs text-gray-600 font-light">
              <p><span className="text-gray-400">Direct Line:</span> <a href="tel:+919999999999" className="text-black font-semibold">+91 99999 99999</a></p>
              <p><span className="text-gray-400">Email:</span> <a href="mailto:concierge@brothersatelier.com" className="text-black">concierge@brothersatelier.com</a></p>
              <p><span className="text-gray-400">Response Time:</span> Under 24 hours</p>
            </div>
          </div>
        </section>

        {/* Studio Facilities */}
        <section className="mb-20 p-8 md:p-12 bg-white border border-[var(--color-outline-variant,#ccc5bd)]">
          <h3 className="font-serif text-2xl text-black mb-6">Atelier Facilities &amp; Equipment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border-t border-black/20 pt-3">
              <p className="font-serif text-lg text-black">Silver Halide Darkroom</p>
              <p className="font-sans text-xs text-gray-500 mt-1">Fiber print washing, chemical development, and negative archival storage.</p>
            </div>
            <div className="border-t border-black/20 pt-3">
              <p className="font-serif text-lg text-black">Calibrated Grading Suite</p>
              <p className="font-sans text-xs text-gray-500 mt-1">EIZO ColorEdge monitors calibrated to DCI-P3 and Adobe RGB standards.</p>
            </div>
            <div className="border-t border-black/20 pt-3">
              <p className="font-serif text-lg text-black">Album Leather Lounge</p>
              <p className="font-sans text-xs text-gray-500 mt-1">Sample library of Tuscan leathers, Japanese silks, and foil stamps.</p>
            </div>
            <div className="border-t border-black/20 pt-3">
              <p className="font-serif text-lg text-black">Gear Vault</p>
              <p className="font-sans text-xs text-gray-500 mt-1">Leica M, Hasselblad medium format, Arri cinema bodies, and Cooke prime lenses.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
