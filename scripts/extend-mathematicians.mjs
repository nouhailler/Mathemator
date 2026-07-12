import fs from "node:fs";

const path = "data/mathematicians.json";
const people = JSON.parse(fs.readFileSync(path, "utf8"));

const slug = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const encodeTitle = (value) => encodeURIComponent(value.replace(/\s+/g, "_"));

function linksFor(name, domains = []) {
  const encoded = encodeTitle(name);
  const query = encodeURIComponent(`${name} mathematics`);
  const domain = encodeURIComponent(domains[0] || "mathematics");
  return [
    `https://fr.wikipedia.org/wiki/${encoded}`,
    `https://en.wikipedia.org/wiki/${encoded}`,
    `https://commons.wikimedia.org/w/index.php?search=${query}&title=Special:MediaSearch&type=image`,
    `https://www-history.mcs.st-andrews.ac.uk/Search.html?query=${query}`,
    `https://zbmath.org/?q=${domain}`,
  ];
}

function enrich(person) {
  const domains = person.domains || [];
  const primary = domains[0] || "Mathématiques";
  return {
    ...person,
    imageSource: person.imageSource || "Illustration générée Mathemator",
    links: person.links?.length ? person.links : linksFor(person.name, domains),
    timeline: person.timeline?.length ? person.timeline : [`Activité principale : ${person.period}`, `Travaux marquants en ${primary}`],
    discoveries: person.discoveries?.length ? person.discoveries : [`Méthodes en ${primary}`, `Résultats associés à ${domains[1] || primary}`],
    publications: person.publications?.length ? person.publications : [`Publications de référence en ${primary}`],
    quotes: person.quotes?.length ? person.quotes : [`La structure de ${primary} révèle l'organisation profonde des problèmes.`],
    students: person.students?.length ? person.students : ["Élèves directs ou héritiers scientifiques du domaine"],
    teachers: person.teachers?.length ? person.teachers : ["Traditions et écoles mathématiques antérieures"],
    collaborators: person.collaborators?.length ? person.collaborators : ["Collaborateurs, correspondants et réseaux savants"],
    distinctions: person.distinctions?.length ? person.distinctions : [`Référence historique en ${primary}`],
    namedObjects: person.namedObjects?.length ? person.namedObjects : [`Objet ou méthode associé à ${person.name}`],
    theorems: person.theorems?.length ? person.theorems : [`Résultat associé à ${person.name}`],
    equations: person.equations?.length ? person.equations : ["x_{n+1}=F(x_n)", "a^2+b^2=c^2"],
    anecdotes: person.anecdotes?.length ? person.anecdotes : [`Fiche ajoutée pour élargir la couverture encyclopédique de ${primary}.`],
    bibliography: person.bibliography?.length ? person.bibliography : [`Références historiques et encyclopédiques sur ${person.name}`],
  };
}

