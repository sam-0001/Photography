'use client';

import React, { useState } from 'react';
import VideoModal from './VideoModal';

export interface FilmItem {
  _id?: string;
  id?: string;
  title: string;
  subtitle?: string;
  category: string;
  url: string;
  thumbnailUrl?: string;
  aspectRatio?: string;
  isFeatured?: boolean;
  exif?: {
    camera?: string;
    lens?: string;
    aperture?: string;
    shutter?: string;
    iso?: string | number;
    focalLength?: string;
  };
}

interface FilmsGridProps {
  initialFilms: FilmItem[];
}

export default function FilmsGrid({ initialFilms = [] }: FilmsGridProps) {
  const [activeFilm, setActiveFilm] = useState<FilmItem | null>(null);

  return (
    <>
      <div className="cinema-reels grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {initialFilms.length === 0 ? (
          <div className="col-span-full py-16 text-center text-white/60">
            <p className="font-serif text-xl">Cinema archive is being curated.</p>
          </div>
        ) : (
          initialFilms.map((film, idx) => {
            const key = film._id || film.id || `film-${idx}`;
            return (
              <div
                key={key}
                className="film-item group border border-white/15 bg-black/40 p-5 flex flex-col justify-between transition-all duration-300 hover:border-white/40 cursor-pointer"
                onClick={() => setActiveFilm(film)}
              >
                <div>
                  <div className="relative aspect-video overflow-hidden mb-4 bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={film.thumbnailUrl || film.url}
                      alt={film.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                      <span className="w-14 h-14 rounded-full bg-black/70 border border-white/40 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-[#775927] transition-all">
                        ▶
                      </span>
                    </div>
                    <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-[0.625rem] font-semibold uppercase tracking-widest text-white px-2.5 py-1">
                      {film.category || 'Cinema'}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl text-white font-normal group-hover:text-[#c49e62] transition-colors">
                    {film.title}
                  </h3>
                  <p className="font-sans text-sm text-white/60 mt-1">
                    {film.subtitle || 'Cinematic Motion Picture'}
                  </p>
                </div>

                {film.exif?.camera && (
                  <p className="font-sans text-xs text-white/40 mt-4 pt-3 border-t border-white/10">
                    {film.exif.camera} {film.exif.lens ? `· ${film.exif.lens}` : ''}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      <VideoModal
        isOpen={Boolean(activeFilm)}
        onClose={() => setActiveFilm(null)}
        title={activeFilm?.title || ''}
        subtitle={activeFilm?.subtitle}
        videoUrl={activeFilm?.url || ''}
      />
    </>
  );
}
