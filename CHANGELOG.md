# Changelog

Toutes les évolutions notables de Mathemator. Le format s'inspire de
[Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## 2026-07-21

### Ajouté
- **Illustration pour chaque mathématicien.** Le résolveur de portrait interroge désormais
  Wikipédia pour **toutes** les fiches (titre d'article tiré du lien `fr.wikipedia` déjà
  présent), et plus seulement l'ensemble « Portrait » de `media.json`. Les biographies
  réelles en profitent d'autant. À défaut de portrait libre, la fiche est illustrée par le
  **drapeau de la nationalité** (émoji Unicode, libre et hors‑ligne ; table `NAT_ISO`
  nationalité FR → ISO 3166, les nationalités historiques pointant vers le pays moderne le
  plus proche). Repli ultime : glyphe + 🌍.
- **Vignettes de la liste Explorer/Mathématiciens** : chaque ligne affiche désormais le
  portrait réel s'il est déjà en cache (fiche consultée), sinon le drapeau de la
  nationalité — immédiat et hors‑ligne, sans requête réseau au chargement de la liste.

## 2026-07-14

### Ajouté
- **Présentations Wikipédia** pour les fiches de **théorèmes, problèmes, objets et
  formules** : résolveur générique `resolveWikiConcept(type, name)` (recherche
  `opensearch` + résumé REST, CORS `origin=*`), rubrique « Présentation » avec
  attribution et lien source. Garde‑fous : mots‑clés par type + rejet de la fiche de la
  personne homonyme (`looksLikePerson`, basé sur la description Wikidata). Repli sur une
  note honnête si aucun article pertinent n'est trouvé.
- **Biographies réelles** des mathématiciens curatés depuis Wikipédia (le même appel que
  les portraits récupère aussi le résumé), avec « Source : Wikipédia » et repli hors ligne.
- **Routage par hash** : liens profonds partageables (`#/explorer/math/gauss`,
  `#/labo/calc/matrix`…), bouton Retour/Suivant du navigateur, état restauré au chargement.
- **Recherche globale** « Tout » (multi‑types, résultats groupés, « voir les N → »),
  débouncée (130 ms).
- **Favoris** généralisés en clés typées `type:id` + vue **« ★ Collection »** dans Explorer.
- Catégories Explorer **Formules** et **Objets**.
- **Fiches détail** pour théorèmes, problèmes, objets, formules et exercices (indice,
  correction, solution, « marquer réalisé »).
- **Outils interactifs du Labo** : grapheur (parseur d'expression sûr), géométrie dynamique,
  polyèdres 3D, ensemble de Mandelbrot.
- **Calculatrices du Labo** fonctionnelles : scientifique, matriciel 2×2, suites, statistiques
  & loi binomiale, convertisseurs.
- **Portraits réels** (Wikimedia Commons) sur les fiches de mathématiciens, avec cache
  runtime dans le service worker (v15) pour l'hors ligne.
- **Accessibilité** : activation clavier (Entrée/Espace) des cartes `role="button"`,
  `aria-live` sur les compteurs, `:focus-visible`.

### Modifié
- **Masquage du contenu creux** : les sections auto‑générées répétitives (mêmes gabarits de
  phrase sur des dizaines de fiches) ne sont plus affichées ; détection par « squelettes »
  neutralisant le vocabulaire de domaine.
- Champ « Associé à » des mathématiciens relié aux **vrais théorèmes** de `theorems.json`
  (au lieu de libellés génériques).

### Corrigé
- Débordement de la grille de coefficients du résolveur du second degré (`.coef-grid`).
- Rendu pleine résolution de la fractale (`putImageData` en pixels réels, pas en pixels CSS).

## 2026-07-13

### Ajouté
- **Refonte 2026** : navigation en **5 chapitres** (Accueil, Explorer, Pratiquer, Labo,
  Histoire) dans une barre inférieure fixe ; identité visuelle « encyclopédie imprimée »
  (Newsreader + Public Sans, papier chaud, accent brique, filets fins).
- Base de contenu étendue à **500 mathématiciens** avec visuels générés.
- PWA : service worker (cache hors ligne), manifeste installable, rendu LaTeX via KaTeX.
