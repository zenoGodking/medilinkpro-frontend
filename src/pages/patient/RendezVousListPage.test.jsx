import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RendezVousListPage from './RendezVousListPage';
import { rendre } from '../../test/outils';
import * as rdvApi from '../../api/rendezVous';

vi.mock('../../api/rendezVous', () => ({
  getRendezVousByPatient: vi.fn(),
  updateStatutRendezVous: vi.fn(),
  donnerAvis: vi.fn().mockResolvedValue({}),
}));

const patient = { userId: 'p1', role: 'PATIENT' };
const hier = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 19);
const demain = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 19);

describe('Mes rendez-vous', () => {
  it('explique un refus, propose un autre créneau et permet de noter un rendez-vous effectué', async () => {
    const u = userEvent.setup();
    rdvApi.getRendezVousByPatient.mockResolvedValue([
      { id: 'r1', medecinId: 'm1', medecinNomComplet: 'Paul Kamga', dateHeure: hier, statut: 'TERMINE', type: 'PHYSIQUE', avisDonne: false },
      { id: 'r2', medecinId: 'm1', medecinNomComplet: 'Paul Kamga', dateHeure: demain, statut: 'REFUSE', type: 'PHYSIQUE', motifMedecin: 'En congrès' },
      { id: 'r3', medecinId: 'm1', medecinNomComplet: 'Paul Kamga', dateHeure: demain, statut: 'EN_ATTENTE', type: 'TELECONSULTATION' },
    ]);
    rendre(<RendezVousListPage />, { user: patient });

    expect(await screen.findByText(/« En congrès »/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Choisir un autre créneau' })).toHaveAttribute('href', '/patient/rendez-vous/nouveau/m1');
    expect(screen.getByText(/Le médecin doit confirmer votre demande/)).toBeInTheDocument();
    // Pas de bouton Rejoindre tant que la teleconsultation n'est pas confirmee
    expect(screen.queryByRole('button', { name: /Rejoindre/ })).not.toBeInTheDocument();

    await u.click(screen.getByRole('button', { name: /Donner mon avis/ }));
    const publier = screen.getByRole('button', { name: 'Publier mon avis' });
    expect(publier).toBeDisabled();
    await u.click(screen.getByRole('button', { name: '4 étoiles' }));
    await u.type(screen.getByPlaceholderText(/Votre commentaire/), 'Très à l\'écoute');
    await u.click(publier);
    expect(rdvApi.donnerAvis).toHaveBeenCalledWith('r1', { note: 4, commentaire: "Très à l'écoute" });
  });
});
