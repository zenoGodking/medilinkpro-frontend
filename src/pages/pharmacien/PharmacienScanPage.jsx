import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, AlertTriangle } from 'lucide-react';
import { Card, PageHeader } from '../../components/ui';
import ScannerQr from '../../components/pharmacie/ScannerQr';
import { jetonDepuisQr } from '../../api/pharmacie';

export default function PharmacienScanPage() {
  const navigate = useNavigate();
  const [erreur, setErreur] = useState(null);

  function lu(texte) {
    const jeton = jetonDepuisQr(texte);
    if (!jeton) {
      setErreur("Ce QR code n'est pas une ordonnance MediLinkPro.");
      return;
    }
    navigate(`/pharmacie/ordonnance/${jeton}`);
  }

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader
        title="Verifier une ordonnance"
        description="Scannez le QR code presente par le patient pour verifier l'ordonnance puis la delivrer."
      />
      <Card className="p-5 space-y-4">
        <ScannerQr onCode={lu} />
        {erreur && (
          <p className="flex items-start gap-2 text-sm text-(--color-clay-500)"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> {erreur}</p>
        )}
        <p className="flex items-start gap-2 text-sm text-(--color-ink-600)">
          <ScanLine size={16} className="mt-0.5 shrink-0" />
          Vous pouvez aussi scanner le code avec l'appareil photo de votre telephone : le lien ouvre directement l'ordonnance.
        </p>
      </Card>
    </div>
  );
}
