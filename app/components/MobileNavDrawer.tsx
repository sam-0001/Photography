'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavLinkItem {
  label: string;
  href: string;
  number?: string;
  description?: string;
}

export const DEFAULT_NAV_LINKS: NavLinkItem[] = [
  { label: 'Portfolio', href: '/portfolio', number: '01' },
  { label: 'Films', href: '/films', number: '02' },
  { label: 'About', href: '/about', number: '03' },
  { label: 'Services', href: '/services', number: '04' },
  { label: 'Studio', href: '/studio', number: '05' },
  { label: 'Testimonials', href: '/testimonials', number: '06' },
  { label: 'Contact', href: '/contact', number: '07' },
  { label: 'Albums', href: '/albums', number: '08' },
];

export interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  links?: NavLinkItem[];
  triggerButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
  links = DEFAULT_NAV_LINKS,
  triggerButtonRef,
}: MobileNavDrawerProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // 1. Body Scroll Lock with scrollbar shift compensation
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // 2. ESC Key Dismiss
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 3. Close drawer automatically if viewport expands to desktop breakpoint (>= 1024px)
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        onClose();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onClose]);

  // 4. Focus management: focus close button on open, restore focus to trigger button on close
  useEffect(() => {
    if (isOpen) {
      // Delay slightly for CSS transition / DOM rendering
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      triggerButtonRef?.current?.focus();
    }
  }, [isOpen, triggerButtonRef]);

  // 5. Accessible Focus Trap within the open drawer
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !drawerRef.current) return;

    const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        data-testid="mobile-nav-backdrop"
      />

      {/* Off-Canvas Slide-in Panel */}
      <aside
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
        aria-hidden={!isOpen}
        ref={drawerRef}
        onKeyDown={handleKeyDown}
        className={`fixed top-0 right-0 bottom-0 z-[100] w-[88vw] max-w-sm sm:max-w-md h-[100dvh] flex flex-col justify-between transition-transform duration-300 ease-in-out transform shadow-2xl ${
          isOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
        }`}
        style={{
          backgroundColor: 'var(--color-surface, #fef9f2)',
          borderLeft: '1px solid var(--color-outline-variant, #ccc5bd)',
        }}
        data-testid="mobile-nav-drawer"
      >
        {/* Drawer Header */}
        <div
          className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid var(--color-outline-variant, #ccc5bd)' }}
        >
          <Link
            href="/"
            onClick={onClose}
            className="flex flex-col text-left group focus:outline-none"
            tabIndex={isOpen ? 0 : -1}
          >
            <span
              style={{
                fontFamily: 'var(--font-bodoni)',
                fontSize: '1.125rem',
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
                fontSize: '0.5625rem',
                fontWeight: 600,
                letterSpacing: '0.2em',
                color: 'var(--color-secondary, #775927)',
                textTransform: 'uppercase',
              }}
            >
              Est. 2014 · Atelier &amp; Cinema
            </span>
          </Link>

          {/* Close Button */}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close navigation menu"
            tabIndex={isOpen ? 0 : -1}
            data-testid="mobile-nav-close-btn"
            className="p-2 -mr-2 text-[#1d1b18] hover:text-[#775927] transition-colors focus:outline-none focus:ring-1 focus:ring-[#775927]"
            style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Curatorial Section Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-outline-variant,#ccc5bd)]/60">
            <span
              style={{
                fontFamily: 'var(--font-jakarta)',
                fontSize: '0.625rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: 'var(--color-outline, #7b766f)',
                textTransform: 'uppercase',
              }}
            >
              Monograph Index
            </span>
            <span
              style={{
                fontFamily: 'var(--font-jakarta)',
                fontSize: '0.625rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: 'var(--color-secondary, #775927)',
              }}
            >
              Pune Atelier
            </span>
          </div>

          {/* Primary Route Navigation Links */}
          <nav aria-label="Mobile Directory" className="flex flex-col space-y-1">
            {links.map((item, index) => {
              const isActive = pathname === item.href;
              const formattedNumber = item.number || String(index + 1).padStart(2, '0');

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  tabIndex={isOpen ? 0 : -1}
                  aria-current={isActive ? 'page' : undefined}
                  data-testid={`mobile-nav-link-${item.label.toLowerCase()}`}
                  className={`group flex items-center justify-between py-3 px-3 -mx-3 transition-colors ${
                    isActive
                      ? 'bg-[var(--color-surface-container-high,#ece7e1)] text-[#000000]'
                      : 'hover:bg-[var(--color-surface-container,#f2ede7)] text-[var(--color-on-surface,#1d1b18)]'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  <div className="flex items-baseline gap-4">
                    <span
                      style={{
                        fontFamily: 'var(--font-jakarta)',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        color: isActive ? 'var(--color-secondary, #775927)' : 'var(--color-outline, #7b766f)',
                      }}
                    >
                      {formattedNumber}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-jakarta)',
                        fontSize: '0.875rem',
                        fontWeight: isActive ? 700 : 500,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.label}
                    </span>
                  </div>

                  <span
                    className={`text-xs transition-transform duration-200 ${
                      isActive ? 'text-[var(--color-secondary,#775927)] translate-x-1' : 'text-gray-400 group-hover:translate-x-1'
                    }`}
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Private Client Gallery Banner Card */}
          <div
            className="p-4 bg-[var(--color-surface-container-low,#f8f3ec)] border border-[var(--color-outline-variant,#ccc5bd)] flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontFamily: 'var(--font-jakarta)',
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  color: 'var(--color-secondary, #775927)',
                  textTransform: 'uppercase',
                }}
              >
                Client Event Vault
              </span>
              <span className="text-xs" aria-hidden="true">🔒</span>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-jakarta)',
                fontSize: '0.75rem',
                color: 'var(--color-on-surface-variant, #4a4640)',
                lineHeight: 1.4,
              }}
            >
              Access your private monograph with your studio token and 4-digit PIN.
            </p>
            <Link
              href="/gallery-access"
              onClick={onClose}
              tabIndex={isOpen ? 0 : -1}
              data-testid="mobile-nav-client-gallery"
              style={{
                border: '1px solid var(--color-primary, #000000)',
                color: 'var(--color-primary, #000000)',
                fontFamily: 'var(--font-jakarta)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '0.625rem 1rem',
                textAlign: 'center',
                textDecoration: 'none',
              }}
              className="hover:bg-black hover:text-white transition-colors mt-1"
            >
              Unlock Private Gallery
            </Link>
          </div>

          {/* Direct Studio Communication Actions */}
          <div className="space-y-3 pt-2">
            <a
              href="https://wa.me/919999999999"
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={isOpen ? 0 : -1}
              data-testid="mobile-nav-whatsapp"
              style={{
                backgroundColor: '#128C7E',
                color: '#ffffff',
                fontFamily: 'var(--font-jakarta)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '0.75rem 1rem',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
              className="hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.54 2.016.827 2.796.827 3.182 0 5.768-2.587 5.768-5.766.001-3.18-2.585-5.767-5.768-5.767zm0 10.518c-.71 0-1.637-.233-2.31-.63l-.165-.098-1.579.414.421-1.539-.107-.171c-.442-.703-.675-1.517-.674-2.728.001-2.618 2.13-4.747 4.75-4.747 2.619 0 4.749 2.129 4.75 4.747 0 2.62-2.13 4.752-4.486 4.752z" />
              </svg>
              <span>WhatsApp Studio</span>
            </a>

            <Link
              href="/contact"
              onClick={onClose}
              tabIndex={isOpen ? 0 : -1}
              data-testid="mobile-nav-book-now"
              style={{
                backgroundColor: 'var(--color-primary, #000000)',
                color: 'var(--color-on-primary, #ffffff)',
                fontFamily: 'var(--font-jakarta)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '0.75rem 1rem',
                textDecoration: 'none',
                display: 'block',
                textAlign: 'center',
              }}
              className="hover:bg-[#775927] transition-colors"
            >
              Inquire / Book Commission
            </Link>
          </div>
        </div>

        {/* Drawer Footer */}
        <div
          className="px-6 py-4 shrink-0 bg-[var(--color-surface-container,#f2ede7)] border-t border-[var(--color-outline-variant,#ccc5bd)] flex items-center justify-between text-[0.6875rem]"
          style={{ fontFamily: 'var(--font-jakarta)', color: 'var(--color-on-surface-variant, #4a4640)' }}
        >
          <div className="flex flex-col">
            <span className="font-semibold text-black">Pune Atelier</span>
            <span className="text-[0.625rem]">Mon–Sat · 10:00–19:00</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="tel:+919999999999"
              tabIndex={isOpen ? 0 : -1}
              className="hover:text-black font-semibold uppercase tracking-wider"
              style={{ minHeight: '36px', display: 'inline-flex', alignItems: 'center' }}
            >
              Call Us
            </a>
            <span className="text-gray-300">|</span>
            <Link
              href="/admin"
              onClick={onClose}
              tabIndex={isOpen ? 0 : -1}
              className="hover:text-black font-semibold uppercase tracking-wider"
              style={{ minHeight: '36px', display: 'inline-flex', alignItems: 'center' }}
            >
              Admin
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
