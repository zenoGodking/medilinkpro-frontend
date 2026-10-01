import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MotDePasseOubliePage from './MotDePasseOubliePage';
import { rendre, erreurApi } from '../test/outils';
import * as auth from '../api/auth';

vi.mock('../api/auth', () => ({
  demanderCodeReinitialisation: vi.fn(),
  reinitialiserMotDePasse: vi.fn(),
}));

describe('Mot de passe oublié', () => {
  it('envoie le code puis vérifie la confirmation avant de réinitialiser', async () => {
    const u = userEvent.setup();
    auth.demanderCodeReinitialisation.mockResolvedValue({ message: 'Code envoyé par SMS.' });
    auth.reinitialiserMotDePasse.mockRejectedValueOnce(erreurApi('Code incorrect.')).mockResolvedValueOnce({});
    rendre(<MotDePasseOubliePage />);

    await u.type(screen.getByPlaceholderText('vous@exemple.com'), 'aline@test.cm');
    await u.click(screen.getByRole('button', { name: 'Recevoir un code' }));
    expect(auth.demanderCodeReinitialisation).toHaveBeenCalledWith('aline@test.cm');
    expect(await screen.findByText('Code envoyé par SMS.')).toBeInTheDocument();

    await u.type(screen.getByPlaceholderText('123456'), '12a3456');
    expect(screen.getByPlaceholderText('123456')).toHaveValue('123456');
    const [nouveau, confirmation] = screen.getAllByDisplayValue('').filter((e) => e.type === 'password');
    await u.type(nouveau, 'NouveauSecret42');
    await u.type(confirmation, 'Different42');
    await u.click(screen.getByRole('button', { name: 'Changer mon mot de passe' }));
    expect(screen.getByText('Les deux mots de passe ne correspondent pas.')).toBeInTheDocument();
    expect(auth.reinitialiserMotDePasse).not.toHaveBeenCalled();

    await u.clear(confirmation);
    await u.type(confirmation, 'NouveauSecret42');
    await u.click(screen.getByRole('button', { name: 'Changer mon mot de passe' }));
    expect(await screen.findByText('Code incorrect.')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Changer mon mot de passe' }));
    expect(await screen.findByText('Mot de passe modifié.')).toBeInTheDocument();
    expect(auth.reinitialiserMotDePasse).toHaveBeenLastCalledWith({ email: 'aline@test.cm', code: '123456', nouveauMotDePasse: 'NouveauSecret42' });
  });
});
