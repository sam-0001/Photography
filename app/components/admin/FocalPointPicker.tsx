'use client';

/**
 * FocalPointPicker — Admin Composition Editor
 * Brother's Photography
 *
 * This component lives inside the admin portfolio management panel.
 * It shows the actual image with a draggable crosshair dot.
 * Below, it shows LIVE previews at all common aspect ratios
 * EXACTLY as the image will appear on the public website.
 *
 * Design principle:
 *   "What the admin sees in this picker IS what the visitor sees on the site."
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ImageComposition,
  resolveComposition,
} from '@/lib/imageComposition';
import ComposedImage from '../public/ComposedImage';

interface FocalPointPickerProps {
  /** Image URL to compose */
  src: string;
  /** Current composition values */
  composition?: Partial<ImageComposition> | null;
  /** Called whenever composition changes */
  onChange: (next: ImageComposition) => void;
}

const PREVIEW_VARIANTS: Array<{
  label: string;
  ratio: string;
  description: string;
}> = [
  { label: 'Hero', ratio: '21/9', description: 'Homepage hero banner' },
  { label: 'Landscape', ratio: '16/9', description: 'Stories / films' },
  { label: 'Portfolio Card', ratio: '4/3', description: 'Portfolio grid' },
  { label: 'Portrait', ratio: '3/4', description: 'Portrait / featured' },
  { label: 'Square', ratio: '1/1', description: 'Instagram / thumbnails' },
  { label: 'Tall Card', ratio: '4/5', description: 'Featured portfolio card' },
];

const S = {
  label: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.625rem' as const,
    fontWeight: 600 as const,
    letterSpacing: '0.12em' as const,
    textTransform: 'uppercase' as const,
    color: '#4a4640',
  },
  secondary: '#775927',
  primary: '#000000',
  surface: '#fef9f2',
  dim: '#ded9d3',
  outlineVariant: '#ccc5bd',
};

