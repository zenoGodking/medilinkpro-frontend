import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminUtilisateursPage from './AdminUtilisateursPage';
import { rendre } from '../../test/outils';
import * as admin from '../../api/admin';

vi.mock('../../api/admin', () => ({
  getTousLesUtilisateurs: vi.fn().mockResolvedValue([
    { id: 'a1', prenom: 'Super', nom: 'admin', email: 'admin@test.cm', role: 'ADMIN', statutCompte: 'APPROUVE', actif: true },
    { id: 'u1', prenom: 'Aline', nom: 'Mballa', email: 'aline@test.cm', role: 'PATIENT', statutCompte: 'APPROUVE', actif: true },
  ]),
  supprimerUtilisateur: vi.fn(),
  toggleActif: vi.fn(),
  genererNouveauMotDePasse: vi.fn().mockResolvedValue('ABCD-EFGH-JKMN'),
}));

describe('Administration des utilisateurs', () => {
  it("génère un nouveau mot de passe après confirmation et l'affiche à l'admin", async () => {
    const u = userEvent.setup();
    rendre(<AdminUtilisateursPage />, { user: { userId: 'a1', role: 'ADMIN' } });

    // Un seul bouton : pas pour son propre compte
    const boutons = await screen.findAllByRole('button', { name: /Nouveau mot de passe/ });
    expect(boutons).toHaveLength(1);
    await u.click(boutons[0]);
    expect(admin.genererNouveauMotDePasse).not.toHaveBeenCalled();
    await u.click(screen.getByRole('button', { name: 'Oui, générer' }));

    expect(admin.genererNouveauMotDePasse).toHaveBeenCalledWith('u1');
    expect(await screen.findByText('ABCD-EFGH-JKMN')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: /Fermer/ }));
    expect(screen.queryByText('ABCD-EFGH-JKMN')).not.toBeInTheDocument();
  });
});
