# Contexte Mathemator

Dernier point d'arret : priorite 13 implementee.

Ce fichier sert de suivi de projet pour reprendre les priorites sans perdre le contexte. Les priorites 2 a 13 ont ete implementees dans le code et les donnees. Les priorites 14 a 24 restent a faire.

## Etat global

- Application statique HTML/CSS/JS.
- Donnees principales dans `data/*.json`.
- Logique UI principale dans `src/app.js`.
- Styles dans `src/styles.css`.
- Generation de contenu massif via `scripts/build-content.mjs`.
- Git utilise le dossier `.gitdata` : commandes sous la forme `git --git-dir=.gitdata --work-tree=. ...`.

## Priorites implementees

### 2. Base de contenu massive

Statut : implemente.

Livrables :

- `scripts/build-content.mjs` cree/enrichit les bases JSON.
- `data/mathematicians.json` : plusieurs centaines de mathematiciens.
- `data/theorems.json` : plusieurs centaines de theorematiques.
- `data/formulas.json` : catalogue de formules par categories.
- `data/glossary.json` : glossaire large.
- `data/books.json`, `data/quotes.json`, `data/problems.json` : bibliotheque, citations et problemes enrichis.

### 3. Chronologie interactive

Statut : implemente.

Livrables :

- `data/timeline.json` enrichi par periodes historiques.
- Interface de chronologie dans `src/app.js`.
- Recherche, filtres de periode, statistiques et cartes detaillees.
- Chaque periode affiche mathematiciens, decouvertes, publications et evenements scientifiques.

### 4. Carte du monde

Statut : implemente.

Livrables :

- `data/places.json` enrichi avec lieux, pays, villes, institutions, naissances/deces et periodes.
- Carte SVG interactive.
- Filtres par type et pays.
- Detail du lieu selectionne et liste navigable.

### 5. Encyclopedie des domaines

Statut : implemente.

Livrables :

- `data/domains.json` couvre les grandes disciplines demandees.
- Recherche de domaines.
- Filtre par famille.
- Statistiques de domaines.
- Fiches detaillees : presentation, historique, concepts, theoremes, applications, mathematiciens associes, methodes et relations.

### 6. Theoremes

Statut : implemente.

Livrables :

- Reference documentaire avec onglets theorematiques/formules.
- Recherche de theorematiques.
- Filtres par domaine et decouvreur.
- Fiches structurees : enonce, intuition, demonstration, variantes, generalisation, applications, historique, decouvreur, exercices, references.

### 7. Formules

Statut : implemente.

Livrables :

- `data/formulas.json` enrichi avec categories : algebre, geometrie, trigonometrie, analyse, statistiques, probabilites, physique, informatique.
- Recherche et filtres par categorie/usage.
- Rendu LaTeX avec KaTeX quand disponible.
- Fiches avec explication, exemples, demonstration et cas d'utilisation.

### 8. Objets mathematiques

Statut : implemente.

Livrables :

- `data/objects.json` enrichi avec les objets demandes : ruban de Mobius, bouteille de Klein, Mandelbrot, Julia, Sierpinski, Menger, Koch, polyedres, pavages, surfaces minimales, solides de Platon, solides d'Archimede.
- Recherche et filtres par categorie/dimension.
- Galerie visuelle avec fiches : description, histoire, proprietes, applications, visualisation interactive, formule/modele, objets lies.

### 9. Visualisations interactives

Statut : implemente.

Livrables :

- Section laboratoire/visualisations avec canvases interactifs.
- Mandelbrot regenerable.
- Surface parametrique manipulable.
- Courbes parametriques, polaires et implicites.
- Champs de vecteurs et transformations matricielles.
- Reseaux et polyedre 3D anime.
- Grapheur 2D conserve.

### 10. Laboratoire

Statut : implemente.

Livrables :

- Grapheur rapide.
- Calculatrice scientifique.
- Calcul matriciel : produit, determinant 2x2, inverse 2x2.
- Calcul symbolique/numerique : evaluation, derivee numerique, integrale numerique, derivee symbolique simple.
- Resolution d'equations quadratiques.
- Suites.
- Statistiques.
- Probabilites binomiales.
- Convertisseurs angle/longueur/masse.

### 11. Exercices

Statut : implemente.

Livrables :

- `data/exercises.json` contient 160 exercices.
- Classement par niveau scolaire, domaine, difficulte et temps estime.
- Recherche et filtres.
- Statistiques de selection.
- Liste navigable.
- Fiche detaillee avec indice, correction, solution detaillee, demonstration et references.
- Bouton de progression "Marquer realise".

### 12. Quiz

Statut : implemente.

Livrables :

- `data/quiz.json` contient 120 questions.
- Modes : Libre, Chronometre, Championnat, Defis quotidiens, Multijoueur a envisager.
- Selecteur de mode.
- Score, serie, points et explications.
- Compte a rebours pour le mode chronometre.
- Defi quotidien stable sur la date.
- Apercu structurel du mode multijoueur.

