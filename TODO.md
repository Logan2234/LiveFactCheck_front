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
- [ ] **Export de la session** côté front (bouton « Exporter ») : Markdown / JSON /
      copie globale — généralise le copier-coller par carte de `ClaimCard.svelte`.
- [ ] **Mode replay / historique** : consommer l'historique back (cf. TODO back) pour
      relire une session passée sans micro.
- [ ] **Mode overlay / streaming** : un layout transparent plein écran (claims qui
      apparaissent/disparaissent en fade) destiné à être capturé dans OBS pour un live.
- [ ] **Alerte visuelle/sonore sur claim "false"** : mettre en avant un démenti
      (animation, son optionnel) — pertinent en contexte débat/direct.
- [ ] **Sélecteur de niveau de vérification** dans `AudioControls` (rapide vs approfondi),
      en miroir de l'option back correspondante.
- [ ] **Réglage de la langue** de transcription/vérification depuis l'UI (miroir du
      multilingue back).
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

- [ ] `ws.onmessage` fait `JSON.parse` puis dispatche sur `data.type` sans valider
      la forme du payload (cf. règle svelte.md « parse and validate before trusting »).
      Valider que `claim` a bien la forme `Claim` avant d'appeler le callback.
- [ ] Centraliser le type des messages : `WSMessage` (websocket.ts) et `Claim`
      (stores/claims.ts) doivent rester le miroir exact des schémas Pydantic back.
      Documenter/figer ce couplage (toute évolution = changement deux-repos).

## Config & DRY

- [ ] `WS_URL = "ws://localhost:8000/ws"` est codé en dur (websocket.ts), tout comme
      l'URL backend côté admin (`authFetch`). Extraire dans une config unique
      (variable d'env Vite `PUBLIC_BACKEND_URL`) — nécessaire pour autre chose que localhost.
- [ ] `CHUNK_INTERVAL_MS = 5000` (audio.ts) doit rester cohérent avec l'hypothèse
      ~5 s côté back — le commenter comme valeur partagée du contrat.

## UX / capture audio

- [ ] `startRecording` re-`throw` l'erreur micro mais rien ne l'affiche à l'utilisateur :
      surfacer un message clair en cas de permission refusée / pas de micro.
- [ ] Afficher l'état WS (`wsStatus`: connecting/error/disconnected) de façon visible —
      l'utilisateur ne sait pas aujourd'hui que le back est injoignable.
- [ ] Les claims ne sont pas persistés : un refresh vide tout. Décider si on garde
      (sessionStorage / export) ou si c'est volontairement éphémère.

## Accessibilité & finition

- [ ] Vérifier la navigation clavier / focus des 9 layouts et de `Modal.svelte`.
- [ ] `svelte-check` et `format:check` doivent rester verts (gates CI) après chaque ajout.
