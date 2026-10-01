# MediLinkPro — Frontend (Espace Patient)

Application React (Vite) pour l'espace patient de MediLinkPro : authentification,
dossier medical, recherche de specialistes geolocalises, prise et suivi de
rendez-vous.

## Stack

- React 19 + Vite
- React Router 7
- Tailwind CSS v4 (via `@tailwindcss/vite`, pas de `tailwind.config.js` — config dans `src/index.css`)
- Axios
- lucide-react (icones)

## Lancer le projet

Pre-requis : Node.js 18+ et le backend MediLinkPro lance sur `http://localhost:8080`
(voir le README du backend — `docker compose up -d postgres` puis `mvn spring-boot:run`,
ou `docker compose up --build` pour tout lancer).

```bash
npm install
npm run dev
```

L'application est servie sur `http://localhost:5173`.

## Configuration

Le fichier `.env` definit l'URL de l'API :

```
VITE_API_BASE_URL=http://localhost:8080
```

Modifiez-le si votre backend tourne sur un autre port/hote.

## Fonctionnalites incluses

- **Authentification** : inscription patient (`/inscription`) et connexion (`/connexion`),
  token JWT stocke en `sessionStorage` et injecte automatiquement sur chaque requete API.
- **Tableau de bord** (`/`) : mise en avant du prochain rendez-vous, raccourcis.
- **Dossier medical** (`/dossier`) : consultations, resultats d'analyses.
- **Recherche de specialistes** (`/recherche`) : filtre par specialite, tri par
  proximite via geolocalisation navigateur (bouton "Pres de moi").
- **Rendez-vous** (`/rendez-vous`) : liste, statut, annulation ; prise de
  rendez-vous depuis la fiche d'un medecin (`/rendez-vous/nouveau/:medecinId`).

## Identite visuelle

- **Couleurs** : bleu petrole (`#0F4C5C`) pour la confiance medicale, ambre (`#F2A65A`)
  pour les accents et appels a l'action, vert sauge (`#2E8B6F`) pour les statuts positifs,
  fond ivoire (`#FAF7F2`) plutot qu'un blanc clinique.
- **Typographie** : Outfit (titres) + Inter (texte courant), chargees via Google Fonts
  dans `index.html`.
- **Signature** : la carte "prochain rendez-vous" en evidence sur le tableau de bord.

## Notes

- Si le backend renvoie une erreur CORS, verifiez que `SecurityConfig.java`
  autorise bien l'origine `http://localhost:5173` (la configuration actuelle du
  backend autorise deja toutes les origines via `allowedOriginPatterns("*")`).
- Le build de production (`npm run build`) genere le dossier `dist/`.
- Contrairement au backend Spring Boot, ce frontend a pu etre compile et builde
  avec succes dans l'environnement de generation (`npm run build` → succes).

## Configuration (variables Vite)

| Variable | Role | Defaut |
|---|---|---|
| `VITE_API_BASE_URL` | URL du backend | `http://localhost:8080` |
| `VITE_ROUTAGE_URL` | serveur OSRM pour les itineraires dans l'application | serveur public de demonstration (a remplacer en production) |
| `VITE_TUILES_URL` | fonds de carte | OpenStreetMap |
| `VITE_ICE_SERVERS` | serveurs STUN/TURN (JSON) de la teleconsultation | STUN public Google |

## Tests

```bash
npm test          # Vitest + Testing Library (parcours critiques)
npm run lint
```

## Mode reseau faible

Le service worker (`public/sw.js`) met l'application en cache et garde une copie de secours des donnees lues
(par session, 24 h max, effacee a la deconnexion). Les lectures sont retentees automatiquement, les photos sont
compressees avant envoi et la teleconsultation propose une video allegee. Un bandeau signale l'etat du reseau.
