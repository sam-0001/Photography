import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/public/PageHeader';
import Link from 'next/link';

export const metadata = {
  title: "Client Accolades & Testimonials | Brother's Photography Atelier",
  description: "Read authentic stories and reviews from couples and families whose most treasured milestones we have documented.",
};

const TESTIMONIALS_DATA = [
  {
    quote: "Every photograph brought the day back to us. Brother's Photography truly captured the emotions we felt, from the quiet morning vows to the exuberant waltz under the chandeliers. Looking through our monograph feels like re-living the most joyous hours of our lives.",
    author: 'Rahul & Priya',
    event: 'The Two-Continent Nuptials · Pune & Lake Como',
    year: '2025',
    rating: 5,
  },
  {
    quote: "Our pre-wedding shoot in Venice was an absolute dream. The team was unobtrusive, gentle with direction, and made us feel entirely at ease in front of the camera. The resulting analog plates are framed all across our home.",
    author: 'Riya & Aarav',
    event: 'Pre-Wedding Cinema & Editorial · Venice, Italy',
    year: '2026',
    rating: 5,
  },
  {
    quote: "The team was professional, creative, and delivered beyond our expectations. Their eye for subtle candids and architectural symmetry is peerless. We could not recommend Brother's Photography Atelier more highly.",
    author: 'Meera & Dev',
    event: 'Goa Coastal Celebration & Engagement',
    year: '2025',
    rating: 5,
  },
  {
    quote: "Documenting our royal wedding at the Udaipur City Palace required navigating complex heritage lighting and hundreds of guests. The Brother's team delivered a cinematic master film and leather albums that will be family heirlooms for centuries.",
    author: 'Ananya & Kabir',
    event: 'Heritage Matrimonial Monograph · Udaipur',
    year: '2024',
    rating: 5,
  },
  {
    quote: "From the initial consultation at their Pune studio to the final hand-delivery of our Italian leather monograph, the bespoke concierge experience was impeccable. Every detail reflected true artistic mastery.",
    author: 'Vikram & Natasha',
    event: 'Destination Wedding Gala · Alibaug Estate',
    year: '2026',
    rating: 5,
  },
  {
    quote: "Their mastery of 35mm film negatives and anamorphic cinema gave our wedding film the organic warmth and timeless elegance of classic Italian cinema. Pure visual poetry.",
    author: 'Matteo & Sofia',
    event: 'Villa d’Este Nuptials · Lake Como',
    year: '2024',
    rating: 5,
  },
];

const FAQS = [
  {
    q: "How far in advance should we secure our date with the Atelier?",
    a: "Because we accept only a limited number of commissions each season to maintain our artisanal standard, couples typically reserve their date 6 to 12 months in advance.",
  },
  {
    q: "Do you travel across India and internationally for destination weddings?",
    a: "Yes. Destination celebrations account for over half of our monographs. We handle all travel logistics and equipment carnets seamlessly across India, Europe, Asia, and beyond.",
  },
  {
    q: "When can we expect our private client gallery and heirloom albums?",
    a: "You receive a curated sneak peek within 72 hours of your celebration. The complete high-resolution digital collection is uploaded to your private vault in 4–6 weeks, and hand-bound Italian leather albums are delivered in 10–12 weeks.",
  },
];

export default function TestimonialsPage() {
  return (
    <>
      <Navbar />
      <main
        className="min-h-screen py-16 px-5 md:px-16"
        style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)', margin: '0 auto' }}
      >
        <PageHeader
          tag="06 — Words From Our Clients"
          title="Client Accolades &amp; Testimonials"
          subtitle="Reflections, praise, and authentic stories from couples whose milestones we have had the honor of preserving."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Testimonials', href: '/testimonials' },
          ]}
        />

        {/* Testimonials Grid */}
        <section className="mb-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TESTIMONIALS_DATA.map((t, idx) => (
            <div
              key={idx}
              className="p-8 border border-[var(--color-outline-variant,#ccc5bd)] bg-[var(--color-surface,#fef9f2)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[#775927] text-sm tracking-widest">
                    {'★'.repeat(t.rating)}
                  </span>
                  <span className="text-[0.625rem] font-sans font-semibold tracking-wider text-gray-400 uppercase">
                    {t.year}
                  </span>
                </div>

                <p className="font-serif text-base md:text-lg text-black leading-relaxed italic mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="font-serif text-lg text-black font-medium">{t.author}</p>
                <p className="font-sans text-xs text-[#775927] mt-0.5">{t.event}</p>
              </div>
            </div>
          ))}
        </section>

        {/* FAQ Section */}
        <section className="mb-20 p-8 md:p-12 bg-[var(--color-surface-container-low,#f8f3ec)] border border-[var(--color-outline-variant,#ccc5bd)]">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-semibold tracking-[0.2em] text-[var(--color-secondary,#775927)] uppercase">
              Frequently Inquired
            </span>
            <h3 className="font-serif text-2xl md:text-3xl text-black mt-2">
              Common Questions for Matrimonial Commissions
            </h3>
          </div>

          <div className="space-y-6 max-w-3xl">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="border-b border-black/15 pb-6">
                <h4 className="font-serif text-lg text-black mb-2">{faq.q}</h4>
                <p className="font-sans text-sm text-gray-600 leading-relaxed font-light">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 border-t border-[var(--color-outline-variant,#ccc5bd)] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="font-serif text-2xl text-black">Begin Your Matrimonial Monograph</h4>
            <p className="font-sans text-sm text-gray-600 mt-1">Let us discuss how we can document your story with archival permanence.</p>
          </div>
          <Link
            href="/contact"
            className="py-3.5 px-8 bg-black text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#775927] transition-colors"
          >
            Inquire For Your Date →
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
