import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, PenLine, Eye } from 'lucide-react';
import { getAllPatients } from '../../api/patients';
import { getPatientsEcritureAutorisee } from '../../api/carnets';
import { Card, Spinner, EmptyState, PageHeader, TextInput } from '../../components/ui';

/**
 * Tous les carnets patients sont consultables par un medecin ; l'ecriture n'est possible
 * que pour ses patients (autorisation donnee par le patient, ou ancien patient).
 */
export default function MedecinPatientsPage() {
  const [patients, setPatients] = useState([]);
  const [ecriture, setEcriture] = useState(new Map());
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAllPatients(), getPatientsEcritureAutorisee()])
      .then(([tous, accessibles]) => {
        if (cancelled) return;
        setPatients(tous);
        setEcriture(new Map(accessibles.map((p) => [p.id, p.motif])));
      })
      .catch(() => !cancelled && setPatients([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const affiches = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return patients
      .filter((p) => !q || `${p.prenom} ${p.nom}`.toLowerCase().includes(q))
      // Mes patients (ecriture possible) en premier
      .sort((a, b) => Number(ecriture.has(b.id)) - Number(ecriture.has(a.id)));
  }, [patients, recherche, ecriture]);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner className="w-7 h-7" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carnets des patients"
        description="Vous pouvez consulter tous les carnets. Vous ne pouvez écrire que dans celui de vos patients (autorisation du patient ou ancien patient)."
      />

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-ink-300)" />
        <TextInput style={{ paddingLeft: "2.25rem" }} placeholder="Rechercher un patient..." value={recherche} onChange={(e) => setRecherche(e.target.value)} />
      </div>

      {affiches.length === 0 ? (
        <Card><EmptyState icon={Users} title="Aucun patient trouvé" description="Modifiez votre recherche." /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {affiches.map((p) => (
            <Link key={p.id} to={`/medecin/patients/${p.id}`}>
              <Card className="p-4 flex items-center gap-3 hover:border-(--color-petrol-400) transition-colors">
                <div className="w-10 h-10 rounded-full bg-(--color-petrol-50) flex items-center justify-center text-(--color-petrol-600) font-display font-semibold shrink-0">
                  {p.prenom?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-(--color-ink-900) truncate">
                    {p.prenom} {p.nom}
                    {p.decede && <span className="ml-2 text-xs font-semibold text-(--color-ink-600)">(décédé)</span>}
                  </p>
                  {ecriture.has(p.id) ? (
                    <p className="flex items-center gap-1 text-xs font-semibold text-(--color-sage-500)">
                      <PenLine size={12} /> {ecriture.get(p.id) === 'AUTORISATION_PATIENT' ? 'Autorisé par le patient' : 'Votre patient'}
                    </p>
                  ) : (
                    <p className="flex items-center gap-1 text-xs text-(--color-ink-300)"><Eye size={12} /> Lecture seule</p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
