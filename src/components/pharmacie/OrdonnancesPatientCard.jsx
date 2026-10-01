import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Pill, QrCode, CheckCircle2, X } from 'lucide-react';
import { Card, Button } from '../ui';
import { getOrdonnancesByPatient } from '../../api/patients';
import { getQrOrdonnance, lienOrdonnance } from '../../api/pharmacie';

/** Ordonnances du patient, avec le QR code a presenter en pharmacie. */
export default function OrdonnancesPatientCard({ patientId }) {
  const [ordonnances, setOrdonnances] = useState([]);
  const [qr, setQr] = useState(null);

  useEffect(() => {
    getOrdonnancesByPatient(patientId)
      .then((l) => setOrdonnances([...l].sort((a, b) => new Date(b.dateEmission) - new Date(a.dateEmission))))
      .catch(() => setOrdonnances([]));
  }, [patientId]);

  async function afficher(o) {
    const { jeton, dateExpiration } = await getQrOrdonnance(o.id);
    setQr({ id: o.id, image: await QRCode.toDataURL(lienOrdonnance(jeton), { width: 280, margin: 1 }), dateExpiration });
  }

  if (ordonnances.length === 0) return null;
  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-display font-semibold text-(--color-ink-900)">
        <Pill size={18} className="text-(--color-petrol-600)" /> Mes ordonnances
      </h2>
      <ul className="mt-3 divide-y divide-(--color-petrol-100)">
        {ordonnances.map((o) => (
          <li key={o.id} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm min-w-0">
                <p className="font-semibold text-(--color-ink-900)">Dr {o.medecinNomComplet} · {new Date(o.dateEmission).toLocaleDateString('fr-FR')}</p>
                <p className="text-(--color-ink-600) whitespace-pre-line">{o.medicaments}</p>
                {o.dateDelivrance && (
                  <p className="flex items-center gap-1 text-xs text-(--color-sage-500) mt-1">
                    <CheckCircle2 size={12} /> Délivrée le {new Date(o.dateDelivrance).toLocaleDateString('fr-FR')} · {o.delivreePar}
                  </p>
                )}
              </div>
              {!o.dateDelivrance && (qr?.id === o.id ? (
                <button type="button" onClick={() => setQr(null)} aria-label="Masquer" className="p-1.5 text-(--color-ink-300)"><X size={16} /></button>
              ) : (
                <Button variant="ghost" className="!px-3 !py-1.5 border border-(--color-petrol-100) shrink-0" onClick={() => afficher(o)}>
                  <QrCode size={15} /> Présenter en pharmacie
                </Button>
              ))}
            </div>
            {qr?.id === o.id && (
              <div className="mt-3 flex flex-col items-center gap-2 rounded-xl bg-(--color-petrol-50) p-4">
                <img src={qr.image} alt="QR code de l'ordonnance" className="w-56 h-56 bg-white p-2 rounded-lg" />
                <p className="text-xs text-(--color-ink-600) text-center">
                  Montrez ce code au pharmacien. Valable jusqu'au {new Date(qr.dateExpiration).toLocaleDateString('fr-FR')}, délivrable une seule fois.
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
