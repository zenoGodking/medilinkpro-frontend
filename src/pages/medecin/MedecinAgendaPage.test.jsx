import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MedecinAgendaPage from './MedecinAgendaPage';
import { rendre } from '../../test/outils';
import * as rdvApi from '../../api/rendezVous';

const demain = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 19);

vi.mock('../../api/rendezVous', () => ({
  getRendezVousByMedecin: vi.fn(),
  updateStatutRendezVous: vi.fn(),
  accepterRendezVous: vi.fn().mockResolvedValue({}),
  refuserRendezVous: vi.fn().mockResolvedValue({}),
  reporterRendezVous: vi.fn().mockResolvedValue({}),
}));
vi.mock('../../api/disponibilites', () => ({ getCreneaux: vi.fn().mockResolvedValue([]) }));

const medecin = { userId: 'm1', role: 'MEDECIN', prenom: 'Paul', nom: 'Kamga' };
const demande = (id) => ({ id, patientId: 'p1', patientNomComplet: 'Aline Mballa', dateHeure: demain, statut: 'EN_ATTENTE', type: 'PHYSIQUE' });

describe('Agenda du médecin', () => {
  it('accepte une demande et refuse une autre avec un motif', async () => {
    const u = userEvent.setup();
    rdvApi.getRendezVousByMedecin.mockResolvedValue([demande('r1'), demande('r2')]);
    rendre(<MedecinAgendaPage />, { user: medecin });

    const cartes = await screen.findAllByText('Aline Mballa');
    expect(cartes).toHaveLength(2);
    expect(screen.getByRole('button', { name: /À traiter/ })).toHaveTextContent('2');

    await u.click(screen.getAllByRole('button', { name: /Accepter/ })[0]);
    expect(rdvApi.accepterRendezVous).toHaveBeenCalledWith('r1');

    await u.click(screen.getAllByRole('button', { name: /Refuser/ })[1]);
    await u.type(screen.getByPlaceholderText(/Motif \(facultatif/), 'En congrès');
    await u.click(screen.getByRole('button', { name: /Confirmer le refus/ }));
    expect(rdvApi.refuserRendezVous).toHaveBeenCalledWith('r2', 'En congrès');
  });

  it('impose de choisir un créneau pour reporter', async () => {
    const u = userEvent.setup();
    rdvApi.getRendezVousByMedecin.mockResolvedValue([demande('r1')]);
    rendre(<MedecinAgendaPage />, { user: medecin });
    await screen.findByText('Aline Mballa');
    await u.click(screen.getByRole('button', { name: /Reporter/ }));
    const zone = screen.getByText('Choisissez le nouveau créneau').parentElement;
    expect(within(zone).getAllByRole('button', { name: /^Reporter/ }).at(-1)).toBeDisabled();
    expect(rdvApi.reporterRendezVous).not.toHaveBeenCalled();
  });
});
