import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Stethoscope, Building2, MapPin, Phone, Eye, Megaphone, ArrowLeft, Calendar,
} from 'lucide-react';
import { enregistrerVisiteEtablissement } from '../../api/etablissements';
import { getCampagnesActivesEtablissement } from '../../api/campagnes';
import { Button, Spinner, EmptyState } from '../../components/ui';
import PhotoCarousel from '../../components/marketing/PhotoCarousel';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function EtablissementDetailPage() {
  const { id } = useParams();
  const [etablissement, setEtablissement] = useState(null);
  const [campagnes, setCampagnes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [introuvable, setIntrouvable] = useState(false);
  const hasVisite = useRef(false);

  useEffect(() => {
    if (hasVisite.current) return;
    hasVisite.current = true;
    (async () => {
      try {
        const [etab, campagnesActives] = await Promise.all([
          enregistrerVisiteEtablissement(id),
          getCampagnesActivesEtablissement(id).catch(() => []),
        ]);
        setEtablissement(etab);
        setCampagnes(campagnesActives);
      } catch {
        setIntrouvable(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="min-h-screen bg-(--color-ivory)">
      <header className="sticky top-0 z-20 border-b border-(--color-petrol-100)/70 bg-(--color-ivory)/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-(--color-petrol-600) flex items-center justify-center text-white">
              <Stethoscope size={18} strokeWidth={2.25} />
            </div>
            <span className="font-display font-semibold text-lg text-(--color-petrol-700) tracking-tight">
              MediLinkPro
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/connexion"><Button variant="ghost">Se connecter</Button></Link>
            <Link to="/inscription"><Button variant="amber">S'inscrire</Button></Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Link to="/etablissements" className="inline-flex items-center gap-1.5 text-sm text-(--color-ink-600) hover:text-(--color-petrol-600) transition-colors mb-6">
          <ArrowLeft size={15} /> Retour à l'annuaire
        </Link>

        {loading ? (
          <div className="flex justify-center py-24"><Spinner className="w-7 h-7" /></div>
        ) : introuvable || !etablissement ? (
          <EmptyState icon={Building2} title="Établissement introuvable" description="Ce lien n'est plus valide ou l'établissement a été supprimé." />
        ) : (
          <div className="bg-white rounded-2xl border border-(--color-petrol-100) overflow-hidden">
            {etablissement.photos?.length > 0 ? (
              <PhotoCarousel photos={etablissement.photos} alt={etablissement.nom} heightClassName="h-64 sm:h-80" />
            ) : (
              <div className="h-64 sm:h-80 bg-(--color-petrol-50) flex items-center justify-center">
                <Building2 size={48} className="text-(--color-petrol-200)" />
              </div>
            )}

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-display font-bold text-2xl sm:text-3xl text-(--color-petrol-700)">
                    {etablissement.nom}
                  </h1>
                  {etablissement.type && (
                    <p className="text-(--color-amber-500) font-semibold mt-1">{etablissement.type}</p>
                  )}
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full bg-(--color-petrol-50) text-(--color-petrol-600) shrink-0">
                  <Eye size={14} /> {etablissement.nombreVisites ?? 0} visite{(etablissement.nombreVisites ?? 0) > 1 ? 's' : ''}
                </span>
              </div>

              <div className="mt-5 space-y-2 text-sm text-(--color-ink-600)">
                {etablissement.adresse && (
                  <p className="flex items-center gap-2"><MapPin size={15} /> {etablissement.adresse}</p>
                )}
                {(etablissement.ville || etablissement.quartier) && (
                  <p className="flex items-center gap-2">
                    <MapPin size={15} /> {[etablissement.quartier, etablissement.ville].filter(Boolean).join(', ')}
                  </p>
                )}
                {etablissement.telephone && (
                  <p className="flex items-center gap-2"><Phone size={15} /> {etablissement.telephone}</p>
                )}
              </div>

              {etablissement.specialitesDisponibles?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {etablissement.specialitesDisponibles.map((s) => (
                    <span key={s} className="text-xs font-medium px-2.5 py-1.5 rounded-full bg-(--color-sage-100) text-(--color-sage-500)">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {campagnes.length > 0 && (
                <div className="mt-8 pt-8 border-t border-(--color-petrol-100)">
                  <h2 className="flex items-center gap-1.5 font-display font-semibold text-(--color-ink-900) mb-4">
                    <Megaphone size={17} className="text-(--color-clay-500)" /> Campagnes en cours
                  </h2>
                  <div className="space-y-3">
                    {campagnes.map((c) => (
                      <div key={c.id} className="bg-(--color-clay-100)/40 border border-(--color-clay-100) rounded-xl p-4">
                        <p className="font-display font-semibold text-(--color-ink-900)">{c.titre}</p>
                        {c.description && <p className="text-sm text-(--color-ink-600) mt-1.5">{c.description}</p>}
                        <p className="flex items-center gap-1.5 text-xs text-(--color-ink-300) mt-2.5">
                          <Calendar size={12} />
                          Depuis le {formatDate(c.dateDebut)}
                          {c.dateFin ? ` jusqu'au ${formatDate(c.dateFin)}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
