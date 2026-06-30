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

- [ ] `stores/claims.ts` : `addOrUpdateClaim` (insertion vs remplacement par `id`),
      `removeClaim`, `sortedClaims`, `filteredClaims`, `claimStats`. Logique pure, facile à couvrir.
- [ ] `websocket.ts` : routage des messages par `type`, backoff exponentiel
      (`scheduleRetry`), `disconnect` manuel qui n'enchaîne pas de reconnexion.

## UI

- [ ] Améliorer le light mode qui est hideux aujourd'hui sur toutes les pages.

## Tooling / CI

- [ ] **Mergify** (`.mergify.yml`) : merge queue + règles d'auto-merge des PR vertes.

### Options à étudier (outils activables par un fichier)

- [ ] **Renovate** (`renovate.json`) : alternative à Dependabot — grouping plus fin, auto-merge des patchs verts, dashboard. Nécessite la GitHub App.
- [ ] **Snyk** (`.snyk`) : analyse de sécurité des dépendances. Nécessite la GitHub App.
- [ ] **Lighthouse CI** (`lighthouserc.json`) : budgets perf / a11y / SEO sur chaque PR. Config + workflow CI.
- [ ] **commitlint** (`commitlint.config.js`) : impose les Conventional Commits (utile avec release-please). Config + hook/CI.
- [ ] **husky + lint-staged** (ou `pre-commit` / `lefthook`) : lance Prettier/ESLint avant le commit, en amont de la CI.
- [ ] **CodeQL** : analyse de sécurité statique GitHub (activable en _default setup_ sans fichier, ou via workflow).
