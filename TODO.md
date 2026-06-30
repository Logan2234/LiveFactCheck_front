# TODO — Frontend

Liste des features, métier comme tech, à implémenter. La source de vérité reste le code, pas ce fichier.

## Features métier

- [ ] **Recherche / filtre texte** dans les claims (en plus du filtre par statut existant),
      utile dès qu'une session devient longue.
- [ ] **Filtre par catégorie & par score de confiance** (les données existent déjà sur
      chaque `Claim` : `category`, `confidence` — actuellement non exploitées comme filtres).
- [ ] **Mode overlay / streaming** : un layout transparent plein écran (claims qui
      apparaissent/disparaissent en fade) destiné à être capturé dans OBS pour un live.
- [ ] **Partage d'un claim** : générer une image/carte partageable d'un démenti
      (au-delà du texte copié actuellement).
- [ ] **Raccourcis clavier** Demander a claude les différents raccourcis clavier pertinents a ajouter.

## Tests (priorité haute)

Aucun test aujourd'hui (pas de script de test dans `package.json`, cf. CLAUDE.md).

- [ ] Mettre en place un runner (Vitest s'intègre nativement à Vite/SvelteKit) +
      un script `test` + l'ajouter aux gates CI.
- [ ] `stores/claims.ts` : `addOrUpdateClaim` (insertion vs remplacement par `id`),
      `removeClaim`, `sortedClaims`, `filteredClaims`, `claimStats`. Logique pure, facile à couvrir.
- [ ] `websocket.ts` : routage des messages par `type`, backoff exponentiel
      (`scheduleRetry`), `disconnect` manuel qui n'enchaîne pas de reconnexion.

## UI

- [ ] Améliorer le light mode qui est hideux aujourd'hui sur toutes les pages.
