/**
 * Unified Image Composition System
 * Brother's Photography — shared composition types and utilities
 *
 * Used by: ComposedImage (public), FocalPointPicker (admin), DB schema, API
 */

export interface ImageComposition {
  /** Focal point X position: 0 (left) → 100 (right). Default 50 (centre). */
  focalX: number;
  /** Focal point Y position: 0 (top) → 100 (bottom). Default 50 (centre). */
  focalY: number;
  /** Zoom multiplier. 1.0 = natural size. 1.0–3.0 range. Default 1. */
  zoom: number;
}

export const DEFAULT_COMPOSITION: ImageComposition = {
  focalX: 50,
  focalY: 50,
  zoom: 1,
};

/**
 * Converts focal point (0-100, 0-100) to a CSS `object-position` value.
 * e.g. focalX=30, focalY=20 → "30% 20%"
 */
export function compositionToObjectPosition(c: ImageComposition): string {
  return `${Math.round(c.focalX)}% ${Math.round(c.focalY)}%`;
}

/**
 * Returns the CSS transform for zoom, anchored at the focal point.
 * Scale origin is the focal point itself to avoid drift.
 */
export function compositionToTransform(c: ImageComposition): {
  transform: string;
  transformOrigin: string;
} {
  if (c.zoom <= 1.001) {
    return { transform: 'none', transformOrigin: 'center center' };
  }
  return {
    transform: `scale(${c.zoom})`,
    transformOrigin: `${c.focalX}% ${c.focalY}%`,
  };
}

/**
 * Merges a partial composition with defaults. Safe for DB partial fields.
 */
export function resolveComposition(
  partial?: Partial<ImageComposition> | null
): ImageComposition {
  return {
    focalX: partial?.focalX ?? DEFAULT_COMPOSITION.focalX,
    focalY: partial?.focalY ?? DEFAULT_COMPOSITION.focalY,
    zoom: partial?.zoom ?? DEFAULT_COMPOSITION.zoom,
  };
}
