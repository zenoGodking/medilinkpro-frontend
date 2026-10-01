import { useEffect, useState } from 'react';
import { History, Eye, PenLine, ScanFace, QrCode, Pill, HeartCrack, Siren } from 'lucide-react';
import { Card, Spinner } from './ui';
import { getJournalAcces } from '../api/carnets';

const TYPES = {
  LECTURE: { icon: Eye, texte: 'a consulté votre carnet' },
  ECRITURE: { icon: PenLine, texte: 'a écrit dans votre carnet' },
  RECONNAISSANCE_FACIALE: { icon: ScanFace, texte: "a scanné un visage qui vous ressemble et vu vos informations d'urgence" },
  CARNET_URGENCE: { icon: Siren, texte: "a ouvert votre carnet en urgence après un scan" },
  CARTE_URGENCE: { icon: QrCode, texte: "a scanné votre carte d'urgence" },
  PHARMACIE: { icon: Pill, texte: 'a consulté ou délivré une de vos ordonnances' },
  DECLARATION_DECES: { icon: HeartCrack, texte: 'a déclaré un décès' },
};

const ROLES = { MEDECIN: 'Médecin', INFIRMIER: 'Infirmier(e)', ADMIN: 'Administrateur', PHARMACIEN: 'Pharmacien(ne)', PATIENT: 'Un utilisateur' };

function qui(a) {
  if (!a.nom) return ROLES[a.role] || 'Un utilisateur';
  return a.role === 'MEDECIN' ? `Dr ${a.nom}` : `${a.nom} (${(ROLES[a.role] || a.role).toLowerCase()})`;
}

/** "Qui a consulte mon carnet" : contrepartie de l'acces en lecture de tous les medecins. */
export default function JournalAccesCard() {
  const [journal, setJournal] = useState(null);
  const [tout, setTout] = useState(false);

  useEffect(() => {
    getJournalAcces().then(setJournal).catch(() => setJournal([]));
  }, []);

  const affiche = journal && (tout ? journal : journal.slice(0, 5));

  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-display font-semibold text-(--color-ink-900)">
        <History size={18} className="text-(--color-petrol-600)" /> Qui a consulté mon carnet
      </h2>
      <p className="text-sm text-(--color-ink-600) mt-0.5">
        Tout médecin peut consulter votre carnet ; chaque accès est enregistré ici.
      </p>

      {!journal ? (
        <div className="flex justify-center py-4"><Spinner className="w-5 h-5" /></div>
      ) : journal.length === 0 ? (
        <p className="text-sm text-(--color-ink-600) mt-4">Personne n'a encore consulté votre carnet.</p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-(--color-petrol-100)">
            {affiche.map((a, i) => {
              const { icon: Icon, texte } = TYPES[a.typeAcces] || TYPES.LECTURE;
              return (
                <li key={i} className="flex items-start gap-3 py-2.5 text-sm">
                  <Icon size={16} className="mt-0.5 shrink-0 text-(--color-petrol-400)" />
                  <div className="flex-1">
                    <span className="font-semibold text-(--color-ink-900)">{qui(a)}</span>{' '}
                    <span className="text-(--color-ink-600)">{texte}</span>
                  </div>
                  <time className="text-xs text-(--color-ink-300) whitespace-nowrap">
                    {new Date(a.dateAcces).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </time>
                </li>
              );
            })}
          </ul>
          {journal.length > 5 && (
            <button type="button" onClick={() => setTout((v) => !v)} className="mt-2 text-sm font-semibold text-(--color-petrol-600) hover:underline">
              {tout ? 'Afficher moins' : `Tout afficher (${journal.length})`}
            </button>
          )}
        </>
      )}
    </Card>
  );
}