export default function FocalPointPicker({
  src,
  composition,
  onChange,
}: FocalPointPickerProps) {
  const c = resolveComposition(composition);
  const [local, setLocal] = useState<ImageComposition>(c);
  const [dragging, setDragging] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Sync when parent composition changes (e.g. different card selected)
  useEffect(() => {
    setLocal(resolveComposition(composition));
  }, [composition]);

  const updateFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      if (!pickerRef.current) return;
      const rect = pickerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      const next = { ...local, focalX: Math.round(x * 10) / 10, focalY: Math.round(y * 10) / 10 };
      setLocal(next);
      onChange(next);
    },
    [local, onChange]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      updateFromEvent(e.clientX, e.clientY);
    },
    [updateFromEvent]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging) return;
      updateFromEvent(e.clientX, e.clientY);
    },
    [dragging, updateFromEvent]
  );

  const onMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, onMouseMove, onMouseUp]);

  // Touch support
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      setDragging(true);
      updateFromEvent(t.clientX, t.clientY);
    },
    [updateFromEvent]
  );
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      updateFromEvent(t.clientX, t.clientY);
    },
    [updateFromEvent]
  );
  const onTouchEnd = useCallback(() => setDragging(false), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div>
        <p style={{ ...S.label, color: S.secondary, marginBottom: '0.25rem' }}>
          Image Composition
        </p>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.8125rem', color: '#4a4640', margin: 0 }}>
          Click or drag the crosshair to set the focal point. Live previews below show exactly how this image appears on the website.
        </p>
      </div>

      {/* Focal point picker — main image canvas */}
      <div>
        <p style={{ ...S.label, marginBottom: '0.5rem' }}>
          Focal Point — drag to adjust
        </p>
        <div
          ref={pickerRef}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            position: 'relative',
            aspectRatio: '3/2',
            overflow: 'hidden',
            border: `2px solid ${dragging ? S.secondary : S.outlineVariant}`,
            cursor: dragging ? 'crosshair' : 'crosshair',
            borderRadius: '2px',
            backgroundColor: '#111',
            userSelect: 'none',
            transition: 'border-color 0.15s ease',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="Focal point picker"
            draggable={false}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />

          {/* Crosshair lines */}
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}>
            {/* Vertical line */}
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${local.focalX}%`,
              width: '1px',
              backgroundColor: 'rgba(255,255,255,0.5)',
              transform: 'translateX(-0.5px)',
            }} />
            {/* Horizontal line */}
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${local.focalY}%`,
              height: '1px',
              backgroundColor: 'rgba(255,255,255,0.5)',
              transform: 'translateY(-0.5px)',
            }} />
            {/* Focal dot */}
            <div style={{
              position: 'absolute',
              left: `${local.focalX}%`,
              top: `${local.focalY}%`,
              transform: 'translate(-50%, -50%)',
              width: '1.5rem',
              height: '1.5rem',
              borderRadius: '50%',
              border: `2px solid ${S.secondary}`,
              backgroundColor: 'rgba(255,255,255,0.9)',
              boxShadow: '0 0 0 2px rgba(0,0,0,0.4)',
              transition: dragging ? 'none' : 'left 0.05s, top 0.05s',
            }} />
          </div>
        </div>

        {/* Coordinate display */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.625rem' }}>
          <span style={{ ...S.label, fontSize: '0.6875rem' }}>
            X: <span style={{ color: S.secondary, fontFamily: 'monospace' }}>{local.focalX.toFixed(1)}%</span>
          </span>
          <span style={{ ...S.label, fontSize: '0.6875rem' }}>
            Y: <span style={{ color: S.secondary, fontFamily: 'monospace' }}>{local.focalY.toFixed(1)}%</span>
          </span>
        </div>
      </div>

      {/* Zoom slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <p style={{ ...S.label, margin: 0 }}>Zoom</p>
          <span style={{ ...S.label, color: S.secondary, fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {local.zoom.toFixed(2)}×
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={local.zoom}
          onChange={(e) => {
            const next = { ...local, zoom: parseFloat(e.target.value) };
            setLocal(next);
            onChange(next);
          }}
          style={{ width: '100%', accentColor: S.secondary, cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ ...S.label, fontSize: '0.5625rem' }}>1× (original)</span>
          <span style={{ ...S.label, fontSize: '0.5625rem' }}>3× (max zoom)</span>
        </div>
      </div>

      {/* Reset button */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => {
            const reset = { focalX: 50, focalY: 50, zoom: 1 };
            setLocal(reset);
            onChange(reset);
          }}
          style={{
            backgroundColor: 'transparent',
            border: `1px solid ${S.outlineVariant}`,
            padding: '0.375rem 0.875rem',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '0.625rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            color: '#4a4640',
          }}
        >
          Reset to Centre
        </button>
        <button
          type="button"
          onClick={() => {
            const topCenter = { focalX: 50, focalY: 15, zoom: local.zoom };
            setLocal(topCenter);
            onChange(topCenter);
          }}
          style={{
            backgroundColor: 'transparent',
            border: `1px solid ${S.outlineVariant}`,
            padding: '0.375rem 0.875rem',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '0.625rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            color: '#4a4640',
          }}
        >
          Face / Top
        </button>
      </div>

      {/* Live previews — exactly how the image appears on the site */}
      <div>
        <p style={{ ...S.label, color: S.secondary, marginBottom: '0.75rem', fontSize: '0.6875rem' }}>
          Live Site Previews — Exact appearance on website
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '1rem',
        }}>
          {PREVIEW_VARIANTS.map(({ label, ratio, description }) => (
            <div key={label}>
              <div style={{ marginBottom: '0.375rem' }}>
                <p style={{ ...S.label, margin: 0, color: S.primary }}>{label}</p>
                <p style={{ ...S.label, margin: 0, fontSize: '0.5625rem', color: '#4a4640' }}>{description}</p>
              </div>
              <ComposedImage
                src={src}
                alt={`${label} preview`}
                composition={local}
                aspectRatio={ratio}
                containerStyle={{
                  border: `1px solid ${S.outlineVariant}`,
                  borderRadius: '1px',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
