import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Smartphone, Printer, RefreshCw, Download, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPatient } from '../../api/patients';
import { getMaCarteUrgence, regenererCarteUrgence, lienCarteUrgence } from '../../api/carteUrgence';
import { genererFondEcran } from '../../utils/fondEcranUrgence';
import { libelleGroupeSanguin } from '../../utils/groupeSanguin';
import { Card, Button, Spinner, PageHeader } from '../../components/ui';

const STYLE_IMPRESSION = `
@media print {
  body * { visibility: hidden; }
  #carte-imprimable, #carte-imprimable * { visibility: visible; }
  #carte-imprimable { position: absolute; left: 0; top: 0; width: 85.6mm; height: 54mm; }
}`;

function Etapes({ titre, etapes }) {
  return (
    <div>
      <p className="font-semibold text-(--color-ink-900) text-sm">{titre}</p>
      <ol className="list-decimal list-inside text-sm text-(--color-ink-600) mt-1 space-y-0.5">
        {etapes.map((e) => <li key={e}>{e}</li>)}
      </ol>
    </div>
  );
}

/**
 * Carte d'urgence du patient : QR code a mettre en fond d'ecran de verrouillage (visible meme
 * telephone verrouille) ou a imprimer, et guide pour remplir la fiche medicale native du telephone.
 */
