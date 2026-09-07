'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import ComposedImage from './ComposedImage';
import type { ImageComposition } from '@/lib/imageComposition';

export interface PortfolioItem {
  _id?: string;
  id?: string;
  title: string;
  subtitle?: string;
  category: string;
  mediaType?: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  aspectRatio?: string;
  isFeatured?: boolean;
  /** Admin-controlled composition: focalX, focalY, zoom */
  composition?: Partial<ImageComposition>;
  exif?: {
    camera?: string;
    lens?: string;
    aperture?: string;
    shutter?: string;
    iso?: string | number;
    focalLength?: string;
  };
}

interface PortfolioGridProps {
  initialMedia: PortfolioItem[];
  showFilter?: boolean;
}

const CATEGORIES = ['All Works', 'Weddings', 'Pre-Wedding', 'Portraits', 'Films', 'Editorial'];

export default function PortfolioGrid({ initialMedia = [], showFilter = true }: PortfolioGridProps) {
  const [selectedCategory, setSelectedCategory] = useState('All Works');
  const [activeItem, setActiveItem] = useState<PortfolioItem | null>(null);

  const filteredMedia = useMemo(() => {
    if (selectedCategory === 'All Works') {
      return initialMedia;
    }
    return initialMedia.filter((item) => {
      if (!item.category) return false;
      return item.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
    });
  }, [initialMedia, selectedCategory]);

  return (
    <div className="w-full">
      {/* Category Filter Tabs */}
      {showFilter && (
        <div className="flex flex-wrap gap-2 mb-10 pb-4 border-b border-[var(--color-outline-variant,#ccc5bd)]/50">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '9999px',
                  border: isSelected
                    ? '1px solid var(--color-primary, #000000)'
                    : '1px solid var(--color-outline-variant, #ccc5bd)',
                  backgroundColor: isSelected
                    ? 'var(--color-primary, #000000)'
                    : 'var(--color-surface-container, #f2ede7)',
                  color: isSelected
                    ? 'var(--color-on-primary, #ffffff)'
                    : 'var(--color-on-surface, #1d1b18)',
                  fontFamily: 'var(--font-jakarta)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                className="hover:opacity-90"
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid Container */}
      <div
        id="portfolio-grid"
        className="portfolio-gallery-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {filteredMedia.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-500">
            <p className="font-serif text-xl">No works found in this curation.</p>
            <button
              onClick={() => setSelectedCategory('All Works')}
              className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#775927] hover:underline"
            >
              Reset to All Works
            </button>
          </div>
        ) : (
          filteredMedia.map((item, idx) => {
            const key = item._id || item.id || `media-${idx}`;
            const isWide = idx % 5 === 0;

            return (
              <article
                key={key}
                data-category={item.category}
                className={`portfolio-card animate-fade-in-up group cursor-pointer flex flex-col justify-between border border-[var(--color-outline-variant,#ccc5bd)] bg-[var(--color-surface,#fef9f2)] overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  isWide ? 'md:col-span-2' : ''
                }`}
                onClick={() => setActiveItem(item)}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="relative w-full overflow-hidden bg-gray-100" style={{ aspectRatio: '4/3' }}>
                  <ComposedImage
                    src={item.thumbnailUrl || item.url}
                    alt={item.title}
                    composition={item.composition}
                    className="transition-transform duration-700 ease-out group-hover:scale-105"
                    containerStyle={{ height: '100%', aspectRatio: undefined }}
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2" style={{ zIndex: 1 }}>
                    <span
                      className="category-badge"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        color: '#ffffff',
                        backdropFilter: 'blur(4px)',
                        padding: '0.25rem 0.625rem',
                        fontFamily: 'var(--font-jakarta)',
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.category}
                    </span>
                    {item.isFeatured && (
                      <span
                        style={{
                          backgroundColor: 'var(--color-secondary, #775927)',
                          color: '#ffffff',
                          padding: '0.25rem 0.625rem',
                          fontFamily: 'var(--font-jakarta)',
                          fontSize: '0.625rem',
                          fontWeight: 600,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Featured
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex flex-col justify-between flex-1">
                  <div>
                    <h3
                      style={{
                        fontFamily: 'var(--font-bodoni)',
                        fontSize: '1.25rem',
                        fontWeight: 500,
                        color: 'var(--color-primary, #000000)',
                      }}
                    >
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p
                        style={{
                          fontFamily: 'var(--font-jakarta)',
                          fontSize: '0.8125rem',
                          color: 'var(--color-on-surface-variant, #4a4640)',
                          marginTop: '0.25rem',
                        }}
                      >
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  {item.exif?.camera && (
                    <div className="mt-4 pt-3 border-t border-[var(--color-outline-variant,#ccc5bd)]/40 flex items-center justify-between text-[0.625rem] text-[var(--color-outline,#7b766f)]">
                      <span>{item.exif.camera}</span>
                      {item.exif.lens && <span>{item.exif.lens}</span>}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Lightbox / EXIF Modal */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex flex-col items-center justify-start overflow-y-auto p-4 pt-16 pb-10"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[var(--color-surface,#fef9f2)] border border-[var(--color-outline-variant,#ccc5bd)] p-6 flex flex-col md:flex-row gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveItem(null)}
              aria-label="Close modal"
              className="fixed top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
            >
              ✕
            </button>

            <div className="flex-1 flex items-start justify-center bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="relative w-full h-[80vh]">
                <Image
                  src={activeItem.url}
                  alt={activeItem.title}
                  fill
                  style={{ objectFit: 'contain' }}
                  sizes="100vw"
                  unoptimized={activeItem.url.startsWith('data:')}
                />
              </div>
            </div>

            <div className="w-full md:w-72 flex flex-col justify-between">
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-jakarta)',
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    color: 'var(--color-secondary, #775927)',
                    textTransform: 'uppercase',
                  }}
                >
                  {activeItem.category}
                </span>
                <h2
                  style={{
                    fontFamily: 'var(--font-bodoni)',
                    fontSize: '1.5rem',
                    marginTop: '0.25rem',
                  }}
                >
                  {activeItem.title}
                </h2>
                {activeItem.subtitle && (
                  <p className="font-sans text-xs text-gray-600 mt-1">{activeItem.subtitle}</p>
                )}

                {activeItem.exif && (
                  <div className="mt-6 pt-4 border-t border-gray-200 space-y-2 text-xs font-sans">
                    <p className="font-semibold uppercase tracking-wider text-[0.625rem] text-gray-400">
                      Archival Capture EXIF
                    </p>
                    {activeItem.exif.camera && <div><span className="text-gray-500">Camera:</span> {activeItem.exif.camera}</div>}
                    {activeItem.exif.lens && <div><span className="text-gray-500">Lens:</span> {activeItem.exif.lens}</div>}
                    {activeItem.exif.aperture && <div><span className="text-gray-500">Aperture:</span> {activeItem.exif.aperture}</div>}
                    {activeItem.exif.shutter && <div><span className="text-gray-500">Shutter:</span> {activeItem.exif.shutter}</div>}
                    {activeItem.exif.iso && <div><span className="text-gray-500">ISO:</span> {activeItem.exif.iso}</div>}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <a
                  href="/contact"
                  className="block text-center py-2.5 px-4 bg-black text-white text-xs font-semibold uppercase tracking-widest hover:bg-[#775927] transition-colors"
                >
                  Commission Similar Work →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
