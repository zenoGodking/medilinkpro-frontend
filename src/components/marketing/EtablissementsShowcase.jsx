import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, ArrowRight } from 'lucide-react';
import { getPublicEtablissements } from '../../api/etablissements';
import PhotoCarousel from './PhotoCarousel';

/**
 * Vitrine publique des etablissements de sante crees par les Directeurs,
 * affichee sur la page d'accueil avec leurs photos en carousel glissant.
 */
export default function EtablissementsShowcase() {
  const [etablissements, setEtablissements] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    (async () => {
      try {
        const data = await getPublicEtablissements();
        setEtablissements(data.filter((e) => (e.photos || []).length > 0));
      } catch {
        setEtablissements([]);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Rien a montrer : aucun etablissement n'a encore de photo. On n'affiche pas la section.
  if (!loaded || etablissements.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-(--color-petrol-100)/70">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-(--color-petrol-700)">
            Nos établissements partenaires.
          </h2>
          <p className="text-(--color-ink-600) mt-3">
            Découvrez les hôpitaux et cliniques déjà présents sur MediLinkPro, en images.
          </p>
        </div>
        <Link
          to="/etablissements"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-(--color-petrol-600) hover:gap-2.5 transition-all shrink-0"
        >
          Voir tout l'annuaire <ArrowRight size={15} />
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
        {etablissements.slice(0, 6).map((e) => (
          <Link
            key={e.id}
            to={`/etablissements/${e.id}`}
            className="bg-white rounded-2xl border border-(--color-petrol-100) overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:shadow-(--color-petrol-900)/10 transition-all duration-300"
          >
            <PhotoCarousel photos={e.photos} alt={e.nom} />
            <div className="p-4">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-(--color-petrol-50) flex items-center justify-center shrink-0">
                  <Building2 size={15} className="text-(--color-petrol-600)" />
                </div>
                <div>
                  <p className="font-display font-semibold text-(--color-ink-900) leading-tight">{e.nom}</p>
                  {e.type && <p className="text-xs text-(--color-amber-500) font-medium mt-0.5">{e.type}</p>}
                </div>
              </div>
              {e.adresse && (
                <p className="flex items-center gap-1.5 text-xs text-(--color-ink-600) mt-2.5">
                  <MapPin size={12} /> {e.adresse}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
