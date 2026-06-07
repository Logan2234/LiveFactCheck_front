# LiveFactChecker — Frontend

Interface temps réel du fact-checker audio. Capture le micro dans le navigateur,
envoie l'audio par tranches de 5 s au backend via WebSocket, et affiche les
affirmations vérifiées au fil de l'eau dans plusieurs mises en page.

## Stack

| Composant | Techno                              |
| --------- | ----------------------------------- |
| Framework | SvelteKit 2 + Svelte 5 (runes)      |
| Langage   | TypeScript                          |
| Build     | Vite                                |
| Audio     | `MediaRecorder` (WebM/Opus)         |
| Réseau    | WebSocket (reconnexion auto)        |
| Formatage | Prettier + prettier-plugin-svelte   |

## Prérequis

- Node.js 18+
- Le [backend](../backend/README.md) lancé sur `http://localhost:8000`

## Installation & lancement

```bash
cd frontend
npm install
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

> Le micro nécessite un contexte sécurisé : `localhost` fonctionne, sinon il faut
> du HTTPS.

## Scripts

| Commande               | Rôle                                         |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Serveur de dev Vite                          |
| `npm run build`        | Build de production                          |
| `npm run preview`      | Prévisualise le build de production          |
| `npm run check`        | Vérification de types (svelte-check)         |
| `npm run format`       | Formate le code (Prettier)                   |
| `npm run format:check` | Vérifie le formatage sans modifier           |

## Configuration

L'URL du WebSocket est définie dans [`src/lib/websocket.ts`](src/lib/websocket.ts)
(`WS_URL = ws://localhost:8000/ws`). Adaptez-la si le backend tourne ailleurs.

## Fonctionnement

1. `startRecording()` ouvre le micro et lance un `MediaRecorder` qui produit une
   tranche WebM/Opus autonome toutes les 5 s.
2. Chaque tranche est envoyée en binaire sur le WebSocket.
3. Le backend renvoie le transcript puis les claims (`pending` → vérifié, ou
   retiré si aucun fait).
4. Les claims alimentent les stores Svelte et s'affichent dans la mise en page
   sélectionnée.

### Raccourcis clavier

| Touche   | Action                  |
| -------- | ----------------------- |
| `Espace` | Démarrer / arrêter      |
| `Échap`  | Vider les claims        |

## Mises en page

Le sélecteur de l'en-tête bascule entre 9 layouts (store
[`src/lib/stores/layout.ts`](src/lib/stores/layout.ts)) : Classic, Dashboard,
Terminal, Spotlight, Table, Trust Meter, Ticker, Timeline, Chat.

## Structure

```text
frontend/
├── static/                      # assets servis tels quels
└── src/
    ├── routes/
    │   └── +page.svelte         # page principale : câblage WS, switcher de layout
    └── lib/
        ├── websocket.ts         # client WS (envoi audio, reconnexion auto)
        ├── components/          # AudioControls, ClaimCard, KeyboardShortcuts
        ├── layouts/             # les 9 mises en page
        └── stores/
            ├── audio.ts         # capture micro (MediaRecorder), transcript
            ├── claims.ts        # claims, filtres, stats dérivées
            ├── layout.ts        # layout actif
            └── ui.ts            # état UI (flash, etc.)
```
