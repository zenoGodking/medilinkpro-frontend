import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service worker : notifications push et installation de l'application (PWA).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(() => {
      // Aucune session ouverte (onglet ferme sans deconnexion) : on efface la copie locale des donnees.
      if (!sessionStorage.getItem('medilinkpro_token')) {
        navigator.serviceWorker.controller?.postMessage({ type: 'vider-copie-api' });
      }
    }).catch(() => {});
  });
}