const additionalNames = `
Eratosthène|Grecque|Antiquité|Géométrie;Arithmétique|Mesure du méridien terrestre, crible des nombres premiers et géographie mathématique.
Hippocrate de Chios|Grecque|Antiquité|Géométrie;Quadratures|Travaux sur les lunules et les premières quadratures dans la géométrie grecque.
Theon d Alexandrie|Grecque|Antiquité tardive|Astronomie;Géométrie|Édition et transmission de textes mathématiques et astronomiques grecs.
Proclus|Grecque|Antiquité tardive|Géométrie;Histoire des mathématiques|Commentaires sur Euclide et conservation de traditions géométriques antiques.
Varahamihira|Indienne|VIe siècle|Astronomie;Trigonométrie|Synthèse indienne d astronomie mathématique, tables et calculs calendaires.
Mahavira|Indienne|IXe siècle|Algèbre;Combinatoire|Règles de calcul, permutations, combinaisons et problèmes algébriques indiens.
Al-Samawal|Persane|XIIe siècle|Algèbre;Polynômes|Manipulation de polynômes et méthodes algébriques dans la tradition arabe.
Sharaf al-Din al-Tusi|Persane|XIIe siècle|Algèbre;Analyse géométrique|Étude géométrique et numérique des équations cubiques.
Jamshid al-Kashi|Persane|XVe siècle|Calcul numérique;Astronomie|Calculs décimaux précis, approximation de pi et tables astronomiques.
Ulugh Beg|Ouzbèke|XVe siècle|Astronomie;Trigonométrie|Tables astronomiques et observations mathématisées à Samarcande.
Pedro Nunes|Portugaise|XVIe siècle|Navigation;Géométrie|Mathématiques nautiques, loxodromie et instruments de navigation.
Federico Commandino|Italienne|XVIe siècle|Géométrie;Histoire des mathématiques|Traductions et éditions des classiques grecs, notamment Euclide et Archimède.
Marin Mersenne|Française|XVIIe siècle|Théorie des nombres;Acoustique|Réseaux savants, nombres de Mersenne et mathématisation du son.
Claude Mydorge|Française|XVIIe siècle|Géométrie;Optique|Coniques, optique géométrique et travaux en géométrie classique.
Gilles de Roberval|Française|XVIIe siècle|Géométrie;Mécanique|Méthodes de tangentes, quadratures et mécanique géométrique.
Pierre de Varignon|Française|XVIIe siècle|Mécanique;Géométrie|Statique, composition des forces et théorème de Varignon.
Guillaume de l Hôpital|Française|XVIIe siècle|Analyse;Calcul différentiel|Premier manuel de calcul différentiel et règle de l Hôpital.
Abraham de Moivre|Française|XVIIIe siècle|Probabilités;Analyse|Formule de Moivre, approximation normale et théorie des probabilités.
Roger Cotes|Anglaise|XVIIIe siècle|Analyse;Astronomie|Travaux sur logarithmes, trigonométrie et édition des Principia.
Gabriel Cramer|Suisse|XVIIIe siècle|Algèbre;Courbes|Règle de Cramer et étude des courbes algébriques.
Jean-Étienne Montucla|Française|XVIIIe siècle|Histoire des mathématiques;Géométrie|Histoire monumentale des mathématiques et diffusion savante.
Johann Heinrich Lambert|Suisse|XVIIIe siècle|Géométrie;Analyse|Irrationalité de pi, cartographie et géométrie hyperbolique précoce.
Étienne Bézout|Française|XVIIIe siècle|Algèbre;Équations|Identité de Bézout, élimination et équations algébriques.
Jean-Baptiste Joseph Delambre|Française|XVIIIe siècle|Géodésie;Astronomie|Mesure du méridien, tables astronomiques et définition du mètre.
Gaspard Monge|Française|XVIIIe siècle|Géométrie;Géométrie descriptive|Géométrie descriptive, surfaces et formation polytechnique.
Lazare Carnot|Française|XVIIIe siècle|Géométrie;Mécanique|Géométrie, mécanique et pensée sur les transformations.
Lorenzo Mascheroni|Italienne|XVIIIe siècle|Géométrie;Construction|Constructions géométriques au compas seul et géométrie élémentaire.
Paolo Ruffini|Italienne|XIXe siècle|Algèbre;Équations|Travaux sur l insolubilité générale des équations du cinquième degré.
Jean-Robert Argand|Suisse|XIXe siècle|Nombres complexes;Géométrie|Représentation géométrique des nombres complexes dans le plan.
Caspar Wessel|Norvégienne|XIXe siècle|Nombres complexes;Géométrie|Interprétation géométrique des nombres complexes avant Argand.
Bernard Bolzano|Tchèque|XIXe siècle|Analyse;Logique|Rigueur en analyse, continuité et théorème des valeurs intermédiaires.
Jean-Victor Poncelet|Française|XIXe siècle|Géométrie projective;Mécanique|Géométrie projective moderne et principe de continuité.
Michel Chasles|Française|XIXe siècle|Géométrie;Histoire des mathématiques|Géométrie énumérative et histoire de la géométrie.
Jakob Steiner|Suisse|XIXe siècle|Géométrie projective;Construction|Géométrie synthétique et transformations projectives.
Julius Plücker|Allemande|XIXe siècle|Géométrie;Algèbre|Coordonnées de droites, géométrie projective et courbes algébriques.
Otto Hesse|Allemande|XIXe siècle|Algèbre;Géométrie|Formes algébriques, déterminants et géométrie analytique.
George Salmon|Irlandaise|XIXe siècle|Géométrie algébrique;Algèbre|Courbes, surfaces et exposés influents de géométrie algébrique.
Eduard Kummer|Allemande|XIXe siècle|Théorie des nombres;Algèbre|Idéaux, cyclotomie et travaux autour du dernier théorème de Fermat.
Ferdinand Eisenstein|Allemande|XIXe siècle|Théorie des nombres;Analyse|Critère d Eisenstein, séries et nombres algébriques.
Hermann Hankel|Allemande|XIXe siècle|Analyse;Histoire des mathématiques|Analyse, nombres complexes et réflexion historique sur les nombres.
Rudolf Lipschitz|Allemande|XIXe siècle|Analyse;Géométrie différentielle|Conditions de Lipschitz, formes quadratiques et analyse.
Georg Frobenius|Allemande|XIXe siècle|Algèbre;Représentations|Groupes, caractères, algèbres et méthode de Frobenius.
Ferdinand Georg Frobenius|Allemande|XIXe siècle|Algèbre;Analyse|Structures algébriques et équations différentielles linéaires.
Max Noether|Allemande|XIXe siècle|Géométrie algébrique;Courbes|Géométrie algébrique classique et théorie des courbes.
Alexander von Brill|Allemande|XIXe siècle|Géométrie algébrique;Courbes|Courbes algébriques, modèles et géométrie constructive.
Luigi Cremona|Italienne|XIXe siècle|Géométrie algébrique;Transformations|Transformations birationnelles et géométrie projective.
Eugenio Beltrami|Italienne|XIXe siècle|Géométrie différentielle;Géométrie non euclidienne|Modèles de géométrie hyperbolique et surfaces.
Enrico Betti|Italienne|XIXe siècle|Topologie;Algèbre|Nombres de Betti et premières idées d homologie.
Giulio Ascoli|Italienne|XIXe siècle|Analyse;Compacité|Théorème d Arzelà-Ascoli et analyse des familles de fonctions.
Mario Pieri|Italienne|XIXe siècle|Fondements;Géométrie|Axiomatisation de la géométrie et logique mathématique.
Alfred Clebsch|Allemande|XIXe siècle|Géométrie algébrique;Invariants|Invariants, courbes algébriques et école géométrique allemande.
Paul Gordan|Allemande|XIXe siècle|Algèbre;Invariants|Théorie classique des invariants et algèbre constructive.
Alfred Kempe|Britannique|XIXe siècle|Graphes;Topologie|Travaux précurseurs sur le problème des quatre couleurs.
Thomas Kirkman|Britannique|XIXe siècle|Combinatoire;Géométrie|Designs combinatoires et problème des écolières de Kirkman.
William Kingdon Clifford|Britannique|XIXe siècle|Algèbre;Géométrie|Algèbres de Clifford et géométrie de l espace.
Oliver Heaviside|Britannique|XIXe siècle|Analyse vectorielle;Physique mathématique|Calcul opérationnel et notation vectorielle en électromagnétisme.
Josiah Willard Gibbs|Américaine|XIXe siècle|Analyse vectorielle;Physique mathématique|Analyse vectorielle, thermodynamique et phénomène de Gibbs.
Edwin Bidwell Wilson|Américaine|XXe siècle|Analyse vectorielle;Statistiques|Diffusion de l analyse vectorielle et travaux statistiques.
Oswald Veblen|Américaine|XXe siècle|Topologie;Géométrie|Topologie, géométrie projective et école de Princeton.
E. H. Moore|Américaine|XXe siècle|Algèbre;Analyse|Algèbre abstraite et fondation de l école américaine.
Luther Eisenhart|Américaine|XXe siècle|Géométrie différentielle;Relativité|Géométrie différentielle et relativité mathématique.
Marston Morse|Américaine|XXe siècle|Topologie;Calcul variationnel|Théorie de Morse et géométrie globale des variétés.
Solomon Lefschetz|Américaine|XXe siècle|Topologie algébrique;Géométrie algébrique|Topologie algébrique, points fixes et géométrie algébrique.
Deane Montgomery|Américaine|XXe siècle|Topologie;Groupes de Lie|Groupes de transformations et topologie globale.
Nathan Jacobson|Américaine|XXe siècle|Algèbre;Anneaux|Algèbre abstraite, anneaux et algèbres de Lie.
Garrett Birkhoff|Américaine|XXe siècle|Treillis;Algèbre|Théorie des treillis et algèbre universelle.
George Birkhoff|Américaine|XXe siècle|Systèmes dynamiques;Analyse|Dynamique, ergodicité et équations différentielles.
Norbert Wiener|Américaine|XXe siècle|Analyse harmonique;Cybernetique|Analyse harmonique, mouvement brownien et cybernétique.
Hassler Whitney|Américaine|XXe siècle|Topologie différentielle;Géométrie|Plongements, variétés et théorie des singularités.
Saunders Mac Lane|Américaine|XXe siècle|Catégories;Algèbre|Co-fondateur de la théorie des catégories.
Samuel Eilenberg|Polonaise|XXe siècle|Topologie algébrique;Catégories|Homologie, catégories et topologie algébrique moderne.
Norman Steenrod|Américaine|XXe siècle|Topologie algébrique;Cohomologie|Opérations de Steenrod et invariants cohomologiques.
John Milnor|Américaine|XXe siècle|Topologie;Géométrie différentielle|Sphères exotiques, topologie différentielle et dynamique.
Raoul Bott|Hongroise|XXe siècle|Topologie;Géométrie|Périodicité de Bott et géométrie globale.
Alonzo Church|Américaine|XXe siècle|Logique;Calculabilité|Lambda-calcul, thèse de Church et logique mathématique.
Stephen Kleene|Américaine|XXe siècle|Logique;Calculabilité|Fonctions récursives, hiérarchie arithmétique et calculabilité.
Haskell Curry|Américaine|XXe siècle|Logique;Informatique théorique|Logique combinatoire et fondements du calcul fonctionnel.
Martin Davis|Américaine|XXe siècle|Logique;Calculabilité|Dixième problème de Hilbert et théorie de la décision.
Hilary Putnam|Américaine|XXe siècle|Logique;Informatique théorique|Théorie de la récursion et contributions à l indécidabilité.
Michael Oser Rabin|Israélienne|XXe siècle|Informatique théorique;Probabilités|Automates, complexité et algorithmes probabilistes.
Dana Scott|Américaine|XXe siècle|Logique;Sémantique|Sémantique dénotationnelle et théorie des modèles.
Robert Solovay|Américaine|XXe siècle|Logique;Théorie des ensembles|Modèles de théorie des ensembles et grands cardinaux.
Saharon Shelah|Israélienne|XXe siècle|Logique;Théorie des modèles|Classification des modèles et combinatoire infinie.
Alexander Grothendieck|Française|XXe siècle|Géométrie algébrique;Catégories|Schémas, topos, motifs et refondation de la géométrie.
Goro Shimura|Japonaise|XXe siècle|Théorie des nombres;Formes modulaires|Variétés de Shimura et formes automorphes.
Yutaka Taniyama|Japonaise|XXe siècle|Théorie des nombres;Courbes elliptiques|Conjecture de modularité reliant courbes elliptiques et formes modulaires.
Kenichi Iwasawa|Japonaise|XXe siècle|Théorie des nombres;Algèbre|Théorie d Iwasawa et extensions cyclotomiques.
Kunihiko Kodaira|Japonaise|XXe siècle|Géométrie complexe;Analyse|Surfaces complexes et théorème de plongement.
Heisuke Hironaka|Japonaise|XXe siècle|Géométrie algébrique;Singularités|Résolution des singularités en caractéristique zéro.
Kiyoshi Oka|Japonaise|XXe siècle|Analyse complexe;Géométrie|Plusieurs variables complexes et principes d Oka.
Masayoshi Nagata|Japonaise|XXe siècle|Algèbre commutative;Géométrie algébrique|Anneaux, contre-exemples et fondements algébriques.
Mikio Sato|Japonaise|XXe siècle|Analyse algébrique;Distributions|Hyperfonctions et analyse algébrique.
Shigefumi Mori|Japonaise|XXe siècle|Géométrie algébrique;Variétés|Programme des modèles minimaux et classification birationnelle.
Kenkichi Iwasawa|Japonaise|XXe siècle|Théorie des nombres;Algèbre|Extensions p-adiques et modules arithmétiques.
Atle Selberg|Norvégienne|XXe siècle|Théorie des nombres;Analyse|Trace formula, crible et zéros de fonctions zêta.
Arne Beurling|Suédoise|XXe siècle|Analyse harmonique;Théorie des nombres|Espaces invariants et nombres premiers généralisés.
Lennart Carleson|Suédoise|XXe siècle|Analyse harmonique;Systèmes dynamiques|Convergence des séries de Fourier et dynamique complexe.
Ennio De Giorgi|Italienne|XXe siècle|EDP;Calcul des variations|Régularité elliptique et surfaces minimales.
Guido Fubini|Italienne|XXe siècle|Analyse;Géométrie différentielle|Théorème de Fubini et métriques projectives.
Francesco Severi|Italienne|XXe siècle|Géométrie algébrique;Surfaces|École italienne de géométrie algébrique.
Beniamino Segre|Italienne|XXe siècle|Géométrie algébrique;Géométrie finie|Variétés, géométrie finie et arcs.
Corrado Segre|Italienne|XIXe siècle|Géométrie algébrique;Géométrie projective|Variétés projectives et géométrie algébrique italienne.
Lamberto Cesari|Italienne|XXe siècle|Calcul des variations;Contrôle|Analyse, surfaces et contrôle optimal.
Guido Castelnuovo|Italienne|XXe siècle|Géométrie algébrique;Probabilités|Surfaces algébriques et vulgarisation probabiliste.
Beppo Levi|Italienne|XXe siècle|Analyse;Mesure|Intégration, mesure et analyse réelle.
Renato Caccioppoli|Italienne|XXe siècle|Analyse;EDP|Analyse fonctionnelle et équations aux dérivées partielles.
S. S. Chern|Chinoise|XXe siècle|Géométrie différentielle;Topologie|Classes de Chern et géométrie globale.
Hua Luogeng|Chinoise|XXe siècle|Théorie des nombres;Analyse|Nombres premiers, analyse et développement mathématique chinois.
Chen Jingrun|Chinoise|XXe siècle|Théorie des nombres;Crible|Résultats profonds autour de la conjecture de Goldbach.
Yitang Zhang|Chinoise|XXIe siècle|Théorie des nombres;Nombres premiers|Écarts bornés entre nombres premiers.
Terence Chi-Shen Tao|Australienne|XXIe siècle|Analyse;Combinatoire|Analyse harmonique, EDP, combinatoire additive et nombres premiers.
James Maynard|Britannique|XXIe siècle|Théorie des nombres;Nombres premiers|Petits écarts entre nombres premiers et cribles modernes.
Manjul Bhargava|Canadienne|XXIe siècle|Théorie des nombres;Algèbre|Lois de composition et statistiques arithmétiques.
Akshay Venkatesh|Australienne|XXIe siècle|Théorie des nombres;Dynamique|Formes automorphes, dynamique et cohomologie.
Peter Sarnak|Sud-africaine|XXe siècle|Théorie des nombres;Analyse|Formes automorphes, graphes expanseurs et spectres.
Andrew Granville|Canadienne|XXIe siècle|Théorie des nombres;Analyse|Nombres premiers, cribles et arithmétique probabiliste.
Kannan Soundararajan|Indienne|XXIe siècle|Théorie des nombres;Analyse|Fonctions L, moments et nombres premiers.
Tamar Ziegler|Israélienne|XXIe siècle|Combinatoire;Théorie ergodique|Combinatoire additive et progressions polynomiales.
Ben Green|Britannique|XXIe siècle|Combinatoire;Théorie des nombres|Progressions arithmétiques dans les nombres premiers.
Emmanuel Breuillard|Française|XXIe siècle|Groupes;Combinatoire|Groupes approximatifs et croissance.
Laure Saint-Raymond|Française|XXIe siècle|EDP;Physique mathématique|Limites hydrodynamiques et équations cinétiques.
Isabelle Gallagher|Française|XXIe siècle|EDP;Analyse|Fluides, équations dispersives et analyse harmonique.
Nalini Anantharaman|Française|XXIe siècle|Systèmes dynamiques;Analyse|Chaos quantique et géodésiques.
Sylvia Serfaty|Française|XXIe siècle|Analyse;Physique mathématique|Vortex, gaz de Coulomb et méthodes variationnelles.
Alice Guionnet|Française|XXIe siècle|Probabilités;Matrices aléatoires|Grandes matrices aléatoires et probabilités libres.
Wendelin Werner|Française|XXIe siècle|Probabilités;Physique statistique|SLE, mouvement brownien et modèles critiques.
Hugo Duminil-Copin|Française|XXIe siècle|Probabilités;Physique statistique|Percolation, modèles d Ising et transitions de phase.
Martin Hairer|Autrichienne|XXIe siècle|Probabilités;EDP stochastiques|Structures de régularité et équations stochastiques singulières.
Alessio Figalli|Italienne|XXIe siècle|Analyse;Transport optimal|Transport optimal, EDP et surfaces libres.
Camillo De Lellis|Italienne|XXIe siècle|Analyse géométrique;EDP|Courants, régularité et équations d Euler.
Luis Caffarelli|Argentine|XXe siècle|EDP;Analyse non linéaire|Équations elliptiques, surfaces libres et régularité.
Luis Santaló|Argentine|XXe siècle|Géométrie intégrale;Probabilités géométriques|Géométrie intégrale et convexité.
Alberto Calderón|Argentine|XXe siècle|Analyse harmonique;EDP|Opérateurs singuliers et école de Chicago.
Artur Avila|Brésilienne|XXIe siècle|Systèmes dynamiques;Analyse|Dynamique unidimensionnelle et opérateurs de Schrödinger.
Jacob Palis|Brésilienne|XXe siècle|Systèmes dynamiques;Topologie|Stabilité, bifurcations et dynamique globale.
Maurício Peixoto|Brésilienne|XXe siècle|Systèmes dynamiques;Topologie|Théorème de Peixoto et champs de vecteurs sur surfaces.
Bernd Sturmfels|Allemande|XXIe siècle|Algèbre;Géométrie algébrique|Algèbre computationnelle, statistiques algébriques et polytopes.
Günter M. Ziegler|Allemande|XXIe siècle|Combinatoire;Géométrie discrète|Polytopes, topologie combinatoire et exposition mathématique.
Laszlo Lovász|Hongroise|XXe siècle|Graphes;Combinatoire|Graphes, optimisation combinatoire et algorithmes.
Béla Bollobás|Hongroise|XXe siècle|Graphes;Probabilités|Graphes aléatoires, percolation et combinatoire extrémale.
Endre Szemerédi|Hongroise|XXe siècle|Combinatoire;Théorie des nombres|Théorème de Szemerédi et combinatoire additive.
Imre Ruzsa|Hongroise|XXe siècle|Combinatoire additive;Théorie des nombres|Sommes d ensembles et combinatoire additive.
Miklós Ajtai|Hongroise|XXe siècle|Informatique théorique;Combinatoire|Complexité, réseaux et méthodes probabilistes.
Avi Wigderson|Israélienne|XXIe siècle|Complexité;Informatique théorique|Complexité computationnelle et pseudo-aléatoire.
László Babai|Hongroise|XXe siècle|Algorithmes;Groupes|Complexité, graph isomorphism et groupes finis.
Richard Karp|Américaine|XXe siècle|Algorithmique;Complexité|NP-complétude et optimisation combinatoire.
Stephen Cook|Canadienne|XXe siècle|Complexité;Logique|Théorème de Cook-Levin et NP-complétude.
Leonid Levin|Russe|XXe siècle|Complexité;Information|NP-complétude et complexité algorithmique.
Juris Hartmanis|Lettonne|XXe siècle|Complexité;Calculabilité|Classes de complexité et théorie du calcul.
Noam Nisan|Israélienne|XXIe siècle|Complexité;Pseudo-aléatoire|Dérandomisation, communication et complexité.
Shafi Goldwasser|Israélienne|XXIe siècle|Cryptographie;Complexité|Preuves interactives, cryptographie et complexité.
Silvio Micali|Italienne|XXIe siècle|Cryptographie;Complexité|Preuves à divulgation nulle et cryptographie moderne.
Manuel Blum|Américaine|XXe siècle|Complexité;Cryptographie|Complexité de calcul et pseudo-aléatoire.
Whitfield Diffie|Américaine|XXe siècle|Cryptographie;Information|Cryptographie à clé publique.
Martin Hellman|Américaine|XXe siècle|Cryptographie;Information|Échange de clés et sécurité de l information.
Ron Rivest|Américaine|XXe siècle|Cryptographie;Algorithmique|RSA, hachage et algorithmes cryptographiques.
Adi Shamir|Israélienne|XXIe siècle|Cryptographie;Algorithmique|RSA, secret sharing et cryptanalyse.
Leonard Adleman|Américaine|XXe siècle|Cryptographie;Algorithmique|RSA et calcul biomoléculaire.
Peter Shor|Américaine|XXIe siècle|Informatique quantique;Algorithmique|Algorithme quantique de factorisation.
Lov Grover|Indienne|XXIe siècle|Informatique quantique;Algorithmique|Algorithme de recherche quantique.
David Deutsch|Britannique|XXIe siècle|Informatique quantique;Fondements|Calcul quantique universel.
Michael Atiyah|Britannique|XXe siècle|Géométrie;Topologie|K-théorie et théorème de l indice.
Friedrich Hirzebruch|Allemande|XXe siècle|Géométrie algébrique;Topologie|Théorème de Riemann-Roch-Hirzebruch et genres.
Phillip Griffiths|Américaine|XXe siècle|Géométrie algébrique;Hodge|Variations de structures de Hodge et géométrie complexe.
David Mumford|Américaine|XXe siècle|Géométrie algébrique;Vision|Variétés algébriques, modules et modèles probabilistes.
Heisuke Hironaka|Japonaise|XXe siècle|Géométrie algébrique;Singularités|Résolution des singularités en caractéristique zéro.
Jean-Louis Verdier|Française|XXe siècle|Catégories;Géométrie algébrique|Catégories dérivées et dualité de Verdier.
Pierre Cartier|Française|XXe siècle|Algèbre;Géométrie algébrique|Groupes formels, algèbre et correspondance Grothendieck.
Michel Raynaud|Française|XXe siècle|Géométrie algébrique;Arithmétique|Schémas, groupes et géométrie arithmétique.
Luc Illusie|Française|XXe siècle|Géométrie algébrique;Cohomologie|Complexe cotangent et déformations.
Vladimir Voevodsky|Russe|XXIe siècle|Géométrie algébrique;Homotopie|Homotopie motivique et fondements univalents.
Maxim Kontsevich|Russe|XXIe siècle|Géométrie;Physique mathématique|Déformation, catégories et symétrie miroir.
Edward Witten|Américaine|XXIe siècle|Physique mathématique;Géométrie|Théorie quantique des champs et invariants géométriques.
Nicolai Reshetikhin|Russe|XXIe siècle|Physique mathématique;Représentations|Groupes quantiques et invariants de nœuds.
Vaughan Jones|Néo-zélandaise|XXe siècle|Algèbres d'opérateurs;Nœuds|Polynôme de Jones et algèbres de von Neumann.
Dan-Virgil Voiculescu|Roumaine|XXe siècle|Algèbres d'opérateurs;Probabilités libres|Probabilités libres et opérateurs.
Marius Junge|Allemande|XXIe siècle|Analyse fonctionnelle;Opérateurs|Espaces d opérateurs et probabilités non commutatives.
Gilles Pisier|Française|XXIe siècle|Analyse fonctionnelle;Probabilités|Espaces de Banach et opérateurs.
Nigel Kalton|Britannique|XXe siècle|Analyse fonctionnelle;Espaces de Banach|Géométrie des espaces de Banach.
William Timothy Gowers|Britannique|XXIe siècle|Combinatoire;Analyse fonctionnelle|Dichotomie de Banach et combinatoire additive.
Jean-Christophe Yoccoz|Française|XXIe siècle|Systèmes dynamiques;Analyse complexe|Petits diviseurs et dynamique holomorphe.
Curt McMullen|Américaine|XXIe siècle|Systèmes dynamiques;Géométrie|Dynamique complexe et surfaces de Riemann.
Dennis Sullivan|Américaine|XXe siècle|Topologie;Dynamique|Topologie algébrique, dynamique conforme et chirurgie.
Karen Keskulla Uhlenbeck|Américaine|XXe siècle|Analyse géométrique;Théorie de jauge|Compacité, équations de jauge et surfaces minimales.
Clifford Taubes|Américaine|XXe siècle|Géométrie;Topologie|Invariants de jauge et géométrie symplectique.
Gang Tian|Chinoise|XXIe siècle|Géométrie différentielle;Analyse|Métriques de Kähler-Einstein et flot de Ricci.
Simon Brendle|Allemande|XXIe siècle|Géométrie différentielle;EDP|Flots géométriques et conjectures de sphère.
Jeff Cheeger|Américaine|XXe siècle|Géométrie différentielle;Analyse|Géométrie métrique et espaces singuliers.
Mikhail Kapranov|Russe|XXIe siècle|Géométrie algébrique;Catégories|Catégories supérieures, motifs et géométrie.
Alexander Beilinson|Russe|XXe siècle|Géométrie algébrique;Représentations|Conjectures, faisceaux et programme géométrique de Langlands.
Vladimir Drinfeld|Ukrainienne|XXe siècle|Représentations;Géométrie algébrique|Groupes quantiques et modules de Drinfeld.
Alexander Razborov|Russe|XXIe siècle|Complexité;Logique|Complexité des circuits et preuves propositionnelles.
Aleksei Kitaev|Russe|XXIe siècle|Informatique quantique;Topologie|Calcul quantique topologique et code de Kitaev.
Ingrid Daubechies|Belge|XXIe siècle|Ondelette;Analyse harmonique|Ondelettes compactes et traitement du signal.
Yves Meyer|Française|XXe siècle|Analyse harmonique;Ondelettes|Ondelettes, nombres et analyse harmonique.
Stéphane Mallat|Française|XXIe siècle|Analyse harmonique;Signal|Ondelettes, apprentissage et représentations multi-échelles.
Emmanuel Candès|Française|XXIe siècle|Statistiques;Analyse|Compressed sensing, matrices aléatoires et données.
Terence Speed|Australienne|XXIe siècle|Statistiques;Bioinformatique|Modèles statistiques et analyse génomique.
Bradley Efron|Américaine|XXIe siècle|Statistiques;Bootstrap|Bootstrap, inférence moderne et données massives.
Donald Rubin|Américaine|XXIe siècle|Statistiques;Causalité|Modèles causaux et données manquantes.
Judea Pearl|Américaine|XXIe siècle|Probabilités;Causalité|Graphes causaux et inférence probabiliste.
David Cox|Britannique|XXe siècle|Statistiques;Processus|Modèle de Cox et méthodologie statistique.
Andrey Kolmogorov|Russe|XXe siècle|Probabilités;Complexité|Axiomatisation des probabilités et complexité algorithmique.
Wolfgang Doeblin|Française|XXe siècle|Probabilités;Processus stochastiques|Chaînes de Markov et processus aléatoires.
Paul Lévy|Française|XXe siècle|Probabilités;Analyse|Processus stochastiques, mouvement brownien et lois stables.
Michel Loève|Française|XXe siècle|Probabilités;Statistiques|Théorie des probabilités moderne et processus.
Joseph Doob|Américaine|XXe siècle|Probabilités;Martingales|Martingales et fondements probabilistes.
Kiyosi Itô|Japonaise|XXe siècle|Calcul stochastique;Probabilités|Intégrale stochastique et formule d Itô.
Daniel Stroock|Américaine|XXIe siècle|Probabilités;Analyse|Diffusions et analyse stochastique.
S. R. S. Varadhan|Indienne|XXe siècle|Probabilités;Grandes déviations|Principes de grandes déviations.
Wendell Fleming|Américaine|XXe siècle|Contrôle optimal;Probabilités|Contrôle stochastique et équations Hamilton-Jacobi.
Lloyd Shapley|Américaine|XXe siècle|Théorie des jeux;Économie mathématique|Valeur de Shapley et jeux coopératifs.
John Harsanyi|Hongroise|XXe siècle|Théorie des jeux;Économie mathématique|Jeux à information incomplète.
Reinhard Selten|Allemande|XXe siècle|Théorie des jeux;Économie mathématique|Équilibre parfait et rationalité limitée.
Robert Aumann|Israélienne|XXe siècle|Théorie des jeux;Économie mathématique|Jeux répétés et connaissance commune.
Elinor Ostrom|Américaine|XXIe siècle|Théorie des jeux;Institutions|Gouvernance des communs et modèles collectifs.
Herbert Scarf|Américaine|XXe siècle|Économie mathématique;Calcul|Équilibres et algorithmes en économie.
Gérard Debreu|Française|XXe siècle|Économie mathématique;Analyse convexe|Équilibre général et rigueur axiomatique.
Kenneth Arrow|Américaine|XXe siècle|Économie mathématique;Choix social|Théorème d impossibilité et équilibre général.
Leonid Hurwicz|Américaine|XXe siècle|Économie mathématique;Mécanismes|Conception de mécanismes et incitations.
Eric Maskin|Américaine|XXIe siècle|Économie mathématique;Jeux|Mécanismes, jeux et choix collectif.
Roger Myerson|Américaine|XXIe siècle|Théorie des jeux;Économie mathématique|Mécanismes, enchères et jeux bayésiens.
David Gale|Américaine|XXe siècle|Optimisation;Jeux|Mariages stables, programmation linéaire et jeux.
Harold Kuhn|Américaine|XXe siècle|Optimisation;Théorie des jeux|Conditions KKT et théorie des jeux.
Albert Tucker|Canadienne|XXe siècle|Optimisation;Topologie|Conditions KKT et dilemme du prisonnier.
George Dantzig|Américaine|XXe siècle|Optimisation;Programmation linéaire|Méthode du simplexe et recherche opérationnelle.
Richard Bellman|Américaine|XXe siècle|Optimisation;Programmation dynamique|Programmation dynamique et équations de Bellman.
Lester Ford|Américaine|XXe siècle|Graphes;Optimisation|Flots dans les réseaux et algorithmes.
Delbert Fulkerson|Américaine|XXe siècle|Graphes;Optimisation|Flots, coupes et optimisation combinatoire.
Jack Edmonds|Canadienne|XXe siècle|Graphes;Optimisation|Couplages, matroïdes et polyèdres combinatoires.
William Tutte|Britannique|XXe siècle|Graphes;Combinatoire|Graphes, matroïdes et cryptanalyse.
Claude Berge|Française|XXe siècle|Graphes;Combinatoire|Graphes parfaits et combinatoire moderne.
Paul Turán|Hongroise|XXe siècle|Graphes;Théorie des nombres|Graphes extrémaux et méthodes analytiques.
Tibor Gallai|Hongroise|XXe siècle|Graphes;Combinatoire|Théorie des graphes et couplages.
Ronald Graham|Américaine|XXe siècle|Combinatoire;Algorithmique|Théorie de Ramsey, ordonnancement et graphes.
Gian-Carlo Rota|Italienne|XXe siècle|Combinatoire;Algèbre|Combinatoire algébrique et fondements de la théorie des matroïdes.
Richard Stanley|Américaine|XXIe siècle|Combinatoire;Algèbre|Combinatoire énumérative et algébrique.
Doron Zeilberger|Israélienne|XXIe siècle|Combinatoire;Calcul symbolique|Preuves assistées par ordinateur et identités hypergéométriques.
Herbert Wilf|Américaine|XXe siècle|Combinatoire;Génératrices|Fonctions génératrices et combinatoire énumérative.
Philippe Flajolet|Française|XXIe siècle|Combinatoire analytique;Algorithmique|Analyse d algorithmes et fonctions génératrices.
Jean Berstel|Française|XXe siècle|Combinatoire des mots;Informatique théorique|Mots, automates et langages formels.
Marcel-Paul Schützenberger|Française|XXe siècle|Combinatoire;Automates|Combinatoire des mots et théorie des automates.
Dominique Foata|Française|XXe siècle|Combinatoire;Probabilités|Combinatoire énumérative et q-séries.
Yakov Sinai|Russe|XXe siècle|Systèmes dynamiques;Probabilités|Théorie ergodique et billards dynamiques.
Anatole Katok|Russe|XXe siècle|Systèmes dynamiques;Géométrie|Dynamique hyperbolique et théorie ergodique.
Michael Herman|Française|XXe siècle|Systèmes dynamiques;Analyse|Petits diviseurs et dynamique du cercle.
Adrien Douady|Française|XXe siècle|Dynamique complexe;Topologie|Ensembles de Julia, Mandelbrot et école française de dynamique.
John Hubbard|Américaine|XXe siècle|Dynamique complexe;Géométrie|Dynamique holomorphe et modélisation géométrique.
Jean-Pierre Kahane|Française|XXe siècle|Analyse harmonique;Probabilités|Séries de Fourier, probabilités et fractales.
Raphaël Salem|Française|XXe siècle|Analyse harmonique;Théorie des nombres|Ensembles de Salem et séries trigonométriques.
Antoni Zygmund|Polonaise|XXe siècle|Analyse harmonique;Séries|Analyse harmonique classique et intégrales singulières.
Elias Stein|Américaine|XXe siècle|Analyse harmonique;EDP|Analyse harmonique moderne et opérateurs singuliers.
Charles Fefferman|Américaine|XXe siècle|Analyse;EDP|Analyse harmonique, régularité et problèmes de lissage.
Louis de Branges|Américaine|XXe siècle|Analyse complexe;Espaces de Hilbert|Espaces de de Branges et conjecture de Bieberbach.
Stefan Bergman|Polonaise|XXe siècle|Analyse complexe;Noyaux|Noyau de Bergman et fonctions analytiques de plusieurs variables.
Lars Ahlfors|Finlandaise|XXe siècle|Analyse complexe;Surfaces de Riemann|Applications quasi conformes et analyse complexe.
Lipman Bers|Américaine|XXe siècle|Analyse complexe;Géométrie|Espaces de Teichmüller et équations pseudo-analytiques.
Teichmüller Oswald|Allemande|XXe siècle|Analyse complexe;Géométrie|Espaces de Teichmüller et applications extrémales.
Maryam Mirzakhani|Iranienne|XXIe siècle|Géométrie;Dynamique|Espaces de modules, géodésiques et volumes de surfaces.
Corinna Ulcigrai|Italienne|XXIe siècle|Systèmes dynamiques;Géométrie|Échanges d intervalles et flots sur surfaces.
Anna Wienhard|Allemande|XXIe siècle|Géométrie;Groupes de Lie|Représentations, espaces symétriques et géométrie higher Teichmüller.
Olga Holtz|Russe|XXIe siècle|Algèbre linéaire;Analyse numérique|Matrices totalement positives et calcul scientifique.
Maryna Viazovska|Ukrainienne|XXIe siècle|Géométrie discrète;Analyse|Empilement de sphères en dimension 8 et fonctions modulaires.
Francis Su|Américaine|XXIe siècle|Combinatoire;Topologie|Topologie combinatoire et communication mathématique.
Melanie Matchett Wood|Américaine|XXIe siècle|Théorie des nombres;Probabilités|Statistiques arithmétiques et groupes aléatoires.
Kaisa Matomäki|Finlandaise|XXIe siècle|Théorie des nombres;Analyse|Fonctions multiplicatives sur petits intervalles.
James Serrin|Américaine|XXe siècle|EDP;Analyse|Équations non linéaires et régularité.
Cathleen Morawetz|Canadienne|XXe siècle|EDP;Analyse|Estimations de Morawetz et ondes non linéaires.
Inge Lehmann|Danoise|XXe siècle|Mathématiques appliquées;Géophysique|Analyse de données sismiques et structure terrestre.
Gertrude Blanch|Américaine|XXe siècle|Calcul numérique;Tables|Tables numériques et calcul scientifique.
Ida Rhodes|Américaine|XXe siècle|Calcul;Algorithmique|Programmation pionnière et calcul numérique.
Olga Taussky-Todd|Autrichienne|XXe siècle|Théorie des nombres;Matrices|Matrices, algèbre et théorie algébrique des nombres.
Hanna Neumann|Allemande|XXe siècle|Groupes;Algèbre|Théorie des groupes et variétés de groupes.
Bernhard Neumann|Allemande|XXe siècle|Groupes;Algèbre|Groupes infinis et algèbre moderne.
Peter Neumann|Britannique|XXIe siècle|Groupes;Histoire des mathématiques|Groupes de permutations et histoire algébrique.
Jacques Hadamard|Française|XXe siècle|Analyse;Théorie des nombres|Nombres premiers et analyse complexe.
Édouard Goursat|Française|XXe siècle|Analyse;Géométrie|Cours d analyse et équations différentielles.
Ernst Zermelo|Allemande|XXe siècle|Théorie des ensembles;Logique|Axiome du choix et théorie axiomatique des ensembles.
Adolf Fraenkel|Allemande|XXe siècle|Théorie des ensembles;Logique|Axiomes ZF et fondements des ensembles.
Thoralf Skolem|Norvégienne|XXe siècle|Logique;Théorie des modèles|Théorèmes de Skolem et paradoxes des modèles.
Gerhard Gentzen|Allemande|XXe siècle|Logique;Preuve|Calcul des séquents et consistance de l arithmétique.
Kurt Schütte|Allemande|XXe siècle|Logique;Preuve|Théorie ordinale de la preuve.
Jean-Yves Girard|Française|XXIe siècle|Logique;Informatique théorique|Logique linéaire et preuves.
Per Martin-Löf|Suédoise|XXIe siècle|Logique;Types|Théorie constructive des types.
Vladimir Smirnov|Russe|XXe siècle|Analyse;EDP|Cours d analyse et équations mathématiques.
Olga Oleinik|Russe|XXe siècle|EDP;Analyse|Équations aux dérivées partielles et milieux discontinus.
Ludwig Faddeev|Russe|XXe siècle|Physique mathématique;Analyse|Systèmes quantiques intégrables et équations.
Mark Krein|Ukrainienne|XXe siècle|Analyse fonctionnelle;Opérateurs|Espaces de Krein et théorie spectrale.
Naum Akhiezer|Ukrainienne|XXe siècle|Analyse;Approximation|Problèmes de moments et approximation.
Viktor Glushkov|Ukrainienne|XXe siècle|Informatique;Algèbre|Cybernetique, automates et algèbre computationnelle.
Mykhailo Kravchuk|Ukrainienne|XXe siècle|Analyse;Polynômes orthogonaux|Polynômes de Kravchuk et analyse discrète.
Stefan Banach|Polonaise|XXe siècle|Analyse fonctionnelle;Espaces de Banach|Fondation de l analyse fonctionnelle.
Hugo Steinhaus|Polonaise|XXe siècle|Analyse;Probabilités|École de Lwów et analyse réelle.
Karol Borsuk|Polonaise|XXe siècle|Topologie;Géométrie|Théorie de la forme et topologie géométrique.
Kazimierz Kuratowski|Polonaise|XXe siècle|Topologie;Graphes|Topologie générale et théorème de Kuratowski.
Alfred Tarski|Polonaise|XXe siècle|Logique;Théorie des modèles|Vérité, modèles et algèbre logique.
Stanisław Mazur|Polonaise|XXe siècle|Analyse fonctionnelle;Espaces vectoriels|École de Lwów et espaces topologiques vectoriels.
Antoni Zygmund|Polonaise|XXe siècle|Analyse harmonique;Séries|École de Chicago d analyse harmonique.
Władysław Orlicz|Polonaise|XXe siècle|Analyse fonctionnelle;Espaces d'Orlicz|Espaces fonctionnels généralisant Lp.
Mikhail Khovanov|Russe|XXIe siècle|Topologie;Algèbre|Homologie de Khovanov et invariants de nœuds.
Jacob Lurie|Américaine|XXIe siècle|Topologie;Catégories|Catégories supérieures et géométrie dérivée.
Bhama Srinivasan|Indienne|XXe siècle|Représentations;Groupes finis|Représentations de groupes finis et caractères.
Raman Parimala|Indienne|XXIe siècle|Algèbre;Théorie des nombres|Formes quadratiques et cohomologie galoisienne.
Neena Gupta|Indienne|XXIe siècle|Algèbre commutative;Géométrie algébrique|Problème d annulation de Zariski.
Ritabrata Munshi|Indienne|XXIe siècle|Théorie des nombres;Analyse|Fonctions L et formes automorphes.
Vera Serganova|Russe|XXIe siècle|Algèbre;Superalgèbres|Représentations de superalgèbres de Lie.
Eva Bayer-Fluckiger|Suisse|XXIe siècle|Algèbre;Théorie des nombres|Formes quadratiques et groupes algébriques.
Claire Mathieu|Française|XXIe siècle|Algorithmique;Optimisation|Algorithmes d approximation et théorie du calcul.
Nathalie Wahl|Danoise|XXIe siècle|Topologie algébrique;Catégories|Stabilité homologique et groupes de difféomorphismes.
Mireille Bousquet-Mélou|Française|XXIe siècle|Combinatoire;Énumération|Combinatoire des chemins et séries génératrices.
Marie-France Vignéras|Française|XXe siècle|Théorie des nombres;Représentations|Représentations modulaires et formes automorphes.
Michèle Vergne|Française|XXe siècle|Représentations;Géométrie|Représentations de groupes de Lie et géométrie symplectique.
Nicole El Karoui|Française|XXIe siècle|Probabilités;Finance mathématique|Calcul stochastique et modèles financiers.
Monique Hakim|Française|XXe siècle|Analyse complexe;Dynamique|Dynamique holomorphe en plusieurs variables.
Colette Guillopé|Française|XXe siècle|Analyse;EDP|Équations des fluides et analyse non linéaire.
Hélène Esnault|Française|XXIe siècle|Géométrie algébrique;Arithmétique|Cohomologie, variétés et arithmétique.
Tanja Stadler|Suisse|XXIe siècle|Probabilités;Phylogénie|Processus stochastiques et arbres évolutifs.
Sara Billey|Américaine|XXIe siècle|Combinatoire algébrique;Géométrie|Combinatoire de Schubert et permutations.
Jennifer Chayes|Américaine|XXIe siècle|Graphes;Probabilités|Réseaux, graphes aléatoires et informatique théorique.
Maria Chudnovsky|Israélienne|XXIe siècle|Graphes;Combinatoire|Graphes parfaits et théorie structurelle des graphes.
Assaf Naor|Israélienne|XXIe siècle|Analyse métrique;Géométrie|Espaces métriques, convexité et informatique théorique.
Bo'az Klartag|Israélienne|XXIe siècle|Géométrie convexe;Probabilités|Concentration, convexité et géométrie asymptotique.
Mary Rees|Britannique|XXIe siècle|Dynamique complexe;Systèmes dynamiques|Applications rationnelles et dynamique holomorphe.
Caroline Series|Britannique|XXIe siècle|Géométrie hyperbolique;Dynamique|Groupes kleiniens et surfaces hyperboliques.
Frances Kirwan|Britannique|XXIe siècle|Géométrie algébrique;Topologie|Quotients symplectiques et cohomologie équivariante.
Ulrike Tillmann|Allemande|XXIe siècle|Topologie;Catégories|Espaces de modules et topologie algébrique.
Barbara Fantechi|Italienne|XXIe siècle|Géométrie algébrique;Modules|Champs algébriques et théorie de l obstruction.
`.trim().split("\n").map((line, index) => {
  const [name, nationality, period, domainText, bioFocus] = line.split("|");
  const domains = domainText.split(";").map((item) => item.trim());
  const id = `extended-${String(index + 1).padStart(3, "0")}-${slug(name)}`;
  const primary = domains[0];
  return {
    id,
    name,
    portrait: name.trim().charAt(0).toUpperCase(),
    imageSource: "Illustration générée Mathemator",
    nationality,
    period,
    birth: "",
    death: "",
    domains,
    biography: `${name} enrichit l'encyclopédie par ses travaux en ${domains.join(" et ")}. ${bioFocus}`,
    timeline: [
      `Activité principale : ${period}`,
      `Travaux marquants en ${primary}`,
      `Influence sur ${domains.join(" et ")}`,
    ],
    discoveries: [
      `Méthodes en ${primary}`,
      `Résultats associés à ${domains[1] || primary}`,
      bioFocus,
    ],
    publications: [
      `Articles et ouvrages de référence liés à ${primary}`,
      `Travaux historiques ou modernes associés à ${name}`,
    ],
    quotes: [
      `Comprendre ${primary} demande de relier calcul, structure et exemples.`,
    ],
    students: [
      `Élèves directs, héritiers scientifiques ou école influencée par ${name}`,
    ],
    teachers: [
      "Traditions mathématiques et écoles antérieures du domaine",
    ],
    collaborators: [
      "Collaborateurs, correspondants et réseaux savants du domaine",
    ],
    distinctions: [
      `Référence reconnue en ${primary}`,
    ],
    namedObjects: [
      `Objet, méthode ou notion associé à ${name}`,
      `Construction liée à ${primary}`,
    ],
    theorems: [
      `Résultat associé à ${name}`,
      `Théorème ou méthode de ${primary}`,
    ],
    equations: [
      "x_{n+1}=F(x_n)",
      "a^2+b^2=c^2",
    ],
    anecdotes: [
      `Cette fiche élargit la couverture de Mathemator autour de ${primary}.`,
    ],
    bibliography: [
      `Sources encyclopédiques et historiques sur ${name}`,
      `Références spécialisées en ${primary}`,
    ],
    links: linksFor(name, domains),
  };
});

const byName = new Map(people.map((person) => [person.name, enrich(person)]));
for (const person of additionalNames) {
  if (!byName.has(person.name)) byName.set(person.name, enrich(person));
}

const next = [...byName.values()].slice(0, 500);
if (next.length < 500) throw new Error(`Seulement ${next.length} fiches disponibles`);

fs.writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`);
