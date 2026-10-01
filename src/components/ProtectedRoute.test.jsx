import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';
import { rendre } from '../test/outils';

const routes = [
  { path: '/connexion', element: <p>Page de connexion</p> },
  { path: '/patient', element: <p>Espace patient</p> },
];

describe('ProtectedRoute', () => {
  it('renvoie vers la connexion sans session', () => {
    rendre(<ProtectedRoute allowedRoles={['MEDECIN']}><p>Agenda</p></ProtectedRoute>,
      { route: '/medecin/agenda', chemin: '/medecin/agenda', autresRoutes: routes });
    expect(screen.getByText('Page de connexion')).toBeInTheDocument();
  });

  it("renvoie un patient vers son espace s'il tente d'ouvrir celui du médecin", () => {
    rendre(<ProtectedRoute allowedRoles={['MEDECIN']}><p>Agenda</p></ProtectedRoute>,
      { user: { role: 'PATIENT' }, route: '/medecin/agenda', chemin: '/medecin/agenda', autresRoutes: routes });
    expect(screen.getByText('Espace patient')).toBeInTheDocument();
    expect(screen.queryByText('Agenda')).not.toBeInTheDocument();
  });

  it('affiche la page au bon rôle', () => {
    rendre(<ProtectedRoute allowedRoles={['MEDECIN']}><p>Agenda</p></ProtectedRoute>,
      { user: { role: 'MEDECIN' }, route: '/medecin/agenda', chemin: '/medecin/agenda', autresRoutes: routes });
    expect(screen.getByText('Agenda')).toBeInTheDocument();
  });
});
