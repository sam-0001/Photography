import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/public/PageHeader';
import Link from 'next/link';

export const metadata = {
  title: "Bespoke Services & Commission Investment | Brother's Photography",
  description: "Editorial wedding documentation, pre-wedding destination sessions, cinematic films, and hand-bound archival albums.",
};

const COMMISSION_TIERS = [
  {
    tier: 'Tier I',
    name: 'The Monograph Collection',
    subtitle: 'Single-Day Nuptial Monograph',
    description: 'Designed for refined single-day celebrations requiring thorough, unobtrusive master documentation.',
    deliverables: [
      '2 Master Photographers for full-day coverage (up to 10 hours)',
      '600–800 hand-graded archival digital plates in full resolution',
      'Private Encrypted Client Gallery Vault with 4-Digit PIN Security',
      'Online client proofing, download rights & print reproduction license',
      'Curated sneak peek gallery delivered within 72 hours of event',
      'Complete monograph delivery within 4 weeks',
    ],
    recommendedFor: 'Intimate estate weddings, single-day celebrations, and city ceremonies.',
  },
  {
    tier: 'Tier II',
    name: 'The Destination Atelier',
    subtitle: 'Multi-Day Nuptials & Cinema Master',
    popular: true,
    description: 'Our most sought-after commission tier for comprehensive multi-day celebrations and destination weddings worldwide.',
    deliverables: [
      'Principal Photographer + 2 Associate Masters (up to 3 consecutive days)',
      '1 Dedicated Motion Cinema Director & Aerial Drone Cinematographer',
      '1200+ curated and color-mastered fine-art digital plates',
      '4K Anamorphic Wedding Highlight Film (5–7 minutes) + Full Ceremony Reel',
      'Private Encrypted Client Gallery Vault with download capabilities and QR cards',
      'One 12x12 Hand-bound Italian Leather Heirlooms Album (40 spreads, 80 pages)',
      'Full RAW archival negative preservation on custom physical USB vault',
    ],
    recommendedFor: 'Destination weddings in Rajasthan, Goa, Lake Como, Tuscany, and South East Asia.',
  },
  {
    tier: 'Tier III',
    name: 'Haute Couture Monograph',
    subtitle: 'Full Celebratory Week & Director Exclusive',
    description: 'An all-inclusive commission reserved for high-profile multi-day matrimonial galas requiring complete studio devotion.',
    deliverables: [
      'Exclusive Studio Principal & full 6-person photography and cinema entourage',
      'Full coverage of all rites, galas, afterparties, and private preparation sessions',
      '35mm Analog Film Negatives + High-Resolution Master Scans included',
      'Director’s Cut Feature Film (18–25 minutes) + 60-second teaser reel',
      'Three Hand-bound Heirloom Albums: 1 Couple Master + 2 Parent Companion Editions',
      'Private Darkroom Print Selection Salon at our Pune Atelier',
      'Expedited 14-day turnaround on all deliverables',
    ],
    recommendedFor: 'Royal heritage weddings, week-long celebrations, and multi-cultural nuptials.',
  },
];

