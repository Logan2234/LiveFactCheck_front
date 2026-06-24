# TODO — Frontend

Liste de travail estimée à partir de l'état actuel du code. À trier/prioriser.
La source de vérité reste le code, pas ce fichier (cf. CLAUDE.md racine).

## Features métier (nouvelles capacités)

Aujourd'hui : capture micro → claims affichés en live sur 9 layouts, copie d'une carte
au presse-papier. Tout est éphémère (un refresh vide l'écran), pas de recherche ni de partage.

- [ ] **Recherche / filtre texte** dans les claims (en plus du filtre par statut existant),
      utile dès qu'une session devient longue.
- [ ] **Filtre par catégorie & par score de confiance** (les données existent déjà sur
      chaque `Claim` : `category`, `confidence` — actuellement non exploitées comme filtres).
- [x] **Export de la session** : deux chemins. (1) Session **en cours** exportée
      côté client (sans auth) en Markdown / JSON depuis les stores
      (`lib/utils/export.ts`, boutons dans `SettingsMenu.svelte`). (2) Sessions
      **passées** exportées via la route back admin (`lib/sessions.ts` →
      `/sessions/{id}/export`). PDF non fait.
- [x] **Mode replay / historique** : page admin `routes/admin/sessions/`
      (liste + détail `[id]` : stats, claims, transcript) consommant l'historique
      back. Lecture seule (pas de « rejeu » audio temps réel).
- [ ] **Mode overlay / streaming** : un layout transparent plein écran (claims qui
      apparaissent/disparaissent en fade) destiné à être capturé dans OBS pour un live.
- [x] **Alerte visuelle/sonore sur claim "false"** (front uniquement) : toast global
      `FalseClaimAlert.svelte` (animation, auto-disparition) + bip Web Audio optionnel
      (toggle 🔔 persisté dans `stores/alerts.ts`), déclenché depuis `+page.svelte`.
- [ ] **Webhook / notification serveur sur claim "false"** : pousser l'alerte hors de
      l'onglet (webhook configurable, intégration OBS/Slack…). Côté back — cf.
      « Webhook / notification sur claim "false" » dans `backend/TODO.md`.
- [x] **Sélecteur de niveau de vérification** dans `AudioControls` (rapide vs approfondi),
      en miroir de l'option back : toggle `VerificationSelector.svelte`, persisté en
      localStorage (`stores/verification.ts`), envoyé au back via le message WS `config`
      (champ `verification_level`).
- [x] **Réglage de la langue de transcription** depuis l'UI : sélecteur filtrable
      (auto + 100 langues) dans `AudioControls`, persisté en localStorage, envoyé au back
      via un message WS `config`. La langue sert de filtre (les chunks d'une autre langue
      sont ignorés), badge de langue détectée affiché en mode auto.
- [ ] **Réglage de la langue de vérification** (langue des claims / prompt Claude) depuis
      l'UI — dépend du multilingue back (cf. « Multilingue (prompt Claude) » dans back/TODO.md).
- [ ] **Partage d'un claim** : générer une image/carte partageable d'un démenti
      (au-delà du texte copié actuellement).

## Tests (priorité haute)

Aucun test aujourd'hui (pas de script de test dans `package.json`, cf. CLAUDE.md).

- [ ] Mettre en place un runner (Vitest s'intègre nativement à Vite/SvelteKit) +
      un script `test` + l'ajouter aux gates CI.
- [ ] `stores/claims.ts` : `addOrUpdateClaim` (insertion vs remplacement par `id`),
      `removeClaim`, `sortedClaims`, `filteredClaims`, `claimStats`. Logique pure, facile à couvrir.
- [ ] `websocket.ts` : routage des messages par `type`, backoff exponentiel
      (`scheduleRetry`), `disconnect` manuel qui n'enchaîne pas de reconnexion.

## Robustesse du contrat WS

- [x] `ws.onmessage` fait `JSON.parse` puis dispatche sur `data.type` sans valider
      la forme du payload (cf. règle svelte.md « parse and validate before trusting »).
      Valider que `claim` a bien la forme `Claim` avant d'appeler le callback.

## Config & DRY

- [x] `WS_URL = "ws://localhost:8000/ws"` est codé en dur (websocket.ts), tout comme
      l'URL backend côté admin (`authFetch`). Extraire dans une config unique
      (variable d'env Vite `PUBLIC_BACKEND_URL`) — nécessaire pour autre chose que localhost.
- [x] `CHUNK_INTERVAL_MS = 5000` (audio.ts) doit rester cohérent avec l'hypothèse
      ~5 s côté back — le commenter comme valeur partagée du contrat.

## UX / capture audio

- [x] `startRecording` re-`throw` l'erreur micro mais rien ne l'affiche à l'utilisateur :
      surfacer un message clair en cas de permission refusée / pas de micro.
- [x] Afficher l'état WS (`wsStatus`: connecting/error/disconnected) de façon visible —
      l'utilisateur ne sait pas aujourd'hui que le back est injoignable.

## UI

- [x] Light mode — thème clair via tokens (`app.css`), bascule auto/clair/sombre
      (`stores/theme.ts` + `ThemeToggle.svelte`), dark par défaut. Bandeau Ticker
      laissé volontairement sombre/rouge (identité « breaking news »).
