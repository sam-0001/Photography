'use client';
import { useState } from 'react';
import Link from 'next/link';
import ComposedImage from './public/ComposedImage';
import type { ImageComposition } from '@/lib/imageComposition';

interface Story {
  id: string;
  client: string;
  type: string;
  location: string;
  date: string;
  img: string;
  featured: boolean;
  composition?: Partial<ImageComposition>;
}

function StoryOverlay({ story, onClose }: { story: Story; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: 'rgba(0,0,0,0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflowY: 'auto',
        cursor: 'zoom-out',
        paddingTop: '4rem',
        paddingBottom: '5rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
      }}
    >
      {/* Close button — fixed at top-right */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.5rem',
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '50%',
          width: '2.5rem',
          height: '2.5rem',
          color: 'rgba(255,255,255,0.9)',
          fontSize: '1.25rem',
          cursor: 'pointer',
          lineHeight: 1,
          zIndex: 210,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Close preview"
      >×</button>

      {/* Full image — no height constraint, shows top-to-bottom, never cropped */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={story.img}
        alt={story.client}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          width: 'auto',
          height: 'auto',
          display: 'block',
          userSelect: 'none',
          cursor: 'default',
        }}
      />

      {/* Caption — below the image */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          cursor: 'default',
        }}
      >
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.5)',
          margin: 0,
        }}>
          {story.type} · {story.location} · {story.date}
        </p>
        <p style={{
          fontFamily: "'Bodoni Moda', serif",
          fontSize: '1.25rem',
          fontWeight: 400,
          color: '#fff',
          marginTop: '0.25rem',
          marginBottom: 0,
        }}>
          {story.client}
        </p>
      </div>
    </div>
  );
}

export default function StoriesGrid({ stories }: { stories: Story[] }) {
  const [preview, setPreview] = useState<Story | null>(null);

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '1.5rem',
    background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
  };

  // Hint to click for full view
  const fullViewHintStyle: React.CSSProperties = {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    backgroundColor: 'rgba(0,0,0,0.55)',
    color: 'rgba(255,255,255,0.85)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.6rem',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '0.25rem 0.5rem',
    backdropFilter: 'blur(4px)',
    pointerEvents: 'none',
    opacity: 0,
    transition: 'opacity 0.2s ease',
  };

  return (
    <>
      {/* Full-image preview overlay */}
      {preview && <StoryOverlay story={preview} onClose={() => setPreview(null)} />}

      {/* Row 1 — hero full-width, 21:9 */}
      {stories[0] && (
        <article style={{ marginBottom: '2rem' }}>
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              aspectRatio: '21/9',
              border: '1px solid #ccc5bd',
              cursor: 'zoom-in',
            }}
            className="group"
            onClick={() => setPreview(stories[0])}
          >
            <ComposedImage
              src={stories[0].img}
              alt={stories[0].client}
              composition={stories[0].composition}
              className="group-hover:scale-[1.02]"
              containerStyle={{ position: 'absolute', inset: 0, height: '100%', aspectRatio: undefined }}
            />
            {/* Hover hint */}
            <div className="group-hover:opacity-100" style={fullViewHintStyle}>
              ⊕ Full View
            </div>
            {stories[0].featured && (
              <div style={{ position: 'absolute', top: '1rem', left: '1rem', backgroundColor: '#000', color: '#fff', padding: '0.25rem 0.75rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Featured
              </div>
            )}
            <div style={overlayStyle}>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', margin: 0 }}>
                {stories[0].type} · {stories[0].location} · {stories[0].date}
              </p>
              <h3 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 400, color: '#fff', marginTop: '0.375rem', marginBottom: 0 }}>
                {stories[0].client}
              </h3>
              <Link
                href="/portfolio"
                onClick={(e) => e.stopPropagation()}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginTop: '0.75rem', display: 'inline-block', textDecoration: 'none' }}
              >
                View Story →
              </Link>
            </div>
          </div>
        </article>
      )}

      {/* Row 2 — side by side 3fr / 2fr */}
      {(stories[1] || stories[2]) && (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem', marginBottom: '2rem', alignItems: 'start' }}>
          {stories[1] && (
            <article>
              <div
                style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4/3', border: '1px solid #ccc5bd', cursor: 'zoom-in' }}
                className="group"
                onClick={() => setPreview(stories[1])}
              >
                <ComposedImage src={stories[1].img} alt={stories[1].client} composition={stories[1].composition} className="group-hover:scale-[1.02]" containerStyle={{ position: 'absolute', inset: 0, height: '100%', aspectRatio: undefined }} />
                <div className="group-hover:opacity-100" style={fullViewHintStyle}>⊕ Full View</div>
                <div style={overlayStyle}>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', margin: 0 }}>
                    {stories[1].type} · {stories[1].location}
                  </p>
                  <h3 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: '1.375rem', fontWeight: 400, color: '#fff', marginTop: '0.25rem', marginBottom: 0 }}>{stories[1].client}</h3>
                  <Link href="/portfolio" onClick={(e) => e.stopPropagation()} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginTop: '0.5rem', display: 'inline-block', textDecoration: 'none' }}>View Story →</Link>
                </div>
              </div>
            </article>
          )}
          {stories[2] && (
            <article>
              <div
                style={{ position: 'relative', overflow: 'hidden', aspectRatio: '3/4', border: '1px solid #ccc5bd', cursor: 'zoom-in' }}
                className="group"
                onClick={() => setPreview(stories[2])}
              >
                <ComposedImage src={stories[2].img} alt={stories[2].client} composition={stories[2].composition} className="group-hover:scale-[1.02]" containerStyle={{ position: 'absolute', inset: 0, height: '100%', aspectRatio: undefined }} />
                <div className="group-hover:opacity-100" style={fullViewHintStyle}>⊕ Full View</div>
                <div style={overlayStyle}>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', margin: 0 }}>
                    {stories[2].type} · {stories[2].location}
                  </p>
                  <h3 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: '1.375rem', fontWeight: 400, color: '#fff', marginTop: '0.25rem', marginBottom: 0 }}>{stories[2].client}</h3>
                  <Link href="/portfolio" onClick={(e) => e.stopPropagation()} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginTop: '0.5rem', display: 'inline-block', textDecoration: 'none' }}>View Story →</Link>
                </div>
              </div>
            </article>
          )}
        </div>
      )}

      {/* Row 3 — wide cinematic banner 16:6 */}
      {stories[3] && (
        <article>
          <div
            style={{ position: 'relative', overflow: 'hidden', aspectRatio: '16/6', border: '1px solid #ccc5bd', cursor: 'zoom-in' }}
            className="group"
            onClick={() => setPreview(stories[3])}
          >
            <ComposedImage src={stories[3].img} alt={stories[3].client} composition={stories[3].composition} className="group-hover:scale-[1.02]" containerStyle={{ position: 'absolute', inset: 0, height: '100%', aspectRatio: undefined }} />
            <div className="group-hover:opacity-100" style={fullViewHintStyle}>⊕ Full View</div>
            <div style={{ ...overlayStyle, padding: '1.75rem 2rem' }}>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', margin: 0 }}>
                {stories[3].type} · {stories[3].location} · {stories[3].date}
              </p>
              <h3 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: 'clamp(1.25rem, 2.5vw, 2rem)', fontWeight: 400, color: '#fff', marginTop: '0.25rem', marginBottom: 0 }}>{stories[3].client}</h3>
              <Link href="/portfolio" onClick={(e) => e.stopPropagation()} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginTop: '0.5rem', display: 'inline-block', textDecoration: 'none' }}>View Story →</Link>
            </div>
          </div>
        </article>
      )}
    </>
  );
}
