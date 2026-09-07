'use client';

import React, { useEffect } from 'react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  videoUrl: string;
  subtitle?: string;
}

export default function VideoModal({ isOpen, onClose, title, videoUrl, subtitle }: VideoModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Video player: ${title}`}
      className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-black border border-white/20 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close video player"
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <div className="relative aspect-video w-full bg-black">
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full h-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="p-6 bg-[#111111] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-xl font-normal">{title}</h3>
            {subtitle && <p className="font-sans text-xs text-white/60 mt-1">{subtitle}</p>}
          </div>

          <a
            href="/contact"
            className="inline-block text-center py-2.5 px-5 bg-white text-black text-xs font-semibold uppercase tracking-widest hover:bg-[#775927] hover:text-white transition-colors"
          >
            Inquire For Cinema →
          </a>
        </div>
      </div>
    </div>
  );
}
