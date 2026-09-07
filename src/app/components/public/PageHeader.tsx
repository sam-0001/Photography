import React from 'react';
import Link from 'next/link';

interface PageHeaderProps {
  tag: string;
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href: string }[];
}

export default function PageHeader({ tag, title, subtitle, breadcrumbs }: PageHeaderProps) {
  return (
    <header className="mb-12 pb-6 border-b border-[var(--color-outline-variant,#ccc5bd)]">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex items-center gap-2 text-xs font-sans text-[var(--color-outline,#7b766f)]">
            {breadcrumbs.map((b, idx) => (
              <li key={b.href} className="flex items-center gap-2">
                {idx > 0 && <span>/</span>}
                <Link href={b.href} className="hover:text-black transition-colors uppercase tracking-wider">
                  {b.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <span
        style={{
          fontFamily: 'var(--font-jakarta)',
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.2em',
          color: 'var(--color-secondary, #775927)',
          textTransform: 'uppercase',
        }}
      >
        {tag}
      </span>

      <h1
        style={{
          fontFamily: 'var(--font-bodoni)',
          fontSize: 'clamp(2.25rem, 5vw, 4rem)',
          fontWeight: 400,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: 'var(--color-primary, #000000)',
          marginTop: '0.5rem',
        }}
      >
        {title}
      </h1>

      {subtitle && (
        <p
          style={{
            fontFamily: 'var(--font-jakarta)',
            fontSize: '1rem',
            fontWeight: 300,
            lineHeight: 1.6,
            color: 'var(--color-on-surface-variant, #4a4640)',
            marginTop: '0.75rem',
            maxWidth: '44rem',
          }}
        >
          {subtitle}
        </p>
      )}
    </header>
  );
}
