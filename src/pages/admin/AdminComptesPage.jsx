import { useEffect, useState } from 'react';
import { UserCheck, Check, X, Stethoscope } from 'lucide-react';
import { getComptesEnAttente, validerCompte } from '../../api/admin';
import { Card, Spinner, EmptyState, PageHeader, Button, RoleBadge, Select, Textarea } from '../../components/ui';
import PhotoInfirmier from '../../components/PhotoInfirmier';

const FILTRES_ROLE = [
  { value: '', label: 'Tous les roles' },
  { value: 'MEDECIN', label: 'Médecin' },
  { value: 'INFIRMIER', label: 'Infirmier(e)' },
  { value: 'PHARMACIEN', label: 'Pharmacien(ne)' },
  { value: 'DIRECTEUR', label: 'Directeur' },
];

export default function AdminComptesPage() {
  const [comptes, setComptes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreRole, setFiltreRole] = useState('');
  const [rejetEnCours, setRejetEnCours] = useState(null);
  const [motifRejet, setMotifRejet] = useState('');
  const [processingId, setProcessingId] = useState(null);

  async function load(role) {
    try {
      const data = await getComptesEnAttente(role || undefined);
      setComptes(data);
    } catch {
      setComptes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let annule = false;
    getComptesEnAttente(filtreRole || undefined)
      .then((data) => { if (!annule) setComptes(data); })
      .catch(() => { if (!annule) setComptes([]); })
      .finally(() => { if (!annule) setLoading(false); });
    return () => { annule = true; };
  }, [filtreRole]);

  async function handleApprouver(id) {
    setProcessingId(id);
    try {
      await validerCompte(id, { approuve: true });
      await load(filtreRole);
    } finally {
      setProcessingId(null);
    }
  }

  function startRejet(id) {
    setRejetEnCours(id);
    setMotifRejet('');
  }

  async function confirmRejet() {
    if (!motifRejet.trim()) return;
    setProcessingId(rejetEnCours);
    try {
      await validerCompte(rejetEnCours, { approuve: false, motifRejet });
      setRejetEnCours(null);
      await load(filtreRole);
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-7 h-7" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comptes en attente"
        description="Approuvez ou refusez les inscriptions professionnelles."
        action={
          <Select value={filtreRole} onChange={(e) => { setLoading(true); setFiltreRole(e.target.value); }} className="!w-auto">
            {FILTRES_ROLE.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </Select>
        }
      />

      {comptes.length === 0 ? (
        <Card>
          <EmptyState icon={UserCheck} title="Aucun compte en attente" description="Les nouvelles inscriptions professionnelles apparaîtront ici." />
        </Card>
      ) : (
        <div className="space-y-3">
          {comptes.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display font-semibold text-(--color-ink-900)">{c.prenom} {c.nom}</p>
                    <RoleBadge role={c.role} />
                  </div>
                  <p className="text-sm text-(--color-ink-600) mt-0.5">{c.email}</p>
                  {c.telephone && <p className="text-sm text-(--color-ink-600)">{c.telephone}</p>}
                  {c.role === 'MEDECIN' && (
                    <p className="flex items-center gap-1.5 text-sm text-(--color-amber-500) font-medium mt-1.5">
                      <Stethoscope size={14} /> {c.specialite || 'Spécialité non renseignée'}
                      {c.numeroOrdre && ` · Ordre n° ${c.numeroOrdre}`}
                    </p>
                  )}
                  {c.role === 'INFIRMIER' && (
                    <div className="flex items-center gap-2 mt-2">
                      <PhotoInfirmier infirmierId={c.id} disponible={!!c.photoDisponible} className="w-16 h-16" />
                      {!c.photoDisponible && <span className="text-xs text-(--color-clay-500)">Aucune photo de profil</span>}
                    </div>
                  )}
                  <p className="text-xs text-(--color-ink-300) mt-1.5">
                    Inscrit le {new Date(c.dateInscription).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {rejetEnCours !== c.id && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      disabled={processingId === c.id}
                      onClick={() => handleApprouver(c.id)}
                    >
                      <Check size={15} /> Approuver
                    </Button>
                    <Button
                      variant="danger"
                      disabled={processingId === c.id}
                      onClick={() => startRejet(c.id)}
                    >
                      <X size={15} /> Refuser
                    </Button>
                  </div>
                )}
              </div>

              {rejetEnCours === c.id && (
                <div className="mt-4 pt-4 border-t border-(--color-petrol-100) space-y-3">
                  <Textarea
                    rows={2}
                    placeholder="Motif du refus (obligatoire)"
                    value={motifRejet}
                    onChange={(e) => setMotifRejet(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="danger"
                      disabled={!motifRejet.trim() || processingId === c.id}
                      onClick={confirmRejet}
                    >
                      Confirmer le refus
                    </Button>
                    <Button variant="ghost" onClick={() => setRejetEnCours(null)}>Annuler</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
