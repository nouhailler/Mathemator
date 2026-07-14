# Mathemator

**Encyclopédie interactive des mathématiques** — une application web statique, hors‑ligne
(PWA), à l'identité « encyclopédie imprimée » : papier chaud, sérif, filets fins.

500 mathématiciens, 260 théorèmes, 182 formules, 108 problèmes célèbres, 160 exercices,
120 quiz, 2000 définitions, une chronologie et une carte du monde — reliés en **cinq
chapitres** accessibles depuis une barre inférieure fixe.

> Vanilla HTML / CSS / JavaScript. Aucun framework, aucun bundler.

## Chapitres

| | Chapitre | Contenu |
|---|---|---|
| ∑ | **Accueil** | Manifeste, « Aujourd'hui » (théorème du jour + citation), les quatre univers |
| I | **Explorer** | Mathématiciens · Domaines · Théorèmes · Formules · Objets · Problèmes · Bibliothèque · ★ Collection ; recherche globale « Tout » |
| II | **Pratiquer** | Exercices (fiches, « marquer réalisé »), Quiz, Progression (stats, badges), Ateliers |
| III | **Labo** | Outils interactifs (grapheur, géométrie dynamique, polyèdres 3D, fractale) + calculatrices (scientifique, matriciel 2×2, suites, stats/probas, convertisseurs) |
| IV | **Histoire** | Chronologie verticale · Carte du monde |

## Fonctionnalités notables

- **Fiches détail** pour mathématiciens, théorèmes, problèmes, objets, formules et exercices.
- **Portraits & biographies réels** : les fiches de mathématiciens curatés chargent leur
  portrait et leur biographie depuis Wikipédia (attribution CC BY‑SA), avec repli hors ligne.
- **Présentations Wikipédia** pour théorèmes, problèmes, objets et formules, avec garde‑fous
  (rejet de la fiche de la personne homonyme, repli honnête si aucun article ne correspond).
- **Masquage du contenu creux** : les sections auto‑générées répétitives ne sont pas affichées.
- **Favoris** typés + vue « ★ Collection » ; **recherche globale** débouncée ; **progression**
  locale (favoris, exercices réalisés, quiz réussis, badges).
- **Routage par hash** : liens profonds partageables (`#/explorer/math/gauss`), bouton
  Retour/Suivant du navigateur, état restauré au rafraîchissement.
- **PWA** : service worker (cache hors ligne des données et des portraits), manifeste installable.
- **Rendu LaTeX** via KaTeX. Accessibilité : activation clavier des cartes, `aria-live`, `:focus-visible`.

## Structure

```
index.html              SPA, point d'entrée unique
src/app.js              Toute la logique de l'application
src/content.js          Chargement des données (fetch des data/*.json)
src/styles.css          Styles globaux (design tokens « encyclopédie »)
data/*.json             Contenu : mathematicians, theorems, formulas, objects,
                        problems, exercises, quiz, glossary, timeline, places,
                        books, quotes, media, daily, domains…
assets/                 Icônes PWA
service-worker.js       Cache hors ligne (v15 + cache runtime upload.wikimedia.org)
manifest.webmanifest    Manifeste PWA
netlify.toml            Déploiement Netlify
scripts/                Génération/enrichissement de contenu (Node)
CONTEXT.md              Suivi de projet (historique des priorités et décisions)
CHANGELOG.md            Journal des versions
```

## Développement

Aucune dépendance à installer. Comme l'app charge `data/*.json` par `fetch`, il faut la
servir via HTTP (pas `file://`) :

```bash
# depuis la racine du dépôt
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Vérification syntaxe : `node --check src/app.js`.

## Déploiement

Site statique déployé sur **Netlify** (`netlify.toml`). Toute plateforme de fichiers
statiques convient ; le service worker gère la mise en cache hors ligne.

## Données & enrichissement

Le contenu vit dans `data/*.json` (généré par `scripts/`). Certaines fiches sont enrichies
**à l'exécution** depuis Wikipédia (API REST `summary` + recherche `opensearch`, CORS
`origin=*`), mises en cache dans `localStorage` (`mathemator:wiki`) et via le service worker.
L'enrichissement du contenu par IA au build reste possible dans `scripts/` (nécessite une
clé API Anthropic).

## Licence & attributions

Les portraits et résumés proviennent de **Wikipédia / Wikimedia Commons** (licences ouvertes,
CC BY‑SA), affichés avec attribution et lien vers la source. Rendu mathématique par
[KaTeX](https://katex.org/).
