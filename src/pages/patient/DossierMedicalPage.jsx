import { useEffect, useState } from 'react';
import { FileHeart, Stethoscope, Pill, FlaskConical, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDossierMedicalByPatient } from '../../api/patients';
import { Card, Spinner, EmptyState } from '../../components/ui';
import InfosUrgenceCard from '../../components/InfosUrgenceCard';
import AutorisationsMedecinsCard from '../../components/AutorisationsMedecinsCard';
import JournalAccesCard from '../../components/JournalAccesCard';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function DossierMedicalPage() {
  const { user } = useAuth();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getDossierMedicalByPatient(user.userId);
        if (!cancelled) setDossier(data);
      } catch {
        if (!cancelled) setErrorMsg("Impossible de charger votre dossier medical pour le moment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user.userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-7 h-7" />
      </div>
    );
  }

  if (errorMsg || !dossier) {
    return (
      <Card>
        <EmptyState icon={FileHeart} title="Dossier indisponible" description={errorMsg || "Aucune donnee trouvee."} />
      </Card>
    );
  }

  const consultations = dossier.consultations || [];
  const resultats = dossier.resultatsAnalyses || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-(--color-petrol-700)">Mon dossier medical</h1>
        <p className="text-(--color-ink-600) mt-1">
          Cree le {formatDate(dossier.dateCreation)} · Mis a jour le {formatDate(dossier.derniereMiseAJour)}
        </p>
      </div>

      <div className="flex items-center gap-2 bg-(--color-sage-100) text-(--color-sage-500) text-sm font-medium rounded-xl px-4 py-3 w-fit">
        <ShieldCheck size={17} />
        Dossier chiffre et confidentiel
      </div>

      <InfosUrgenceCard patientId={user.userId} />
      <AutorisationsMedecinsCard />
      <JournalAccesCard />

      {/* Consultations */}
      <section>
        <h2 className="font-display font-semibold text-lg text-(--color-ink-900) mb-3 flex items-center gap-2">
          <Stethoscope size={19} className="text-(--color-petrol-600)" /> Consultations
        </h2>
        {consultations.length === 0 ? (
          <Card>
            <EmptyState icon={Stethoscope} title="Aucune consultation enregistree" description="Vos comptes rendus de consultation apparaitront ici." />
          </Card>
        ) : (
          <div className="space-y-3">
            {consultations.map((c) => (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-display font-semibold text-(--color-ink-900)">
                      Dr {c.medecinNomComplet}
                    </p>
                    <p className="text-sm text-(--color-ink-600)">{formatDate(c.date)}</p>
                  </div>
                  {c.ordonnanceId && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-(--color-amber-500) bg-(--color-amber-400)/15 px-2.5 py-1 rounded-full">
                      <Pill size={13} /> Ordonnance disponible
                    </span>
                  )}
                </div>
                {c.motif && <p className="text-sm text-(--color-ink-600) mt-3"><span className="font-medium text-(--color-ink-900)">Motif :</span> {c.motif}</p>}
                {c.diagnostic && <p className="text-sm text-(--color-ink-600) mt-1"><span className="font-medium text-(--color-ink-900)">Diagnostic :</span> {c.diagnostic}</p>}
                {c.compteRendu && <p className="text-sm text-(--color-ink-600) mt-1"><span className="font-medium text-(--color-ink-900)">Compte rendu :</span> {c.compteRendu}</p>}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Resultats d'analyses */}
      <section>
        <h2 className="font-display font-semibold text-lg text-(--color-ink-900) mb-3 flex items-center gap-2">
          <FlaskConical size={19} className="text-(--color-petrol-600)" /> Resultats d'analyses
        </h2>
        {resultats.length === 0 ? (
          <Card>
            <EmptyState icon={FlaskConical} title="Aucun resultat disponible" description="Les resultats transmis par vos laboratoires partenaires apparaitront ici." />
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {resultats.map((r) => (
              <Card key={r.id} className="p-4">
                <p className="font-medium text-(--color-ink-900)">{r.type || 'Analyse'}</p>
                <p className="text-sm text-(--color-ink-600)">{r.laboratoire}</p>
                <p className="text-xs text-(--color-ink-300) mt-1">{formatDate(r.dateResultat)}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
