import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NouveauRendezVousPage from './NouveauRendezVousPage';
import { rendre, erreurApi } from '../../test/outils';
import { getCreneaux } from '../../api/disponibilites';
import { createRendezVous } from '../../api/rendezVous';

vi.mock('../../api/medecins', () => ({
  getMedecin: vi.fn().mockResolvedValue({ id: 'm1', prenom: 'Paul', nom: 'Kamga', specialite: 'Cardiologie', etablissementId: 'e1', nombreAvis: 0 }),
}));
vi.mock('../../api/disponibilites', () => ({
  getCreneaux: vi.fn((_, du) => Promise.resolve([
    { debut: `${du}T09:00:00`, fin: `${du}T09:30:00`, libre: true },
    { debut: `${du}T09:30:00`, fin: `${du}T10:00:00`, libre: false },
  ])),
}));
vi.mock('../../api/rendezVous', () => ({
  createRendezVous: vi.fn(),
  getAvisMedecin: vi.fn().mockResolvedValue({ nombre: 0, avis: [] }),
}));

const patient = { userId: 'p1', role: 'PATIENT', prenom: 'Aline', nom: 'Mballa' };

describe('Prise de rendez-vous', () => {
  it('ne propose que les créneaux libres et envoie la demande pour le créneau choisi', async () => {
    const u = userEvent.setup();
    createRendezVous.mockRejectedValueOnce(erreurApi("Ce creneau n'est plus disponible.")).mockResolvedValueOnce({});
    rendre(<NouveauRendezVousPage />, { user: patient, route: '/patient/rendez-vous/nouveau/m1', chemin: '/patient/rendez-vous/nouveau/:medecinId' });

    expect(await screen.findByText('Dr Paul Kamga')).toBeInTheDocument();
    const pris = await screen.findByRole('button', { name: '09:30' });
    expect(pris).toBeDisabled();
    const envoyer = screen.getByRole('button', { name: /Demander ce rendez-vous/ });
    expect(envoyer).toBeDisabled();

    await u.click(screen.getByRole('button', { name: '09:00' }));
    await u.click(envoyer);
    const du = getCreneaux.mock.calls[0][1];
    expect(createRendezVous).toHaveBeenCalledWith({
      patientId: 'p1', medecinId: 'm1', dateHeure: `${du}T09:00:00`, type: 'PHYSIQUE', etablissementId: 'e1',
    });
    // Conflit : message affiche, choix efface et creneaux relus
    expect(await screen.findByText("Ce creneau n'est plus disponible.")).toBeInTheDocument();
    expect(getCreneaux.mock.calls.length).toBeGreaterThan(1);

    await u.click(screen.getByRole('button', { name: /Téléconsultation/ }));
    await u.click(await screen.findByRole('button', { name: '09:00' }));
    await u.click(screen.getByRole('button', { name: /Demander ce rendez-vous/ }));
    expect(createRendezVous).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'TELECONSULTATION', etablissementId: null }));
    expect(await screen.findByText('Demande envoyée !')).toBeInTheDocument();
  });
});
