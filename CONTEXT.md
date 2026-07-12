# Contexte Mathemator

Dernier point d'arret : priorite 2 etendue a 500 fiches.

Ce fichier sert de suivi de projet pour reprendre les priorites sans perdre le contexte. Les priorites 2 a 24 ont ete implementees dans le code et les donnees.

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
- `data/mathematicians.json` : 500 mathematiciens, sans doublon, avec tous les champs de fiche renseignes et liens externes.
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

### 14. Citations

Statut : implemente.

Livrables :

- `data/quotes.json` contient 115 citations.
- Onglet Citations de la bibliotheque avec recherche plein texte.
- Filtres par auteur, theme et epoque.
- Statistiques de selection : citations, auteurs, themes, epoques.
- Cartes dediees avec citation, auteur, theme et periode.

### 15. Livres

Statut : implemente.

Livrables :

- `data/books.json` contient 120 livres.
- Onglet Livres de la bibliotheque avec recherche plein texte.
- Filtres par auteur, categorie et niveau.
- Statistiques de selection : livres, auteurs, categories, niveaux.
- Cartes dediees avec titre, auteur, categorie, niveau et description.

### 16. Reseau de connaissances

Statut : implemente.

Livrables :

- Graphe SVG construit depuis les donnees reelles : domaines, concepts, mathematiciens, theorematiques, formules et objets.
- Liens generes entre domaines et contenus associes.
- Filtres par type de noeud.
- Statistiques de selection : noeuds, liens, domaines et types.
- Fiche de detail du noeud selectionne avec navigation vers les voisins.

### 17. Moteur de recherche avance

Statut : implemente.

Livrables :

- Index de recherche enrichi avec domaines, siecles/epoques, nationalites, theorematiques, mots-cles, difficultes et niveaux scolaires.
- Nouveaux filtres explicites : domaine, niveau scolaire, theorem et mot-cle.
- Classement ameliore avec ponderation titre, domaine, theorem, mot-cle, metadonnees et texte complet.
- Statistiques de recherche : resultats, types, domaines et score maximal.
- Score de pertinence visible sur chaque resultat.

### 18. Favoris

Statut : implemente.

Livrables :

- Favoris locaux pour mathematiciens, domaines, theorematiques, formules, objets, exercices, quiz, problemes, livres et glossaire via l'index unifie.
- Boutons favoris ajoutes aux exercices, quiz et problemes.
- Vue Favoris avec filtre par type.
- Statistiques de favoris : total, affiches et types.
- Action de vidage complet de la collection.

### 19. Progression

Statut : implemente.

Livrables :

- Progression locale enrichie : temps, exercices, quiz, favoris, jours actifs et meilleure serie.
- Suivi par domaine alimente par exercices realises, quiz reussis et favoris.
- Estimation de maitrise prenant en compte activite, favoris, badges et domaines.
- Badges/succes calcules : premier pas, serie, explorateur, regularite, polyvalence et maitrise.
- Statistiques detaillees et barres de progression par domaine.

### 20. Glossaire

Statut : implemente.

Livrables :

- `data/glossary.json` contient 2000 definitions.
- `scripts/build-content.mjs` regenere le glossaire a cette echelle.
- Onglet Glossaire avec recherche dediee.
- Filtres par initiale et renvoi.
- Statistiques de selection : definitions, resultats, entrees affichees et renvois.
- Renvois cliquables entre concepts via filtrage du glossaire.
- Cartes dediees avec bouton d'ouverture et favori.

### 21. Mode enseignant

Statut : implemente.

Livrables :

- Atelier enseignant dans le panneau Modes.
- Selection de domaine, niveau et duree.
- Generation automatique d'un parcours avec objectifs, theorematiques, formules, exercices et quiz.
- Fiche imprimable utilisable pour export PDF via impression navigateur.
- Copie texte de la fiche.
- Presentation plein ecran de la fiche de cours.

### 22. Mode etudiant

Statut : implemente.

Livrables :

- Atelier etudiant dans le panneau Modes.
- Selection de domaine et objectif personnalise.
- Fiche de synthese par domaine avec concepts, theorematiques et methodes.
- Flashcards interactives issues des domaines, theorematiques, formules et glossaire.
- Historique local des objectifs et cartes revisees.
- Statistiques de revision connectees a la progression locale.

### 23. Collection d'illustrations

Statut : implemente.

Livrables :

- `data/media.json` ajoute une mediatheque unifiee avec 500 entrees visibles et decrites.
- Quotas implementes : 50 portraits Wikimedia Commons, 50 manuscrits Gallica/Internet Archive, 50 livres historiques Internet Archive/Google Books, 50 gravures Europeana/Wikimedia, 50 figures interactives GeoGebra/Desmos, 10 animations SVG/D3/Canvas, 10 fractales procedurales, 10 polyedres 3D Polyhedra Collection/Three.js, 10 reseaux Observable/D3 et 10 cartes David Rumsey/Library of Congress.
- Familles explicites ajoutees : 20 pages originales, 20 schemas geometriques, 20 graphiques animes, 20 cartes historiques, 20 chronologies illustrees, 20 cartes geographiques, 20 arbres de connaissances, 20 infographies, 20 animations de demonstration et 20 simulations interactives.
- Chaque entree possede une description precise, une source, une licence, un format, des liens conceptuels et une URL source.
- Section `Mediatheque visuelle` visible des l'accueil.
- Cartes d'accueil dynamiques par famille de medias, avec compteur d'occurrences, exemples et navigation precedent/suivant/melange.
- Ordre d'affichage des familles aligne sur la specification de la priorite 23.
- Les entrees sont cliquables depuis l'accueil, l'onglet `Mediatheque`, la recherche et les favoris.
- Chaque entree ouvre un detail avec image ou visualisation, description, pistes d'exploration, attribution, licence, source et liens conceptuels.
- Onglet `Mediatheque` dans la bibliotheque filtrable avec acces direct depuis l'accueil.
- Recherche et filtres par type, domaine et source.
- Cartes visuelles coherentes avec vignettes generatives locales et metadonnees de source/licence.
- Integration dans la recherche globale, les favoris et le panneau de detail.
- Cache PWA mis a jour pour inclure les donnees media hors ligne.

### 24. Technologies modernes

Statut : implemente.

Livrables :

- KaTeX conserve pour le rendu des formules et ajoute d'un editeur LaTeX avec previsualisation.
- Plotly.js integre pour le grapheur interactif du laboratoire.
- Module de geometrie dynamique inspire GeoGebra avec points deplacables et mesures.
- Three.js integre pour une scene de polyedres 3D manipulables/rotatifs.
- D3.js integre pour un reseau de connaissances force-directed.
- MiniSearch integre comme moteur plein texte avec fallback local.
- Menu laboratoire mis a jour avec section Technologies modernes.

## Validations deja effectuees

- `node --check src/app.js` apres les principales modifications.
- Validations JSON ponctuelles pour exercices, quiz, problemes, citations et livres.
- Rendus Chromium headless sur les ecrans `#lab`, `#learn` et `#cards`.
- Verification DOM pour la section des problemes celebres.

## Reste a faire

- Stabiliser les performances et enrichir les donnees selon les retours d'usage.