export default function MaCarteUrgencePage() {
  const { user } = useAuth();
  const [jeton, setJeton] = useState(null);
  const [patient, setPatient] = useState(null);
  const [qr, setQr] = useState(null);
  const [afficherInfos, setAfficherInfos] = useState(true);
  const [confirmerRegeneration, setConfirmerRegeneration] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getMaCarteUrgence().then(setJeton).catch(() => setMessage('Carte indisponible pour le moment.'));
    getPatient(user.userId).then(setPatient).catch(() => {});
  }, [user.userId]);

  useEffect(() => {
    if (jeton) QRCode.toDataURL(lienCarteUrgence(jeton), { width: 320, margin: 1 }).then(setQr);
  }, [jeton]);

  async function telechargerFondEcran() {
    const blob = await genererFondEcran({ lien: lienCarteUrgence(jeton), patient, afficherInfos });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medilinkpro-urgence-ecran-verrouillage.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function regenerer() {
    setJeton(await regenererCarteUrgence());
    setConfirmerRegeneration(false);
    setMessage("Nouveau QR code cree. L'ancien ne fonctionne plus : remplacez votre fond d'ecran et votre carte imprimee.");
  }

  if (!jeton || !qr) {
    return <div className="flex justify-center py-20">{message ? <p>{message}</p> : <Spinner className="w-7 h-7" />}</div>;
  }

  const lienLocal = /localhost|127\.0\.0\.1/.test(window.location.origin);

  return (
    <div className="space-y-6 max-w-3xl">
      <style>{STYLE_IMPRESSION}</style>
      <PageHeader
        title="Ma carte d'urgence"
        description="Un QR code qui mene a vos informations d'urgence, meme si votre telephone est verrouille."
      />

      {message && <p className="text-sm bg-(--color-sage-100) text-(--color-sage-500) rounded-xl px-4 py-3">{message}</p>}
      {lienLocal && (
        <p className="flex items-start gap-2 text-sm bg-(--color-amber-400)/15 text-(--color-amber-500) rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          Application ouverte en local : ce QR code ne fonctionnera que sur cet ordinateur. Generez-le depuis le site en ligne.
        </p>
      )}

      <Card className="p-6 flex flex-col sm:flex-row items-center gap-6">
        {/* Carte au format carte bancaire, imprimable */}
        <div id="carte-imprimable" className="w-[340px] max-w-full rounded-2xl overflow-hidden border-2 border-(--color-clay-500) bg-white shrink-0">
          <div className="bg-(--color-clay-500) text-white text-center font-bold tracking-wide py-1.5 text-sm">URGENCE MEDICALE</div>
          <div className="flex gap-3 p-3 items-center">
            <img src={qr} alt="QR code de la carte d'urgence" className="w-28 h-28" />
            <div className="text-xs text-(--color-ink-900) space-y-0.5 min-w-0">
              {afficherInfos && patient ? (
                <>
                  <p className="font-bold text-sm">{patient.prenom}</p>
                  <p>Groupe : <strong>{libelleGroupeSanguin(patient.groupeSanguin)}</strong></p>
                  {patient.allergies && <p className="truncate">Allergies : {patient.allergies}</p>}
                  {patient.conditionsUrgence && <p className="truncate">A signaler : {patient.conditionsUrgence}</p>}
                  {patient.contactUrgenceTelephone && <p>Prevenir : {patient.contactUrgenceTelephone}</p>}
                </>
              ) : (
                <p>Scannez ce code avec l'application MediLinkPro.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 w-full">
          <label className="flex items-start gap-2 text-sm text-(--color-ink-600)">
            <input type="checkbox" className="mt-1" checked={afficherInfos} onChange={(e) => setAfficherInfos(e.target.checked)} />
            <span>
              Afficher mes informations en clair, lisibles sans application.
              Recommande : un secouriste sans MediLinkPro pourra quand meme les lire.
            </span>
          </label>
          <Button className="w-full" onClick={telechargerFondEcran}>
            <Download size={16} /> Telecharger le fond d'ecran de verrouillage
          </Button>
          <Button variant="ghost" className="w-full border border-(--color-petrol-100)" onClick={() => window.print()}>
            <Printer size={16} /> Imprimer la carte (portefeuille)
          </Button>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="flex items-center gap-2 font-display font-semibold text-(--color-ink-900)">
          <Smartphone size={18} /> Telephone verrouille : que voit le secouriste ?
        </h2>
        <p className="text-sm text-(--color-ink-600)">
          L'ecran de verrouillage reste visible meme avec un mot de passe. Le secouriste scanne le QR code avec
          <strong> son propre telephone</strong> : il n'a pas besoin de deverrouiller le votre.
        </p>
        <Etapes titre="Mettre le fond d'ecran" etapes={[
          "Telechargez l'image ci-dessus.",
          "Ouvrez-la dans votre galerie, puis Plus (⋮) ou Partager > Definir comme fond d'ecran.",
          "Choisissez « Ecran de verrouillage ».",
        ]} />
        <div className="rounded-xl bg-(--color-petrol-50) p-4 space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-(--color-petrol-700)">
            <ShieldCheck size={16} /> Remplissez aussi la fiche d'urgence de votre telephone
          </p>
          <p className="text-sm text-(--color-ink-600)">
            Elle s'affiche depuis l'ecran verrouille (bouton « Urgence »), meme sans reseau et sans MediLinkPro.
            Les noms des menus varient selon la marque.
          </p>
          <Etapes titre="Android" etapes={[
            'Parametres > Securite et urgence (ou « Informations d\'urgence »).',
            'Informations medicales : groupe sanguin, allergies, traitements.',
            "Contacts d'urgence : ajoutez votre proche.",
          ]} />
          <Etapes titre="iPhone" etapes={[
            'App Sante > votre photo > Fiche medicale > Modifier.',
            'Renseignez groupe sanguin, allergies, contacts.',
            'Activez « Afficher si verrouille ».',
          ]} />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="flex items-center gap-2 font-display font-semibold text-(--color-ink-900)">
          <QrCode size={18} /> Carte perdue ou telephone vole ?
        </h2>
        <p className="text-sm text-(--color-ink-600) mt-1">
          Creez un nouveau QR code : l'ancien ne donnera plus acces a vos informations.
        </p>
        {confirmerRegeneration ? (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-(--color-ink-600)">Remplacer le QR code actuel ?</span>
            <Button variant="danger" onClick={regenerer}>Oui, remplacer</Button>
            <Button variant="ghost" onClick={() => setConfirmerRegeneration(false)}>Annuler</Button>
          </div>
        ) : (
          <Button variant="ghost" className="mt-3 border border-(--color-petrol-100)" onClick={() => setConfirmerRegeneration(true)}>
            <RefreshCw size={15} /> Generer un nouveau QR code
          </Button>
        )}
      </Card>
    </div>
  );
}
