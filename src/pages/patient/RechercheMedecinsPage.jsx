import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, BadgeCheck } from 'lucide-react';
import { searchMedecins } from '../../api/medecins';
import { Card, Button, TextInput, Spinner, EmptyState, Etoiles } from '../../components/ui';

export default function RechercheMedecinsPage() {
  const [specialite, setSpecialite] = useState('');
  const [ville, setVille] = useState('');
  const [quartier, setQuartier] = useState('');
  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(true);

  const runSearch = useCallback(async (params) => {
    try {
      const data = await searchMedecins(params);
      setMedecins(data);
    } catch {
      setMedecins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let annule = false;
    searchMedecins({})
      .then((data) => { if (!annule) setMedecins(data); })
      .catch(() => { if (!annule) setMedecins([]); })
      .finally(() => { if (!annule) setLoading(false); });
    return () => { annule = true; };
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    runSearch({
      specialite: specialite || undefined,
      ville: ville || undefined,
      quartier: quartier || undefined,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-(--color-petrol-700)">Trouver un spécialiste</h1>
        <p className="text-(--color-ink-600) mt-1">Recherchez par spécialité, ville ou quartier.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--color-ink-300)" />
          <TextInput
            placeholder="Cardiologie, pédiatrie, dermatologie..."
            value={specialite}
            onChange={(e) => setSpecialite(e.target.value)}
            className="pl-10"
          />
        </div>
        <TextInput
          placeholder="Ville (ex: Yaoundé)"
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          className="sm:w-44"
        />
        <TextInput
          placeholder="Quartier (ex: Bastos)"
          value={quartier}
          onChange={(e) => setQuartier(e.target.value)}
          className="sm:w-44"
        />
        <Button type="submit">Rechercher</Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="w-7 h-7" />
        </div>
      ) : medecins.length === 0 ? (
        <Card>
          <EmptyState icon={Search} title="Aucun spécialiste trouvé" description="Essayez une autre spécialité, ville ou quartier." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {medecins.map((m) => (
            <Card key={m.id} className="p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display font-semibold text-(--color-ink-900)">Dr {m.prenom} {m.nom}</p>
                  <p className="text-sm text-(--color-amber-500) font-medium">{m.specialite || 'Généraliste'}</p>
                  {m.nombreAvis > 0 ? (
                    <p className="flex items-center gap-1.5 text-xs text-(--color-ink-600) mt-1">
                      <Etoiles valeur={m.noteMoyenne} taille={13} /> {m.noteMoyenne.toFixed(1)} ({m.nombreAvis} avis)
                    </p>
                  ) : (
                    <p className="text-xs text-(--color-ink-300) mt-1">Pas encore d'avis</p>
                  )}
                </div>
                {m.verifie && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-(--color-sage-500) bg-(--color-sage-100) px-2 py-1 rounded-full shrink-0">
                    <BadgeCheck size={13} /> Vérifié
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1 text-sm text-(--color-ink-600)">
                {m.etablissementNom && (
                  <p className="flex items-center gap-1.5"><MapPin size={14} /> {m.etablissementNom}</p>
                )}
                {(m.ville || m.quartier) && (
                  <p className="flex items-center gap-1.5">
                    <MapPin size={14} /> {[m.quartier, m.ville].filter(Boolean).join(', ')}
                  </p>
                )}
                {m.tarif != null && (
                  <p>Consultation : <span className="font-medium text-(--color-ink-900)">{m.tarif} FCFA</span></p>
                )}
              </div>

              <Link to={`/patient/rendez-vous/nouveau/${m.id}`} className="mt-4">
                <Button className="w-full">Prendre rendez-vous</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
