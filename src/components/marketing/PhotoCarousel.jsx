import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { resolveMediaUrl } from '../../api/client';

const AUTO_SLIDE_MS = 3500;

/**
 * Mini-carousel de photos pour un etablissement : glisse automatiquement,
 * se met en pause au survol, navigable par fleches et puces.
 */
export default function PhotoCarousel({ photos, alt, heightClassName = 'h-48 sm:h-52' }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = photos.length;

  useEffect(() => {
    if (count <= 1 || paused) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  function go(delta) {
    setIndex((prev) => (prev + delta + count) % count);
  }

  return (
    <div
      className={`relative ${heightClassName} overflow-hidden bg-(--color-petrol-50) group`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex h-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {photos.map((url) => (
          <img
            key={url}
            src={resolveMediaUrl(url)}
            alt={alt}
            className="w-full h-full object-cover shrink-0"
          />
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Photo précédente"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Photo suivante"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={16} />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {photos.map((url, i) => (
              <button
                key={url}
                type="button"
                aria-label={`Aller à la photo ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
