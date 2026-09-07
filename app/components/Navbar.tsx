'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MobileNavDrawer, { NavLinkItem } from './MobileNavDrawer';

export const PUBLIC_NAV_LINKS: NavLinkItem[] = [
  { label: 'Portfolio', href: '/portfolio', number: '01' },
  { label: 'Albums', href: '/albums', number: '02' },
  { label: 'About', href: '/about', number: '03' },
  { label: 'Contact Us', href: '/contact', number: '04' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full"
        style={{
          backgroundColor: 'var(--color-surface, #fef9f2)',
          borderBottom: '1px solid var(--color-outline-variant, #ccc5bd)',
        }}
      >
        <div className="mx-auto px-5 md:px-16" style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)' }}>
          <div className="flex items-center justify-between h-20">
            {/* Studio Brand Logo */}
            <Link href="/" className="flex flex-col group focus:outline-none">
              <span
                style={{
                  fontFamily: 'var(--font-bodoni)',
                  fontSize: '1.25rem',
                  fontWeight: 400,
                  letterSpacing: '0.08em',
                  color: 'var(--color-primary, #000000)',
                  textTransform: 'uppercase',
                }}
              >
                Brother&apos;s Photography
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-jakarta)',
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  letterSpacing: '0.2em',
                  color: 'var(--color-secondary, #775927)',
                  textTransform: 'uppercase',
                }}
              >
                Est. 2014 · Photography &amp; Cinema Atelier
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7" aria-label="Main Navigation">
              {PUBLIC_NAV_LINKS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    style={{
                      fontFamily: 'var(--font-jakarta)',
                      fontSize: '0.6875rem',
                      fontWeight: isActive ? 700 : 600,
                      letterSpacing: '0.15em',
                      color: isActive ? 'var(--color-secondary, #775927)' : 'var(--color-on-surface-variant, #4a4640)',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                    }}
                    className={`hover:text-black transition-colors relative py-1 ${
                      isActive ? 'border-b-2 border-[#775927]' : ''
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Right Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: '#128C7E',
                  color: '#fff',
                  fontFamily: 'var(--font-jakarta)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '0.625rem 1.125rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
                className="hover:opacity-95 transition-opacity"
              >
                <span>&#x1F4AC;</span> WhatsApp
              </a>
              <Link
                href="/gallery-access"
                style={{
                  border: '1px solid var(--color-primary, #000000)',
                  color: 'var(--color-primary, #000000)',
                  fontFamily: 'var(--font-jakarta)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '0.625rem 1.125rem',
                  textDecoration: 'none',
                }}
                className="hover:bg-black hover:text-white transition-all"
              >
                Client Gallery
              </Link>
              <Link
                href="/contact"
                style={{
                  backgroundColor: 'var(--color-primary, #000000)',
                  color: 'var(--color-on-primary, #ffffff)',
                  fontFamily: 'var(--font-jakarta)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '0.625rem 1.125rem',
                  textDecoration: 'none',
                }}
                className="hover:bg-[#775927] transition-colors"
              >
                Inquire / Book
              </Link>
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              ref={toggleButtonRef}
              type="button"
              className="lg:hidden p-2 text-[var(--color-primary,#000000)] hover:text-[var(--color-secondary,#775927)] transition-colors focus:outline-none focus:ring-1 focus:ring-[#775927]"
              onClick={() => setOpen((prev) => !prev)}
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={open}
              aria-controls="mobile-navigation-drawer"
              aria-haspopup="dialog"
              data-testid="mobile-menu-toggle"
              style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-In Off-Canvas Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        links={PUBLIC_NAV_LINKS}
        triggerButtonRef={toggleButtonRef}
      />
    </>
  );
}
