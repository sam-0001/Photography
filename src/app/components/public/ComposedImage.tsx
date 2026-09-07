'use client';

/**
 * ComposedImage — Universal Image Rendering Component
 * Brother's Photography
 *
 * Every image on the public site should use this component.
 * It reads the ImageComposition (focalX, focalY, zoom) stored by the admin
 * and renders the image correctly: no head-cropping, intentional framing.
 *
 * Usage:
 *   <ComposedImage
 *     src={item.url}
 *     alt={item.title}
 *     composition={item.composition}
 *     aspectRatio="4/3"
 *     className="group-hover:scale-105"
 *   />
 */

import React, { CSSProperties } from 'react';
import {
  ImageComposition,
  resolveComposition,
  compositionToObjectPosition,
  compositionToTransform,
} from '@/lib/imageComposition';

export type AspectRatioPreset =
  | '1/1'
  | '4/3'
  | '3/4'
  | '16/9'
  | '9/16'
  | '3/2'
  | '2/3'
  | '4/5'
  | '5/4'
  | '21/9'
  | '16/6'
  | '16/10';

interface ComposedImageProps {
  /** Image URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Admin-controlled composition: focalX, focalY, zoom */
  composition?: Partial<ImageComposition> | null;
  /**
   * Aspect ratio for the container frame.
   * If omitted the image fills its parent (parent must have defined height).
   */
  aspectRatio?: AspectRatioPreset | string;
  /**
   * Extra CSS classes applied to the <img> element.
   * Use Tailwind transition/hover classes here, e.g. "group-hover:scale-105"
   */
  className?: string;
  /** Extra inline styles on the outer container div */
  containerStyle?: CSSProperties;
  /** Optional overlay rendered on top of the image */
  overlay?: React.ReactNode;
  /** Whether to lazy-load (default true) */
  lazy?: boolean;
  /** Optional click handler */
  onClick?: () => void;
}

/**
 * ComposedImage renders a fixed-frame image with admin-controlled
 * focal point and zoom — no automatic center-crop.
 *
 * Architecture:
 *  ┌── wrapper div (aspect ratio + overflow hidden) ─────────────────┐
 *  │  ┌── inner div (100%×100%, scale transform at focal origin) ──┐  │
 *  │  │  <img object-cover, object-position at focal point>        │  │
 *  │  └────────────────────────────────────────────────────────────┘  │
 *  │  [optional overlay]                                              │
 *  └──────────────────────────────────────────────────────────────────┘
 *
 * Two-layer approach:
 *  - object-position handles focal anchor within the natural image
 *  - CSS scale transform on the inner div handles zoom, anchored at focal
 */
export default function ComposedImage({
  src,
  alt,
  composition,
  aspectRatio,
  className = '',
  containerStyle,
  overlay,
  lazy = true,
  onClick,
}: ComposedImageProps) {
  const c = resolveComposition(composition);
  const objectPosition = compositionToObjectPosition(c);
  const { transform, transformOrigin } = compositionToTransform(c);

  const wrapperStyle: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    ...(aspectRatio ? { aspectRatio } : { height: '100%' }),
    ...containerStyle,
  };

  const innerStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    transform,
    transformOrigin,
    // transition for smooth zoom animation when composition changes live (admin preview)
    transition: 'transform 0.4s ease',
  };

  const imgStyle: CSSProperties = {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition,
  };

  return (
    <div style={wrapperStyle} onClick={onClick}>
      <div style={innerStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          style={imgStyle}
          loading={lazy ? 'lazy' : 'eager'}
          className={className}
          draggable={false}
        />
      </div>
      {overlay && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {overlay}
        </div>
      )}
    </div>
  );
}
