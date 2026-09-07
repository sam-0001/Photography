'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ComposedImage from './ComposedImage';

interface StoriesCarouselProps {
  allStories: {
    storyId: string;
    stories: any[];
  }[];
}

export default function StoriesCarousel({ allStories }: StoriesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (allStories.length <= 1) return;

    if (!isHovered) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % allStories.length);
      }, 5000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [allStories.length, isHovered]);

  if (!allStories || allStories.length === 0) return null;

  const currentStoryContext = allStories[currentIndex];
  const stories = currentStoryContext.stories;

  return (
    <div 
      className="relative transition-opacity duration-1000 ease-in-out"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Progress Indicators */}
      {allStories.length > 1 && (
        <div className="flex gap-2 justify-center mb-8">
          {allStories.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1 transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-[#775927]' : 'w-4 bg-[#ccc5bd] hover:bg-[#775927]/50'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Editorial grid — row 1: one large story full-width */}
      {stories[0] && (
        <article className="group cursor-pointer" style={{ marginBottom: '2rem' }}>
          <Link href="/portfolio" className="block" style={{ textDecoration: 'none' }}>
            <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '21/9' }}>
              <ComposedImage
                src={stories[0].img}
                alt={stories[0].client}
                composition={(stories[0] as any).composition}
                className="transition-transform duration-700 ease-out group-hover:scale-105"
                containerStyle={{ position: 'absolute', inset: 0, height: '100%', aspectRatio: undefined }}
              />
              {stories[0].featured && (
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', backgroundColor: 'var(--color-primary, #000)', color: '#fff', padding: '0.25rem 0.75rem', fontFamily: 'var(--font-jakarta)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', zIndex: 1 }}>
                  Featured
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)', zIndex: 1 }}>
                <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', margin: 0 }}>
                  {stories[0].type} · {stories[0].location} · {stories[0].date}
                </p>
                <h3 style={{ fontFamily: 'var(--font-bodoni)', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 400, color: '#fff', marginTop: '0.375rem', marginBottom: 0 }}>
                  {stories[0].client}
                </h3>
                <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginTop: '0.75rem', marginBottom: 0 }}>
                  View Story →
                </p>
              </div>
            </div>
          </Link>
        </article>
      )}

      {/* Editorial grid — row 2: two stories side by side, 60/40 */}
      {(stories[1] || stories[2]) && (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem', marginBottom: '2rem', alignItems: 'start' }}>
          {stories[1] && (
            <article className="group cursor-pointer">
              <Link href="/portfolio" className="block" style={{ textDecoration: 'none' }}>
                <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4/3' }}>
                  <ComposedImage src={stories[1].img} alt={stories[1].client} composition={(stories[1] as any).composition} className="transition-transform duration-700 ease-out group-hover:scale-105" containerStyle={{ position: 'absolute', inset: 0, height: '100%', aspectRatio: undefined }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)', zIndex: 1 }}>
                    <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', margin: 0 }}>
                      {stories[1].type} · {stories[1].location}
                    </p>
                    <h3 style={{ fontFamily: 'var(--font-bodoni)', fontSize: '1.375rem', fontWeight: 400, color: '#fff', marginTop: '0.25rem', marginBottom: 0 }}>{stories[1].client}</h3>
                    <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginTop: '0.5rem', marginBottom: 0 }}>View Story →</p>
                  </div>
                </div>
              </Link>
            </article>
          )}
          {stories[2] && (
            <article className="group cursor-pointer">
              <Link href="/portfolio" className="block" style={{ textDecoration: 'none' }}>
                <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '3/4' }}>
                  <ComposedImage src={stories[2].img} alt={stories[2].client} composition={(stories[2] as any).composition} className="transition-transform duration-700 ease-out group-hover:scale-105" containerStyle={{ position: 'absolute', inset: 0, height: '100%', aspectRatio: undefined }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)', zIndex: 1 }}>
                    <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', margin: 0 }}>
                      {stories[2].type} · {stories[2].location}
                    </p>
                    <h3 style={{ fontFamily: 'var(--font-bodoni)', fontSize: '1.375rem', fontWeight: 400, color: '#fff', marginTop: '0.25rem', marginBottom: 0 }}>{stories[2].client}</h3>
                    <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginTop: '0.5rem', marginBottom: 0 }}>View Story →</p>
                  </div>
                </div>
              </Link>
            </article>
          )}
        </div>
      )}

      {/* Editorial grid — row 3: fourth story, offset right as a wide banner */}
      {stories[3] && (
        <article className="group cursor-pointer">
          <Link href="/portfolio" className="block" style={{ textDecoration: 'none' }}>
            <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '16/6' }}>
              <ComposedImage src={stories[3].img} alt={stories[3].client} composition={(stories[3] as any).composition} className="transition-transform duration-700 ease-out group-hover:scale-105" containerStyle={{ position: 'absolute', inset: 0, height: '100%', aspectRatio: undefined }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.75rem 2rem', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)', zIndex: 1 }}>
                <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', margin: 0 }}>
                  {stories[3].type} · {stories[3].location} · {stories[3].date}
                </p>
                <h3 style={{ fontFamily: 'var(--font-bodoni)', fontSize: 'clamp(1.25rem, 2.5vw, 2rem)', fontWeight: 400, color: '#fff', marginTop: '0.25rem', marginBottom: 0 }}>{stories[3].client}</h3>
                <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginTop: '0.5rem', marginBottom: 0 }}>View Story →</p>
              </div>
            </div>
          </Link>
        </article>
      )}
    </div>
  );
}