### 13. Problemes celebres

Statut : implemente.

Livrables :

- `data/problems.json` contient 108 problemes.
- Inclus :
  - les 7 problemes du prix du millenaire ;
  - conjecture de Goldbach ;
  - conjecture des nombres premiers jumeaux ;
  - P versus NP ;
  - hypothese de Riemann ;
  - problemes historiques resolus : Fermat, quatre couleurs, Kepler, Poincare.
- Recherche et filtres par categorie, statut et domaine.
- Statistiques.
- Fiches detaillees : historique, etat actuel, explication accessible, avancees recentes, impact et references.

## Validations deja effectuees

- `node --check src/app.js` apres les principales modifications.
- Validations JSON ponctuelles pour exercices, quiz et problemes.
- Rendus Chromium headless sur les ecrans `#lab`, `#learn` et `#cards`.
- Verification DOM pour la section des problemes celebres.

## Reste a faire

### 14. Citations

Objectif :

- Grande collection de citations filtrables par auteur, theme et epoque.

Etat actuel :

- `data/quotes.json` existe deja et a ete enrichi par la priorite 2.
- L'interface bibliotheque affiche les citations, mais il faut ajouter une vraie recherche/filtres dedies.

### 15. Livres

Objectif :

- Catalogue de livres : manuels, ouvrages historiques, vulgarisation, references universitaires, biographies.

Etat actuel :

- `data/books.json` existe deja et a ete enrichi par la priorite 2.
- L'interface bibliotheque affiche les livres, mais il faut ajouter filtres et fiches plus riches.

### 16. Reseau de connaissances

Objectif :

- Representation graphique reliant mathematiciens, theorematiques, concepts, domaines, formules et objets.

Etat actuel :

- Un reseau SVG simple existe deja.
- Il reste a le brancher aux donnees reelles et a permettre une navigation visuelle concept-par-concept.

### 17. Moteur de recherche avance

Objectif :

- Recherche multicriteres : nom, domaine, siecle, nationalite, theorem, mot-cle, difficulte, niveau scolaire.

Etat actuel :

- Une recherche avancee existe deja avec type, periode, nationalite, difficulte et chips.
- Il reste a l'etendre avec plus de criteres explicites et meilleur classement des resultats.

### 18. Favoris

Objectif :

- Enregistrer mathematiciens, theorematiques, exercices, formules et objets favoris.

Etat actuel :

- Favoris locaux deja presents pour plusieurs types.
- Il reste a ajouter favoris sur les exercices/quiz/problemes si necessaire et a ameliorer la vue de gestion.

### 19. Progression

Objectif :

- Suivi personnel : temps passe, exercices realises, quiz reussis, domaines maitrises, statistiques, badges, succes.

Etat actuel :

- Progression locale simple deja presente : minutes, exercices, quiz, favoris, maitrise estimee.
- Il reste a ajouter badges, succes, domaines maitrises et statistiques detaillees.

### 20. Glossaire

Objectif :

- Dictionnaire contenant plusieurs milliers de definitions avec renvois automatiques entre concepts.

Etat actuel :

- `data/glossary.json` contient deja une base large.
- L'interface bibliotheque affiche le glossaire.
- Il reste a ajouter recherche/filtres dedies, renvois cliquables et eventuellement expansion vers plusieurs milliers d'entrees.

### 21. Mode enseignant

Objectif :

- Creation de parcours, selection de ressources, creation de quiz, export PDF, impression, presentation plein ecran.

Etat actuel :

- Un panneau "Mode enseignant" existe dans les modes.
- Il reste a implementer de vrais workflows et exports.

### 22. Mode etudiant

Objectif :

- Revisions, fiches de synthese, flashcards, historique, objectifs personnalises.

Etat actuel :

- Un panneau "Mode etudiant" existe dans les modes.
- Il reste a implementer flashcards, objectifs et historique.

### 23. Collection d'illustrations

Objectif :

- Iconographie riche : portraits, manuscrits, pages historiques, schemas, fractales HD, graphes, cartes, infographies, animations.

Etat actuel :

- Quelques visuels generatifs/canvas/SVG existent.
- Il reste a creer ou integrer une vraie collection d'assets coherents.

### 24. Technologies modernes

Objectif :

- KaTeX ou MathJax, Plotly.js, GeoGebra ou equivalent, Three.js, Cytoscape.js/D3.js, editeur LaTeX, moteur plein texte.

Etat actuel :

- KaTeX est deja integre.
- Les visualisations sont actuellement en canvas natif/SVG.
- Il reste a evaluer et integrer les bibliotheques modernes utiles sans alourdir inutilement l'application.

## Prochaine etape recommandee

Reprendre a la priorite 14 : citations filtrables.
