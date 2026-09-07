import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--color-surface-container-low)', borderTop: '1px solid var(--color-outline-variant)' }}>
      <div className="mx-auto px-5 md:px-16 py-16" style={{ maxWidth: 'var(--spacing-max-editorial)' }}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          <div className="md:col-span-5">
            <p style={{ fontFamily: 'var(--font-bodoni)', fontSize: '1.5rem', fontWeight: 400, letterSpacing: '0.08em', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
              BROTHER&apos;S PHOTOGRAPHY
            </p>
            <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.9375rem', fontWeight: 300, lineHeight: 1.75, color: 'var(--color-on-surface-variant)', marginTop: '0.75rem', maxWidth: '28rem' }}>
              Professional Photography &amp; Cinematography for Weddings, Events, Celebrations &amp; Every Special Moment.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: '#128C7E',
                  color: '#fff',
                  padding: '0.625rem 1.25rem',
                  fontFamily: 'var(--font-jakarta)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                WhatsApp
              </a>
              <a
                href="tel:+919999999999"
                style={{
                  border: '1px solid var(--color-primary)',
                  color: 'var(--color-primary)',
                  padding: '0.625rem 1.25rem',
                  fontFamily: 'var(--font-jakarta)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                Call Us
              </a>
            </div>
          </div>
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.15em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                Navigate
              </p>
              {[
                { name: 'Portfolio', href: '/portfolio' },
                { name: 'Films', href: '/films' },
                { name: 'About', href: '/about' },
                { name: 'Services', href: '/services' },
                { name: 'Studio', href: '/studio' },
                { name: 'Testimonials', href: '/testimonials' },
                { name: 'Contact', href: '/contact' },
                { name: 'Albums', href: '/albums' },
              ].map((l) => (
                <div key={l.name} style={{ marginBottom: '0.5rem' }}>
                  <Link
                    href={l.href}
                    style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)', textDecoration: 'none' }}
                    className="hover:text-black transition-colors"
                  >
                    {l.name}
                  </Link>
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.15em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                Services
              </p>
              {['Wedding Photography', 'Pre-Wedding Films', 'Birthday Events', 'Portrait Sessions', 'Premium Albums'].map((l) => (
                <div key={l} style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)' }}>{l}</span>
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.15em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                Studio
              </p>
              <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)', lineHeight: 1.7 }}>
                Pune, Maharashtra<br />India
              </p>
              <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)', marginTop: '0.75rem' }}>
                Mon–Sat: 10:00–19:00
              </p>
              <Link
                href="/gallery-access"
                style={{
                  display: 'block',
                  marginTop: '1rem',
                  fontFamily: 'var(--font-jakarta)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: 'var(--color-secondary)',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                Client Gallery →
              </Link>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: '1.5rem' }} className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>
            © 2026 Brother&apos;s Photography. All rights reserved.
          </p>
          <Link
            href="/admin"
            style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', textDecoration: 'none' }}
            className="hover:text-black transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
