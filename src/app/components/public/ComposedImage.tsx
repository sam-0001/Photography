'use client';

import React, { CSSProperties } from 'react';
import Image from 'next/image';
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
  src: string;
  alt: string;
  composition?: Partial<ImageComposition> | null;
  aspectRatio?: AspectRatioPreset | string;
  className?: string;
  containerStyle?: CSSProperties;
  overlay?: React.ReactNode;
  lazy?: boolean;
  onClick?: () => void;
  priority?: boolean;
}

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
  priority = false,
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
    transition: 'transform 0.4s ease',
  };

  return (
    <div style={wrapperStyle} onClick={onClick}>
      <div style={innerStyle}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
          loading={priority ? undefined : (lazy ? 'lazy' : 'eager')}
          style={{ objectFit: 'cover', objectPosition }}
          className={className}
          draggable={false}
          unoptimized={src.startsWith('data:')}
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
