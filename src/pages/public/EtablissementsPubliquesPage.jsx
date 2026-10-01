import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Building2, MapPin, Search, Eye, Megaphone, ArrowLeft, Map as IconeCarte, LayoutGrid } from 'lucide-react';
import CarteEtablissements from '../../components/CarteEtablissements';
import { getPublicEtablissements } from '../../api/etablissements';
import { getCampagnesActives } from '../../api/campagnes';
import { Button, Spinner, EmptyState } from '../../components/ui';
import PhotoCarousel from '../../components/marketing/PhotoCarousel';

export default function EtablissementsPubliquesPage() {
  const [etablissements, setEtablissements] = useState([]);
  const [etablissementsAvecCampagne, setEtablissementsAvecCampagne] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [vue, setVue] = useState('liste');

  useEffect(() => {
    (async () => {
      try {
        const [etabs, campagnes] = await Promise.all([
          getPublicEtablissements(),
          getCampagnesActives().catch(() => []),
        ]);
        setEtablissements(etabs);
        setEtablissementsAvecCampagne(new Set(campagnes.map((c) => c.etablissementId)));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtres = useMemo(() => {
    if (!recherche.trim()) return etablissements;
    const q = recherche.trim().toLowerCase();
    return etablissements.filter((e) =>
      `${e.nom} ${e.type || ''} ${e.adresse || ''}`.toLowerCase().includes(q)
    );
  }, [etablissements, recherche]);

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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-(--color-ink-600) hover:text-(--color-petrol-600) transition-colors mb-6">
          <ArrowLeft size={15} /> Retour à l'accueil
        </Link>

        <h1 className="font-display font-bold text-3xl sm:text-4xl text-(--color-petrol-700)">
          Annuaire des établissements de santé
        </h1>
        <p className="text-(--color-ink-600) mt-3 max-w-xl">
          Parcourez librement les hôpitaux et cliniques présents sur MediLinkPro.
          Aucune inscription n'est nécessaire pour consulter cet annuaire.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1 min-w-60">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--color-ink-300)" />
          <input
            type="text"
            placeholder="Rechercher par nom, type ou adresse..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-(--color-petrol-100) bg-white text-sm focus:outline-none focus:ring-2 focus:ring-(--color-petrol-400)"
          />
        </div>
          <div className="flex rounded-xl border border-(--color-petrol-100) bg-white p-1">
            {[{ id: 'liste', libelle: 'Liste', icone: LayoutGrid }, { id: 'carte', libelle: 'Carte', icone: IconeCarte }].map(({ id, libelle, icone: Icone }) => (
              <button key={id} type="button" onClick={() => setVue(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold ${vue === id ? 'bg-(--color-petrol-600) text-white' : 'text-(--color-ink-600)'}`}>
                <Icone size={15} /> {libelle}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Spinner className="w-7 h-7" /></div>
        ) : filtres.length === 0 ? (
          <div className="mt-10">
            <EmptyState icon={Building2} title="Aucun établissement trouvé" description="Essayez une autre recherche." />
          </div>
        ) : vue === 'carte' ? (
          <div className="mt-8">
            <CarteEtablissements etablissements={filtres} lienDetail={(e) => `/etablissements/${e.id}`} />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {filtres.map((e) => (
              <Link
                key={e.id}
                to={`/etablissements/${e.id}`}
                className="bg-white rounded-2xl border border-(--color-petrol-100) overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:shadow-(--color-petrol-900)/10 transition-all duration-300"
              >
                {e.photos?.length > 0 ? (
                  <PhotoCarousel photos={e.photos} alt={e.nom} />
                ) : (
                  <div className="h-48 sm:h-52 bg-(--color-petrol-50) flex items-center justify-center">
                    <Building2 size={32} className="text-(--color-petrol-200)" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-semibold text-(--color-ink-900) leading-tight">{e.nom}</p>
                      {e.type && <p className="text-xs text-(--color-amber-500) font-medium mt-0.5">{e.type}</p>}
                    </div>
                    {etablissementsAvecCampagne.has(e.id) && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-(--color-clay-100) text-(--color-clay-500) shrink-0">
                        <Megaphone size={11} /> Campagne
                      </span>
                    )}
                  </div>
                  {e.adresse && (
                    <p className="flex items-center gap-1.5 text-xs text-(--color-ink-600) mt-2.5">
                      <MapPin size={12} /> {e.adresse}
                    </p>
                  )}
                  {(e.ville || e.quartier) && (
                    <p className="flex items-center gap-1.5 text-xs text-(--color-ink-600) mt-1">
                      <MapPin size={12} /> {[e.quartier, e.ville].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5 text-xs text-(--color-ink-300) mt-2">
                    <Eye size={12} /> {e.nombreVisites ?? 0} visite{(e.nombreVisites ?? 0) > 1 ? 's' : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
