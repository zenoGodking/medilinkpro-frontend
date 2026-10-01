import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/** Rend un composant dans un routeur en memoire avec un utilisateur connecte factice. */
export function rendre(element, { user = null, route = '/', chemin = '*', autresRoutes = [] } = {}) {
  const valeur = {
    user, loading: false, error: null, login: async () => {}, register: async () => {}, logout: () => {},
    isAuthenticated: Boolean(user),
  };
  return render(
    <AuthContext.Provider value={valeur}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={chemin} element={element} />
          {autresRoutes.map((r) => <Route key={r.path} path={r.path} element={r.element} />)}
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

/** Erreur axios simulee renvoyee par l'API. */
export function erreurApi(message, status = 400) {
  return Object.assign(new Error(message), { response: { status, data: { message } } });
}