const DISCIPLINES = [
  { num: '01', name: 'Weddings', desc: 'Comprehensive multi-day coverage preserving traditional rites, emotional candids, and grand celebrations.' },
  { num: '02', name: 'Pre-Weddings', desc: 'Cinematic destination sessions in Venice, Paris, Como, Udaipur, and Mumbai.' },
  { num: '03', name: 'Celebrations', desc: 'Engagements, milestone anniversaries, grand galas, and bespoke family gatherings.' },
  { num: '04', name: 'Portraits', desc: 'Editorial fine-art portraiture for couples, individuals, and multi-generational family heirlooms.' },
  { num: '05', name: 'Cinematic Films', desc: 'Anamorphic 4K cinema films with documentary depth, intimate sound design, and master pacing.' },
  { num: '06', name: 'Archival Albums', desc: 'Handcrafted Italian leather albums, acid-free cotton rag papers, and bespoke presentation boxes.' },
];

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen py-16 px-5 md:px-16" style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)', margin: '0 auto' }}>
        <PageHeader
          tag="04 — What We Do"
          title="Bespoke Services & Commission Investment"
          subtitle="Master photography, cinematic motion pictures, and heirloom print monographs tailored to the scale of your celebration."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services' },
          ]}
        />

        {/* Commission Tiers Breakdown */}
        <section className="mb-20">
          <div className="mb-10">
            <span className="text-xs font-semibold tracking-[0.2em] text-[var(--color-secondary,#775927)] uppercase">
              Commission Architecture
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-black mt-2">
              Three Curated Commission Tiers
            </h2>
            <p className="font-sans text-sm text-gray-600 mt-2 max-w-2xl font-light">
              We accept a limited number of commissions each season to ensure absolute artisanal dedication to each project.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {COMMISSION_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`p-8 border flex flex-col justify-between transition-all duration-300 ${
                  tier.popular
                    ? 'border-[#775927] bg-[#fdfbf7] shadow-md relative'
                    : 'border-[var(--color-outline-variant,#ccc5bd)] bg-[var(--color-surface,#fef9f2)]'
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-8 bg-[#775927] text-white text-[0.625rem] font-bold tracking-widest uppercase py-1 px-3">
                    Flagship Atelier Choice
                  </span>
                )}

                <div>
                  <span className="text-xs font-semibold tracking-widest uppercase text-[#775927]">{tier.tier}</span>
                  <h3 className="font-serif text-2xl text-black mt-1">{tier.name}</h3>
                  <p className="font-sans text-xs text-gray-500 uppercase tracking-wider mt-1">{tier.subtitle}</p>
                  <p className="font-sans text-sm text-gray-600 mt-4 leading-relaxed font-light">{tier.description}</p>

                  <div className="my-6 border-t border-gray-200 pt-6">
                    <p className="font-sans text-xs font-semibold uppercase tracking-wider text-black mb-3">
                      Included Deliverables:
                    </p>
                    <ul className="space-y-2.5 text-xs text-gray-600">
                      {tier.deliverables.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#775927] font-bold">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <p className="font-sans text-[0.6875rem] text-gray-500 mb-4 italic">
                    Ideal for: {tier.recommendedFor}
                  </p>
                  <Link
                    href={`/contact?service=${encodeURIComponent(tier.name)}`}
                    className={`block w-full text-center py-3 px-4 text-xs font-semibold uppercase tracking-widest transition-colors ${
                      tier.popular
                        ? 'bg-black text-white hover:bg-[#775927]'
                        : 'border border-black text-black hover:bg-black hover:text-white'
                    }`}
                  >
                    Inquire For This Tier →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Six Core Disciplines */}
        <section className="mb-20 p-8 md:p-12 bg-[var(--color-surface-container-low,#f8f3ec)] border border-[var(--color-outline-variant,#ccc5bd)]">
          <div className="mb-10">
            <span className="text-xs font-semibold tracking-[0.2em] text-[var(--color-secondary,#775927)] uppercase">
              Core Disciplines
            </span>
            <h3 className="font-serif text-2xl md:text-3xl text-black mt-2">
              Comprehensive Photography &amp; Cinematography Offerings
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {DISCIPLINES.map((d) => (
              <div key={d.num} className="border-t border-black/20 pt-4">
                <span className="font-mono text-xs text-[#775927] font-bold">{d.num}</span>
                <h4 className="font-serif text-xl text-black mt-1 mb-2">{d.name}</h4>
                <p className="font-sans text-xs text-gray-600 leading-relaxed font-light">{d.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Timetable of Delivery */}
        <section className="mb-20">
          <div className="mb-8">
            <span className="text-xs font-semibold tracking-[0.2em] text-[var(--color-secondary,#775927)] uppercase">
              Artisanal Timeline
            </span>
            <h3 className="font-serif text-2xl md:text-3xl text-black mt-2">
              Production &amp; Curation Schedule
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border border-gray-200 bg-white">
              <span className="text-xs text-gray-400 font-semibold uppercase">Step 1</span>
              <p className="font-serif text-2xl text-black mt-2">72 Hours</p>
              <p className="font-sans text-xs text-gray-600 mt-2">Curated sneak peek preview album delivered directly to your phone.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <span className="text-xs text-gray-400 font-semibold uppercase">Step 2</span>
              <p className="font-serif text-2xl text-black mt-2">4–6 Weeks</p>
              <p className="font-sans text-xs text-gray-600 mt-2">Full collection of high-resolution digital plates uploaded to your private vault.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <span className="text-xs text-gray-400 font-semibold uppercase">Step 3</span>
              <p className="font-serif text-2xl text-black mt-2">8–10 Weeks</p>
              <p className="font-sans text-xs text-gray-600 mt-2">Cinematic master films, sound design, and color grading complete in 4K.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <span className="text-xs text-gray-400 font-semibold uppercase">Step 4</span>
              <p className="font-serif text-2xl text-black mt-2">10–12 Weeks</p>
              <p className="font-sans text-xs text-gray-600 mt-2">Hand-bound Italian leather albums hand-delivered or shipped internationally.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 border-t border-[var(--color-outline-variant,#ccc5bd)] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="font-serif text-2xl text-black">Commission an Archival Monograph</h4>
            <p className="font-sans text-sm text-gray-600 mt-1">Connect with our studio concierge to check date availability and schedule a consultation.</p>
          </div>
          <Link
            href="/contact"
            className="py-3.5 px-8 bg-black text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#775927] transition-colors"
          >
            Start Your Inquiry →
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
