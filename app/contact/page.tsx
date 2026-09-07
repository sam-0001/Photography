import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/public/PageHeader';
import InquireForm from '../components/InquireForm';

export const metadata = {
  title: "Inquire & Commission Booking | Brother's Photography Atelier",
  description: "Reserve your celebration date with Brother's Photography Atelier. Direct booking inquiries, studio concierge, and consultations.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main
        className="min-h-screen py-16 px-5 md:px-16"
        style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)', margin: '0 auto' }}
      >
        <PageHeader
          tag="07 — Get In Touch"
          title="Inquire &amp; Commission Booking"
          subtitle="We accept a limited number of commissions each season to ensure absolute devotion to every monograph. Tell us about your celebration."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Contact', href: '/contact' },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-20">
          {/* Left Column: Studio Concierge */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className="text-xs font-semibold tracking-[0.2em] text-[var(--color-secondary,#775927)] uppercase">
                Studio Concierge
              </span>
              <h2 className="font-serif text-3xl text-black mt-2">
                Let Us Preserve Your Milestone
              </h2>
              <p className="font-sans text-sm text-[var(--color-on-surface-variant,#4a4640)] mt-3 leading-relaxed font-light">
                Whether you are planning an intimate pre-wedding session along the Venetian canals, a destination nuptial in Lake Como or Rajasthan, or a private family monograph, our studio director is available to discuss your vision.
              </p>
            </div>

            <div className="p-6 border border-[var(--color-outline-variant,#ccc5bd)] bg-[var(--color-surface-container-low,#f8f3ec)] space-y-4">
              <h3 className="font-serif text-xl text-black">Direct Inquiries</h3>
              <div className="space-y-3 font-sans text-xs text-gray-700">
                <p>
                  <strong className="text-black uppercase tracking-wider block text-[0.625rem]">Studio Telephone:</strong>
                  <a href="tel:+919999999999" className="text-sm font-medium hover:underline">+91 99999 99999</a>
                </p>
                <p>
                  <strong className="text-black uppercase tracking-wider block text-[0.625rem]">Concierge Email:</strong>
                  <a href="mailto:concierge@brothersatelier.com" className="text-sm font-medium hover:underline">concierge@brothersatelier.com</a>
                </p>
                <p>
                  <strong className="text-black uppercase tracking-wider block text-[0.625rem]">Physical Atelier:</strong>
                  <span className="text-sm block">Pune, Maharashtra, India</span>
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 flex flex-col gap-2">
                <a
                  href="https://wa.me/919999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center py-2.5 px-4 bg-[#128C7E] text-white text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  Direct WhatsApp Chat ↗
                </a>
              </div>
            </div>

            <div className="p-6 border border-gray-200 bg-white space-y-2 font-sans text-xs text-gray-600">
              <p className="font-semibold text-black uppercase tracking-wider text-[0.625rem]">
                Booking Availability Notice
              </p>
              <p>
                Currently reviewing and accepting commissions for the <strong>2026 &amp; 2027</strong> wedding seasons.
              </p>
              <p className="text-gray-500 italic pt-1">
                Every inquiry receives a personalized response within 24 business hours.
              </p>
            </div>
          </div>

          {/* Right Column: Inquire Form */}
          <div className="lg:col-span-7">
            <InquireForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
