import { useEffect, useRef, useState } from 'react';

/**
 * Revele son contenu (fondu + leger glissement) des qu'il entre dans le viewport.
 * Respecte prefers-reduced-motion (affichage immediat, sans animation) et reste
 * visible par defaut si IntersectionObserver n'est pas disponible.
 */
export default function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  // Sans animation possible (mouvement reduit demande, navigateur ancien) : contenu visible d'emblee.
  const [visible, setVisible] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    || typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}
