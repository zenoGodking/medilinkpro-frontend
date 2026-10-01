import { useState, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import * as authApi from '../api/auth';
import { viderCopieLocale } from '../api/client';


function readStoredUser() {
  try {
    const raw = sessionStorage.getItem('medilinkpro_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const persistSession = useCallback((authResponse) => {
    const { token, ...userInfo } = authResponse;
    sessionStorage.setItem('medilinkpro_token', token);
    sessionStorage.setItem('medilinkpro_user', JSON.stringify(userInfo));
    setUser(userInfo);
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(credentials);
      persistSession(response);
      return response;
    } catch (err) {
      const message = err.response?.data?.message || "Email ou mot de passe incorrect.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [persistSession]);

  const register = useCallback(async (payload, visage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.register(payload, visage);
      // Patient et Admin recoivent un token et sont connectes immediatement.
      // Medecin, Infirmier et Directeur passent par une validation admin :
      // aucun token n'est emis, on ne connecte donc pas l'utilisateur.
      if (response.token) {
        persistSession(response);
      }
      return response;
    } catch (err) {
      const message = err.response?.data?.message || "Impossible de créer le compte.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [persistSession]);

  const logout = useCallback(() => {
    viderCopieLocale();
    sessionStorage.removeItem('medilinkpro_token');
    sessionStorage.removeItem('medilinkpro_user');
    setUser(null);
  }, []);

  const value = { user, loading, error, login, register, logout, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

