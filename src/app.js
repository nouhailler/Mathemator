import { loadContent } from "./content.js";

/* =========================================================
   Mathemator — refonte 2026
   SPA vanilla : 5 chapitres, navigation par état d'écran.
   Données réelles depuis data/*.json (via content.js).
   ========================================================= */

const content = await loadContent();
const {
  books,
  dailyItems,
  domains,
  exercises,
  formulas,
  glossary,
  mathematicians,
  media,
  objects,
  places,
  problems,
  quiz,
  quotes,
  theorems,
  timelineItems,
} = content;

/* ------------------------- utilitaires ------------------------- */
const screenEl = document.getElementById("screen");
const navEl = document.getElementById("bottomNav");
const chapterEl = document.getElementById("chapterLabel");
const menuButton = document.getElementById("menuButton");

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");

const store = {
  get(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* stockage indisponible */
    }
  },
};

const fmtNum = (n) => n.toLocaleString("fr-FR");
const fmtDec = (n) => {
  const r = Math.round(n * 1000) / 1000;
  return String(r).replace(".", ",");
};

/* ------------------------- favoris ------------------------- */
// Clés typées « type:id » (math, theo, prob, obj, form). Migration des
// anciennes clés nues (identifiants de mathématiciens) vers « math:id ».
const FAV_KEY = "mathemator:favs";
let favs = store.get(FAV_KEY, {});
(function migrateFavs() {
  let changed = false;
  for (const k of Object.keys(favs)) {
    if (!k.includes(":")) {
      favs["math:" + k] = favs[k];
      delete favs[k];
      changed = true;
    }
  }
  if (changed) store.set(FAV_KEY, favs);
})();
const favKey = (type, id) => `${type}:${id}`;
const isFav = (type, id) => !!favs[favKey(type, id)];
const favCount = () => Object.values(favs).filter(Boolean).length;
function toggleFav(type, id) {
  const k = favKey(type, id);
  favs = { ...favs, [k]: !favs[k] };
  store.set(FAV_KEY, favs);
}
// Bouton étoile réutilisable.
function favStar(type, id) {
  return `<button class="fav-star" data-act="fav" data-type="${type}" data-id="${escAttr(id)}" aria-label="Favori" aria-pressed="${isFav(
    type,
    id
  )}">${isFav(type, id) ? "★" : "☆"}</button>`;
}

/* ------------------------- progression ------------------------- */
const PROG_KEY = "mathemator:progress";
const todayISO = () => new Date().toISOString().slice(0, 10);
let progress = store.get(PROG_KEY, {
  days: [],
  correctQuiz: 0,
  quizByDomain: {},
  viewed: [],
});
progress.days = Array.isArray(progress.days) ? progress.days : [];
progress.viewed = Array.isArray(progress.viewed) ? progress.viewed : [];
progress.done = Array.isArray(progress.done) ? progress.done : [];
progress.quizByDomain = progress.quizByDomain || {};
(function recordVisit() {
  const t = todayISO();
  if (!progress.days.includes(t)) {
    progress.days.push(t);
    progress.days.sort();
    store.set(PROG_KEY, progress);
  }
})();
function currentStreak() {
  const set = new Set(progress.days);
  let streak = 0;
  const d = new Date();
  for (;;) {
    const iso = d.toISOString().slice(0, 10);
    if (set.has(iso)) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}
function saveProgress() {
  store.set(PROG_KEY, progress);
}

/* ------------------------- état applicatif ------------------------- */
const state = {
  screen: "home",
  menuOpen: false,
  cat: "math", // math | dom | theo | form | obj | prob | bib | fav
  bibCol: null, // quotes | books | glossary | media
  open: null, // { type, id } — fiche détail ouverte
  q: "",
  pratTab: "ex", // ex | quiz | prog
  lvl: "Tous",
  quizIdx: 0,
  quizPick: null,
  histTab: "chrono", // chrono | carte
  labTool: null, // null | graph | geo | poly | fractal
  calcTool: null, // null | sci | matrix | seq | stat | conv
  graphFn: "sin(x) * x / 3",
  polySolid: "cube",
  a: "1",
  b: "-3",
  c: "2",
};

function setState(patch) {
  Object.assign(state, patch);
  render();
}
function setScreen(screen) {
  state.q = "";
  setState({ screen, open: null, menuOpen: false, bibCol: null, labTool: null, calcTool: null });
}
function openItem(type, id) {
  setState({ open: { type, id } });
}

/* ------------------------- constantes de contenu ------------------------- */
const NAV = [
  ["home", "∑", "Accueil"],
  ["explorer", "I", "Explorer"],
  ["pratiquer", "II", "Pratiquer"],
  ["labo", "III", "Labo"],
  ["histoire", "IV", "Histoire"],
];
const CHAPTER = {
  home: "Édition 2026",
  explorer: "Chap. I — Explorer",
  pratiquer: "Chap. II — Pratiquer",
  labo: "Chap. III — Labo",
  histoire: "Chap. IV — Histoire",
};
const CATS = [
  ["all", "Tout"],
  ["math", "Mathématiciens"],
  ["dom", "Domaines"],
  ["theo", "Théorèmes"],
  ["form", "Formules"],
  ["obj", "Objets"],
  ["prob", "Problèmes"],
  ["bib", "Bibliothèque"],
  ["fav", "★ Collection"],
];
const LEVELS = ["Tous", "Collège", "Lycée", "Lycée avancé", "Licence", "Master"];
const DIFF_DOTS = { Facile: 1, Moyen: 2, Difficile: 3, Avancé: 3 };
const PRAT_TABS = [
  ["ex", "Exercices"],
  ["quiz", "Quiz"],
  ["prog", "Progression"],
];
const VISU_TOOLS = [
  ["graph", "ƒ(x)", "Grapheur", "Courbes 2D interactives"],
  ["geo", "△", "Géométrie dynamique", "Points déplaçables, mesures"],
  ["poly", "◇", "Polyèdres 3D", "Solides manipulables"],
  ["fractal", "ℳ", "Fractales", "Mandelbrot, plan complexe"],
];
const CALC_TOOLS = [
  ["sci", "Calculatrice scientifique", "Expressions, fonctions usuelles"],
  ["matrix", "Calcul matriciel", "Produit, déterminant, inverse (2×2)"],
  ["seq", "Suites", "Termes de u(n), convergence"],
  ["stat", "Statistiques & probabilités", "Moyenne, variance, loi binomiale"],
  ["conv", "Convertisseurs", "Angles, longueurs, masses"],
];
const BIBLIO = [
  ["quotes", "a.", "Citations", "Paroles de mathématiciens, par auteur et thème.", quotes.length],
  ["books", "b.", "Livres", "Bibliothèque commentée, du manuel au classique.", books.length],
  ["glossary", "c.", "Glossaire", "Définitions avec renvois croisés.", glossary.length],
  ["media", "d.", "Médiathèque", "Portraits, manuscrits, gravures et figures interactives.", media.length],
];
// Petit ensemble pour l'accord du surtitre « Mathématicienne ».
const FEMININE = new Set([
  "noether", "hypatie", "lovelace", "germain", "kovalevskaya", "kovalevskaïa",
  "johnson", "mirzakhani", "daubechies", "uhlenbeck", "robinson", "cartwright",
  "byron", "somerville", "agnesi", "bari", "ladyzhenskaya", "wheeler", "morawetz",
  "taussky", "rudin", "blum", "keller", "hopper", "granville", "gordon", "chudnovsky",
]);

/* index rapides */
const mathById = new Map(mathematicians.map((m) => [m.id, m]));
// Index par nom pour le routage des fiches détail (théorèmes, problèmes, objets, formules).
const firstBy = (arr, keyFn) => {
  const map = new Map();
  for (const it of arr) {
    const k = keyFn(it);
    if (k != null && !map.has(k)) map.set(k, it);
  }
  return map;
};
const theoByName = firstBy(theorems, (t) => t.name);
const probByName = firstBy(problems, (p) => p.name);
const objByName = firstBy(objects, (o) => o.name);
const formByName = firstBy(formulas, (f) => f.name);
const exById = firstBy(exercises, (e) => e.id);

// Détection du texte « creux ». Le contenu auto-généré réutilise le même
// gabarit de phrase sur des dizaines de fiches, en n'y changeant que le nom du
// domaine (« … en Géométrie … » / « … en Algèbre … »). On neutralise donc le
// vocabulaire de domaine, puis on compte les « squelettes » de phrase : un
// squelette vu ≥ 4 fois est un remplissage et n'est pas affiché.
const deaccent = (s) =>
  String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const domainVocab = (() => {
  const set = new Set();
  const addWords = (s) => deaccent(s).split(/[^a-z]+/).forEach((w) => w.length >= 4 && set.add(w));
  domains.forEach((d) => {
    addWords(d.name);
    addWords(d.family);
  });
  theorems.forEach((t) => addWords(t.discoverer));
  problems.forEach((p) => (addWords(p.domain), addWords(p.category)));
  exercises.forEach((e) => addWords(e.domain));
  formulas.forEach((f) => addWords(f.category));
  objects.forEach((o) => (addWords(o.category), addWords(o.dimension)));
  mathematicians.forEach((m) => (m.domains || []).forEach(addWords));
  return set;
})();
const skeleton = (s) =>
  deaccent(s)
    .split(/[^a-z]+/)
    .filter((w) => w && !domainVocab.has(w))
    .join(" ");
const genericSkeletons = (() => {
  const count = new Map();
  const add = (v) => {
    if (Array.isArray(v)) return v.forEach(add);
    if (typeof v !== "string" || v.trim().length < 10) return;
    const sk = skeleton(v);
    if (sk.split(" ").length >= 2) count.set(sk, (count.get(sk) || 0) + 1);
  };
  const scan = (arr, fields) => arr.forEach((o) => fields.forEach((f) => add(o[f])));
  scan(theorems, ["intuition", "proof", "variants", "generalization", "applications", "history", "exercises", "references"]);
  scan(exercises, ["hint", "correction", "solution", "detailedSolution", "proof", "references"]);
  scan(problems, ["accessible", "text", "history", "current", "impact", "advances", "recent", "references"]);
  scan(formulas, ["explanation", "examples", "proof", "uses"]);
  scan(objects, ["description", "history", "properties", "applications", "visualization"]);
  const set = new Set();
  for (const [sk, c] of count) if (c >= 5) set.add(sk);
  return set;
})();
const isGeneric = (v) =>
  typeof v === "string" && v.trim().length >= 10 && genericSkeletons.has(skeleton(v));
// Renvoie la valeur si elle est réellement spécifique ; sinon "" (chaîne) ou
// null (tableau) pour que `section(...)` masque la rubrique.
function scrub(v) {
  if (Array.isArray(v)) {
    const a = v.filter((x) => typeof x === "string" && x.trim() && !isGeneric(x));
    return a.length ? a : null;
  }
  if (typeof v === "string" && v.trim() && !isGeneric(v)) return v;
  return "";
}

// Associations réelles : on relie chaque mathématicien aux théorèmes de
// `theorems.json` dont il est le découvreur (les champs de mathematicians.json
// ne contiennent que des libellés génériques auto-générés).
const theoremsByMath = (() => {
  const nameTokens = (name) => {
    const words = String(name).split(/[\s'’.\-]+/).filter(Boolean);
    const keep = words.filter((w, i) => w.length >= 5 || (i === words.length - 1 && w.length >= 4));
    return keep.map((w) => w.toLowerCase());
  };
  const map = new Map();
  for (const m of mathematicians) {
    const toks = nameTokens(m.name);
    if (!toks.length) continue;
    const hits = [];
    for (const t of theorems) {
      const hay = ((t.discoverer || "") + " " + (t.name || "")).toLowerCase();
      if (toks.some((tok) => hay.includes(tok))) hits.push(t.name);
      if (hits.length >= 3) break;
    }
    if (hits.length) map.set(m.id, hits);
  }
  return map;
})();

/* ------------------------- portraits réels ------------------------- */
// media.json (type « Portrait ») recense les mathématiciens disposant d'un
// portrait libre sur Wikimedia Commons. On relie chaque fiche à son entrée
// média, puis on résout l'image réelle via l'API REST de Wikipédia.
const normName = (s) =>
  String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const portraitMediaByMath = (() => {
  const byNorm = new Map();
  const bySurname = new Map();
  for (const m of mathematicians) {
    byNorm.set(normName(m.name), m);
    const toks = normName(m.name).split(" ");
    const surname = toks[toks.length - 1];
    if (surname && surname.length >= 4 && !bySurname.has(surname)) bySurname.set(surname, m);
  }
  const map = new Map();
  for (const med of media) {
    if (med.type !== "Portrait") continue;
    const name = (med.links && med.links[0]) || med.title.replace(/^Portrait de\s+/i, "");
    const key = normName(name);
    let m = byNorm.get(key);
    if (!m) {
      const toks = key.split(" ");
      m = bySurname.get(toks[toks.length - 1]);
    }
    if (m && !map.has(m.id)) map.set(m.id, { name, source: med.source, sourceUrl: med.sourceUrl });
  }
  return map;
})();

// Titre d'article Wikipédia FR d'un mathématicien, extrait du lien fr.wikipedia
// déjà présent (curaté) dans ses données. Donne un point d'entrée fiable vers un
// portrait pour l'ensemble des fiches, et non le seul sous-ensemble « Portrait ».
function frWikiTitle(m) {
  if (!m || !Array.isArray(m.links)) return "";
  const link = m.links.find((l) => /\/\/fr\.wikipedia\.org\/wiki\//.test(l));
  if (!link) return "";
  try {
    return decodeURIComponent((link.split("/wiki/")[1] || "")).replace(/_/g, " ").trim();
  } catch {
    return "";
  }
}

// Repli « pays » : à défaut de portrait libre, on illustre la fiche par le drapeau
// de la nationalité (émoji Unicode, libre et hors-ligne). Table nationalité FR →
// code ISO 3166-1 alpha-2 ; les nationalités historiques pointent vers le pays
// moderne le plus proche (Perse → Iran, Grecque → Grèce, Arabe → Arabie, …).
const NAT_ISO = {
  Américaine: "US", Française: "FR", Allemande: "DE", Italienne: "IT", Russe: "RU",
  Britannique: "GB", Anglaise: "GB", Écossaise: "GB", Galloise: "GB", Irlandaise: "IE",
  Indienne: "IN", Hongroise: "HU", Japonaise: "JP", Grecque: "GR", Chinoise: "CN",
  Israélienne: "IL", Polonaise: "PL", Suisse: "CH", Canadienne: "CA", Persane: "IR",
  Iranienne: "IR", Autrichienne: "AT", Australienne: "AU", Norvégienne: "NO", Belge: "BE",
  Suédoise: "SE", Brésilienne: "BR", Argentine: "AR", Néerlandaise: "NL", Ukrainienne: "UA",
  Arabe: "SA", Finlandaise: "FI", Égyptienne: "EG", Vietnamienne: "VN", Coréenne: "KR",
  Ouzbèke: "UZ", Portugaise: "PT", Tchèque: "CZ", "Sud-africaine": "ZA", Lettonne: "LV",
  "Néo-zélandaise": "NZ", Roumaine: "RO", Danoise: "DK",
};
// Émoji drapeau à partir du code pays (deux indicateurs régionaux Unicode).
const isoToFlag = (iso) =>
  iso && /^[A-Z]{2}$/.test(iso)
    ? String.fromCodePoint(...[...iso].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
    : "🌍";
const flagFor = (m) => isoToFlag(NAT_ISO[(m.nationality || "").trim()]);

// Cache Wikipédia : { img, extract, url } (données réelles) ou false (aucune).
// L'API REST « summary » renvoie en un seul appel la vignette ET le résumé,
// qui sert de vraie biographie (attribuée) à la place du texte auto-généré.
const WIKI_KEY = "mathemator:wiki";
const wikiCache = new Map(Object.entries(store.get(WIKI_KEY, {})));
const persistWiki = () => store.set(WIKI_KEY, Object.fromEntries(wikiCache));
const wikiTried = new Set(); // évite de re-solliciter le réseau dans la session
async function resolveWiki(id) {
  if (wikiCache.has(id)) return wikiCache.get(id);
  if (wikiTried.has(id)) return false;
  // Titre : entrée curatée « Portrait » en priorité, sinon lien Wikipédia FR de la
  // fiche. Chaque mathématicien ayant un lien fr.wikipedia, on tente un portrait
  // réel pour tous, pas seulement l'ensemble « Portrait » de media.json.
  const info = portraitMediaByMath.get(id);
  const name = (info && info.name) || frWikiTitle(mathById.get(id));
  if (!name) return false; // aucun lien exploitable : glyphe + drapeau de nationalité
  wikiTried.add(id);
  try {
    const title = encodeURIComponent(name.replace(/ /g, "_"));
    const r = await fetch(`https://fr.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      headers: { accept: "application/json" },
    });
    if (r.ok) {
      const j = await r.json();
      const val = {
        img: (j.thumbnail && j.thumbnail.source) || "",
        extract: (j.extract || "").trim(),
        url: (j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page) || "",
      };
      const result = val.img || val.extract ? val : false;
      wikiCache.set(id, result); // réponse définitive (données trouvées ou absence)
      persistWiki();
      return result;
    }
  } catch {
    /* réseau indisponible : on n'enregistre rien pour réessayer plus tard */
  }
  return false;
}

// Présentation réelle d'un concept (théorème, problème, objet, formule). Les noms
// courts ne correspondent pas au titre de l'article ; on interroge donc la
// recherche Wikipédia, puis on ne retient le résumé que si l'article est bien du
// bon type (mots-clés) et n'est pas la fiche d'une personne (garde-fou).
const WIKI_TYPES = {
  theo: {
    query: (n) => (/th[ée]or[èe]me/i.test(n) ? n : "théorème " + n),
    kw: ["theoreme", "conjecture", "formule", "identite", "lemme", "principe", "inegalite", "relation", "hypothese", "axiome"],
  },
  prob: {
    query: (n) => n,
    kw: ["conjecture", "hypothese", "probleme", "theoreme", "paradoxe", "question", "enigme"],
  },
  obj: {
    query: (n) => n,
    kw: [], // objets très divers : on se fie au garde-fou anti-personne
  },
  form: {
    // Noms multi-mots (« Transformée de Fourier ») : requête telle quelle. Noms
    // d'un seul mot (« Euler », « Bayes ») : préfixe « formule » pour éviter la
    // fiche de la personne homonyme.
    query: (n) => (n.trim().split(/\s+/).length === 1 ? "formule " + n : n),
    kw: ["formule", "identite", "loi", "theoreme", "relation", "equation", "inegalite", "serie", "developpement", "binome", "fonction", "transform", "distance", "entropie", "gaussien"],
  },
};
// La description courte (Wikidata) désigne le SUJET de l'article : « mathématicien
// allemand » pour une personne, « théorème de mathématiques » pour un théorème.
// On s'y fie plutôt qu'au résumé, qui cite souvent « le mathématicien X qui… ».
const looksLikePerson = (j) => {
  const d = deaccent(j.description || "");
  return /(mathematicien|physicien|astronome|philosophe|informaticien|logicien|statisticien|savant)/.test(d);
};
async function resolveWikiConcept(type, name) {
  const cfg = WIKI_TYPES[type];
  if (!cfg) return false;
  const key = type + ":" + name;
  if (wikiCache.has(key)) return wikiCache.get(key);
  if (wikiTried.has(key)) return false;
  wikiTried.add(key);
  try {
    const query = cfg.query(name);
    const searchUrl = `https://fr.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
      query
    )}&limit=1&namespace=0&format=json&origin=*`;
    const sr = await fetch(searchUrl);
    if (!sr.ok) return false;
    const sj = await sr.json();
    const title = sj[1] && sj[1][0];
    if (!title) {
      wikiCache.set(key, false);
      persistWiki();
      return false;
    }
    const r = await fetch(
      `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      { headers: { accept: "application/json" } }
    );
    if (!r.ok) return false;
    const j = await r.json();
    const hay = deaccent((title || "") + " " + (j.description || "") + " " + (j.extract || ""));
    const kwOk = cfg.kw.length === 0 || cfg.kw.some((k) => hay.includes(k));
    const ok = j.type === "standard" && kwOk && !looksLikePerson(j);
    const val =
      ok && j.extract
        ? { extract: j.extract.trim(), url: (j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page) || "" }
        : false;
    wikiCache.set(key, val); // réponse définitive (article pertinent trouvé ou non)
    persistWiki();
    return val;
  } catch {
    /* réseau indisponible : on réessaiera plus tard */
  }
  return false;
}

/* ------------------------- helpers d'affichage ------------------------- */
const matchQ = (txt) => {
  const q = state.q.trim().toLowerCase();
  return !q || String(txt).toLowerCase().includes(q);
};

function role(m) {
  return FEMININE.has(m.id) ? "Mathématicienne" : "Mathématicien";
}
function personMeta(m) {
  const dates = [m.birth, m.death].filter(Boolean).join("–");
  const dom = (m.domains && m.domains[0]) || "";
  return [dates, dom].filter(Boolean).join(" · ");
}
function texSpan(latex, fallback) {
  if (!latex) return esc(fallback || "");
  return `<span class="tex" data-tex="${escAttr(latex)}" data-fallback="${escAttr(fallback || latex)}">${esc(
    fallback || latex
  )}</span>`;
}
function findDomainForTheorem(name) {
  const key = String(name || "").toLowerCase();
  const d = domains.find(
    (dom) => Array.isArray(dom.theorems) && dom.theorems.some((t) => t.toLowerCase().includes(key) || key.includes(t.toLowerCase()))
  );
  return d ? d.name : null;
}

/* =========================================================
   RENDU DES ÉCRANS
   ========================================================= */

function renderSommaire() {
  const groups = [
    ["∑", "Accueil", [["Vue générale", "home", {}]]],
    [
      "I.",
      "Explorer",
      [
        ["Mathématiciens", "explorer", { cat: "math" }],
        ["Domaines", "explorer", { cat: "dom" }],
        ["Théorèmes & formules", "explorer", { cat: "theo" }],
        ["Problèmes célèbres", "explorer", { cat: "prob" }],
        ["Bibliothèque", "explorer", { cat: "bib" }],
      ],
    ],
    [
      "II.",
      "Pratiquer",
      [
        ["Exercices", "pratiquer", { pratTab: "ex" }],
        ["Quiz", "pratiquer", { pratTab: "quiz" }],
        ["Progression", "pratiquer", { pratTab: "prog" }],
      ],
    ],
    ["III.", "Laboratoire", [["Visualiser & calculer", "labo", {}]]],
    [
      "IV.",
      "Histoire",
      [
        ["Chronologie", "histoire", { histTab: "chrono" }],
        ["Carte du monde", "histoire", { histTab: "carte" }],
      ],
    ],
  ];

  const groupHtml = groups
    .map(
      ([num, name, items]) => `
      <div>
        <div class="menu-group-title">
          <span class="num">${num}</span>
          <span class="name">${name}</span>
          <span class="fill"></span>
        </div>
        ${items
          .map(
            ([label, screen, patch]) => `
          <button class="menu-item" data-act="menu-go" data-screen="${screen}" data-patch="${escAttr(
              JSON.stringify(patch)
            )}">
            <span class="label">${label}</span>
            <span class="arrow">→</span>
          </button>`
          )
          .join("")}
      </div>`
    )
    .join("");

  return `
    <div class="sommaire-head">
      <h2>Sommaire</h2>
      <button class="icon-close" data-act="menu-toggle" aria-label="Fermer">×</button>
    </div>
    ${groupHtml}`;
}

function renderHome() {
  const dateLabel = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const daily = dailyItems.find((d) => /th[ée]or[èe]me/i.test(d.label)) || dailyItems[0];
  const dayIdx = Math.floor(Date.now() / 86400000);
  const quote = quotes[dayIdx % quotes.length];

  const dom = findDomainForTheorem(daily.title);
  const theo = theorems.find((t) => t.name && daily.title.toLowerCase().includes(t.name.toLowerCase()));
  const pills = [];
  if (dom) pills.push(`<span class="pill accent">${esc(dom)}</span>`);
  if (theo && theo.discoverer) pills.push(`<span class="pill">${esc(theo.discoverer)}</span>`);

  const totalFiches =
    mathematicians.length +
    domains.length +
    theorems.length +
    formulas.length +
    objects.length +
    problems.length +
    books.length +
    quotes.length +
    glossary.length +
    media.length;

  const universes = [
    ["I.", "Explorer", "Mathématiciens, domaines, théorèmes, formules, objets, problèmes, bibliothèque.", `${fmtNum(totalFiches)} fiches`, "explorer"],
    ["II.", "Pratiquer", "Exercices guidés, quiz, progression, ateliers.", `${exercises.length + quiz.length} activités`, "pratiquer"],
    ["III.", "Laboratoire", "Visualisations interactives et outils de calcul.", `${VISU_TOOLS.length + CALC_TOOLS.length + 1} outils`, "labo"],
    ["IV.", "Histoire", "Chronologie et carte du monde mathématique.", `${timelineItems.length + places.length} repères`, "histoire"],
  ];

  return `
    <div class="hero">
      <h2>Les mathématiques comme un réseau vivant.</h2>
      <p>${fmtNum(mathematicians.length)} fiches, ${fmtNum(theorems.length)} théorèmes, ${fmtNum(
    glossary.length
  )} définitions — reliés en quatre univers.</p>
    </div>

    <div class="section-rule">
      <span class="eyebrow-brick">Aujourd'hui</span>
      <span class="fill"></span>
      <span class="aside">${esc(dateLabel)}</span>
    </div>

    <div class="daily-card">
      <p class="kicker">${esc(daily.label)}</p>
      <h3>${esc(daily.title)}</h3>
      <p class="body">${esc(daily.text)}</p>
      ${pills.length ? `<div class="pill-row">${pills.join("")}</div>` : ""}
    </div>

    <blockquote class="quote">
      <p>« ${esc(quote.text)} »</p>
      <footer>${esc(quote.author)}${quote.theme ? " · " + esc(quote.theme) : ""}</footer>
    </blockquote>

    <div class="section-rule">
      <span class="eyebrow-brick">Quatre univers</span>
      <span class="fill"></span>
    </div>

    ${universes
      .map(
        ([num, name, desc, count, screen]) => `
      <button class="universe" data-act="nav" data-screen="${screen}">
        <span class="num">${num}</span>
        <span class="body">
          <span class="name">${name}</span>
          <span class="desc">${desc}</span>
        </span>
        <span class="count">${esc(count)}</span>
        <span class="arrow">→</span>
      </button>`
      )
      .join("")}`;
}

/* ------------------------- cartes de liste réutilisables ------------------------- */
const statusCls = (s) => (s === "Résolu" ? "solved" : s === "Actif" ? "active" : "open");

function personRow(m) {
  return `
    <div class="person-row">
      <button class="portrait-glyph" data-act="open" data-type="math" data-id="${escAttr(m.id)}">${esc(
    m.portrait || m.name.charAt(0)
  )}</button>
      <button class="info" data-act="open" data-type="math" data-id="${escAttr(m.id)}">
        <span class="name">${esc(m.name)}</span>
        <span class="meta">${esc(personMeta(m))}</span>
      </button>
      ${favStar("math", m.id)}
    </div>`;
}
function listCard(type, id, inner) {
  return `
    <div class="list-card open-card" data-act="open" data-type="${type}" data-id="${escAttr(id)}" role="button" tabindex="0">
      <div class="card-main">${inner}</div>
      ${favStar(type, id)}
    </div>`;
}
function theoremCard(t) {
  return listCard(
    "theo",
    t.name,
    `<h3>${esc(t.name)}</h3>
     <p class="formula-box">${texSpan(t.latex || t.statement, t.statement)}</p>
     <p class="desc">${t.discoverer ? "<strong>" + esc(t.discoverer) + "</strong> — " : ""}${esc(t.intuition || "")}</p>`
  );
}
function problemCard(p) {
  return listCard(
    "prob",
    p.name,
    `<div class="row-head"><h3>${esc(p.name)}</h3><span class="status-pill ${statusCls(p.status)}">${esc(
      p.status
    )}</span></div>
     <p>${esc(p.accessible || p.text || "")}</p>`
  );
}
function objectCard(o) {
  return listCard(
    "obj",
    o.name,
    `<div class="row-head"><h3>${esc(o.name)}</h3><span class="fam">${esc(
      [o.category, o.dimension].filter(Boolean).join(" · ")
    )}</span></div>
     <p>${esc(o.description || "")}</p>`
  );
}
function formulaCard(f) {
  return listCard(
    "form",
    f.name,
    `<div class="row-head"><h3>${esc(f.name)}</h3><span class="fam">${esc(f.category || "")}</span></div>
     <p class="formula-box">${texSpan(f.latex || f.expression, f.expression)}</p>
     <p class="desc">${esc(f.explanation || "")}</p>`
  );
}

const explorerChips = () =>
  CATS.map(
    ([k, label]) =>
      `<button class="chip${state.cat === k ? " active" : ""}" data-act="cat" data-cat="${k}">${label}</button>`
  ).join("");

// Recherche transversale à tous les types de contenu.
function renderAllSearch() {
  const q = state.q.trim();
  let count = "";
  let body = "";
  if (!q) {
    body = `<p class="empty-note">Rechercher dans toute l'encyclopédie : mathématiciens, théorèmes, formules, objets et problèmes. Saisissez un mot-clé ci-dessus.</p>`;
  } else {
    const groups = [
      ["Mathématiciens", "math", mathematicians.filter((m) => matchQ(m.name + " " + (m.domains || []).join(" "))), personRow],
      ["Théorèmes", "theo", theorems.filter((t) => matchQ(t.name + " " + (t.intuition || ""))), theoremCard],
      ["Formules", "form", formulas.filter((f) => matchQ(f.name + " " + (f.category || "") + " " + (f.explanation || ""))), formulaCard],
      ["Objets", "obj", objects.filter((o) => matchQ(o.name + " " + (o.category || "") + " " + (o.description || ""))), objectCard],
      ["Problèmes", "prob", problems.filter((p) => matchQ(p.name + " " + (p.text || ""))), problemCard],
    ];
    let total = 0;
    for (const [label, cat, list, render] of groups) {
      total += list.length;
      if (!list.length) continue;
      const more =
        list.length > 5
          ? `<button class="see-all" data-act="cat" data-cat="${cat}" data-keepq="1">voir les ${fmtNum(list.length)} →</button>`
          : "";
      body += `
        <div class="section-rule">
          <span class="eyebrow-brick">${esc(label)}</span>
          <span class="fill"></span>
          ${more || `<span class="aside">${list.length}</span>`}
        </div>
        ${list.slice(0, 5).map(render).join("")}`;
    }
    count = `${fmtNum(total)} résultat${total > 1 ? "s" : ""} pour « ${esc(q)} »`;
    if (!total) body = `<p class="empty-note">Aucun résultat pour « ${esc(q)} ».</p>`;
  }
  return `
    <input class="search-input" id="search" type="search" aria-label="Recherche globale" placeholder="Rechercher dans l'encyclopédie…" value="${escAttr(
      state.q
    )}" />
    <div class="chip-row wrap">${explorerChips()}</div>
    <p class="count-label" aria-live="polite">${esc(count)}</p>
    ${body}`;
}

function renderExplorerList() {
  if (state.cat === "bib" && state.bibCol) return renderBiblioCollection();
  if (state.cat === "fav") return renderCollection();
  if (state.cat === "all") return renderAllSearch();

  const chips = explorerChips();

  let count = "";
  let body = "";

  if (state.cat === "math") {
    const list = mathematicians.filter((m) => matchQ(m.name + " " + (m.domains || []).join(" ")));
    count = `${fmtNum(list.length)} fiche${list.length > 1 ? "s" : ""} sur ${fmtNum(mathematicians.length)}`;
    body = list.slice(0, 80).map(personRow).join("");
    if (list.length > 80) body += `<p class="count-label">Affiner la recherche pour voir les ${fmtNum(list.length - 80)} autres fiches.</p>`;
  } else if (state.cat === "dom") {
    const list = domains.filter((d) => matchQ(d.name + " " + (d.intro || "")));
    count = `${list.length} domaine${list.length > 1 ? "s" : ""}`;
    body = list
      .map(
        (d) => `
      <div class="domain-row">
        <div class="row-head">
          <h3>${esc(d.name)}</h3>
          <span class="fam">${esc(d.family || "")}</span>
        </div>
        <p>${esc(d.intro || "")}</p>
      </div>`
      )
      .join("");
  } else if (state.cat === "theo") {
    const list = theorems.filter((t) => matchQ(t.name + " " + (t.intuition || "")));
    count = `${fmtNum(list.length)} théorème${list.length > 1 ? "s" : ""}`;
    body = list.slice(0, 60).map(theoremCard).join("");
    if (list.length > 60) body += `<p class="count-label">Affiner la recherche pour voir les ${fmtNum(list.length - 60)} autres théorèmes.</p>`;
  } else if (state.cat === "form") {
    const list = formulas.filter((f) => matchQ(f.name + " " + (f.category || "") + " " + (f.explanation || "")));
    count = `${fmtNum(list.length)} formule${list.length > 1 ? "s" : ""}`;
    body = list.slice(0, 60).map(formulaCard).join("");
    if (list.length > 60) body += `<p class="count-label">Affiner la recherche pour voir les ${fmtNum(list.length - 60)} autres formules.</p>`;
  } else if (state.cat === "obj") {
    const list = objects.filter((o) => matchQ(o.name + " " + (o.category || "") + " " + (o.description || "")));
    count = `${list.length} objet${list.length > 1 ? "s" : ""}`;
    body = list.map(objectCard).join("");
  } else if (state.cat === "prob") {
    const list = problems.filter((p) => matchQ(p.name + " " + (p.text || "")));
    count = `${list.length} problème${list.length > 1 ? "s" : ""} célèbre${list.length > 1 ? "s" : ""}`;
    body = list.map(problemCard).join("");
  } else if (state.cat === "bib") {
    count = `${BIBLIO.length} collections`;
    body = BIBLIO.map(
      ([col, num, name, desc, n]) => `
      <button class="biblio-row" data-act="bib" data-col="${col}">
        <span class="num">${num}</span>
        <span class="body">
          <span class="name">${name}</span>
          <span class="desc">${desc}</span>
        </span>
        <span class="count">${fmtNum(n)}</span>
      </button>`
    ).join("");
  }

  return `
    <input class="search-input" id="search" type="search" aria-label="Recherche" placeholder="Rechercher dans l'encyclopédie…" value="${escAttr(
      state.q
    )}" />
    <div class="chip-row wrap">${chips}</div>
    <p class="count-label" aria-live="polite">${esc(count)}</p>
    ${body}`;
}

function renderCollection() {
  const chips = explorerChips();

  const groups = [
    ["math", "Mathématiciens", (id) => mathById.get(id), personRow],
    ["theo", "Théorèmes", (id) => theoByName.get(id), theoremCard],
    ["form", "Formules", (id) => formByName.get(id), formulaCard],
    ["obj", "Objets", (id) => objByName.get(id), objectCard],
    ["prob", "Problèmes", (id) => probByName.get(id), problemCard],
  ];

  let total = 0;
  let sections = "";
  for (const [type, label, resolve, render] of groups) {
    const items = Object.keys(favs)
      .filter((k) => favs[k] && k.startsWith(type + ":"))
      .map((k) => resolve(k.slice(type.length + 1)))
      .filter((it) => it && matchQ(it.name));
    if (!items.length) continue;
    total += items.length;
    sections += `
      <div class="section-rule">
        <span class="eyebrow-brick">${esc(label)}</span>
        <span class="fill"></span>
        <span class="aside">${items.length}</span>
      </div>
      ${items.map(render).join("")}`;
  }

  const body = total
    ? sections
    : `<p class="empty-note">Votre collection est vide. Touchez l'étoile ☆ d'une fiche pour l'ajouter.</p>`;

  return `
    <input class="search-input" id="search" type="search" placeholder="Rechercher dans ma collection…" value="${escAttr(
      state.q
    )}" />
    <div class="chip-row wrap">${chips}</div>
    <p class="count-label">${favCount()} favori${favCount() > 1 ? "s" : ""}</p>
    ${body}`;
}

function renderBiblioCollection() {
  const meta = BIBLIO.find((b) => b[0] === state.bibCol);
  let list = [];
  let rowHtml = "";

  if (state.bibCol === "quotes") {
    list = quotes.filter((x) => matchQ(x.text + " " + x.author));
    rowHtml = list
      .slice(0, 80)
      .map(
        (x) => `
      <div class="entry-row">
        <p style="font-family:var(--serif);font-style:italic;font-size:15px;margin:0;color:var(--ink)">« ${esc(x.text)} »</p>
        <div class="row-head" style="margin-top:6px">
          <span class="meta">${esc(x.author)}</span>
          <span class="meta">${esc(x.period || x.theme || "")}</span>
        </div>
      </div>`
      )
      .join("");
  } else if (state.bibCol === "books") {
    list = books.filter((x) => matchQ(x.title + " " + x.author));
    rowHtml = list
      .slice(0, 80)
      .map(
        (x) => `
      <div class="entry-row">
        <div class="row-head">
          <h3>${esc(x.title)}</h3>
          <span class="meta">${esc(x.level || "")}</span>
        </div>
        <p><strong>${esc(x.author)}</strong>${x.category ? " · " + esc(x.category) : ""} — ${esc(x.description || "")}</p>
      </div>`
      )
      .join("");
  } else if (state.bibCol === "glossary") {
    list = glossary.filter((x) => matchQ(x.term + " " + x.definition));
    rowHtml = list
      .slice(0, 80)
      .map(
        (x) => `
      <div class="entry-row">
        <h3>${esc(x.term)}</h3>
        <p>${esc(x.definition)}</p>
        ${
          Array.isArray(x.links) && x.links.length
            ? `<div class="pill-row">${x.links.map((l) => `<span class="pill">${esc(l)}</span>`).join("")}</div>`
            : ""
        }
      </div>`
      )
      .join("");
  } else if (state.bibCol === "media") {
    list = media.filter((x) => matchQ(x.title + " " + (x.description || "")));
    rowHtml = list
      .slice(0, 80)
      .map(
        (x) => `
      <div class="entry-row">
        <div class="row-head">
          <h3>${esc(x.title)}</h3>
          <span class="meta">${esc(x.type || "")}</span>
        </div>
        <p>${esc(x.description || "")}</p>
        <p class="count-label">${esc(x.source || "")}${x.license ? " · " + esc(x.license) : ""}</p>
      </div>`
      )
      .join("");
  }

  const shown = Math.min(list.length, 80);
  return `
    <button class="back-link" data-act="bib-back">← Bibliothèque</button>
    <input class="search-input" id="search" type="search" placeholder="Rechercher dans « ${escAttr(
      meta[2]
    )} »…" value="${escAttr(state.q)}" />
    <p class="count-label">${fmtNum(list.length)} entrée${list.length > 1 ? "s" : ""}${
    list.length > shown ? ` · ${shown} affichées` : ""
  }</p>
    ${rowHtml || `<p class="empty-note">Aucun résultat.</p>`}`;
}

function renderPortraitFrame(m) {
  const glyph = esc(m.portrait || m.name.charAt(0));
  const info = portraitMediaByMath.get(m.id);
  const cached = wikiCache.get(m.id); // { img, extract, url } | false | undefined
  const img = cached && cached.img;

  if (img) {
    // Portrait réel : attribution vers la source curatée si connue, sinon la page Wikipédia.
    const href = (info && info.sourceUrl) || (cached && cached.url) || "";
    const label = (info && info.source) || "Wikimedia Commons";
    const attribution = href
      ? `<a href="${escAttr(href)}" target="_blank" rel="noopener">${esc(label)}</a>`
      : esc(label);
    return `
    <figure class="portrait-frame has-img" data-mid="${escAttr(m.id)}">
      <img class="portrait-img" src="${escAttr(img)}" alt="Portrait de ${escAttr(m.name)}" />
      <span class="glyph">${glyph}</span>
      <figcaption class="cap">portrait — ${attribution}</figcaption>
    </figure>`;
  }

  // Aucun portrait : on illustre par le drapeau de la nationalité (émoji libre,
  // hors-ligne). Tant que Wikipédia n'a pas répondu, on marque pour hydratation
  // afin de tenter un portrait réel pour tout mathématicien.
  const hydrate = cached === undefined ? ` data-hydrate="1"` : "";
  const nat = esc(m.nationality || "Nationalité inconnue");
  return `
    <figure class="portrait-frame is-flag" data-mid="${escAttr(m.id)}"${hydrate}>
      <span class="flag" role="img" aria-label="Drapeau — ${nat}">${flagFor(m)}</span>
      <span class="glyph">${glyph}</span>
      <figcaption class="cap">illustration d'après la nationalité — ${nat}</figcaption>
    </figure>`;
}

// Biographie réelle (résumé Wikipédia) quand disponible, avec attribution CC BY-SA.
function renderMathBio(m) {
  const cached = wikiCache.get(m.id);
  if (cached && cached.extract) {
    const link = cached.url
      ? ` <a class="bio-src" href="${escAttr(cached.url)}" target="_blank" rel="noopener">Source : Wikipédia</a>`
      : "";
    return `<p class="detail-bio">${esc(cached.extract)}${link}</p>`;
  }
  return `<p class="detail-bio">${esc(m.biography || "")}</p>`;
}

function hydratePortraits() {
  const frame = screenEl.querySelector(".portrait-frame[data-hydrate]");
  if (!frame) return;
  const id = frame.dataset.mid;
  resolveWiki(id).then((data) => {
    // Redessiner si l'on regarde toujours la même fiche et qu'une donnée a été trouvée.
    if (data && state.screen === "explorer" && state.open && state.open.type === "math" && state.open.id === id) render();
  });
}

function hydrateConceptWiki() {
  const el = screenEl.querySelector(".wiki-hydrate[data-wt]");
  if (!el) return;
  const type = el.dataset.wt;
  const name = el.dataset.wn;
  resolveWikiConcept(type, name).then((data) => {
    const o = state.open;
    if (data && state.screen === "explorer" && o && o.type === type && o.id === name) render();
  });
}
// Rubrique « Présentation » (résumé Wikipédia réel) réutilisable par type de fiche.
function wikiSection(type, name) {
  const w = wikiCache.get(type + ":" + name);
  if (w && w.extract) {
    const link = w.url
      ? ` <a class="bio-src" href="${escAttr(w.url)}" target="_blank" rel="noopener">Source : Wikipédia</a>`
      : "";
    return section("Présentation", `<p>${esc(w.extract)}${link}</p>`);
  }
  return "";
}
function wikiMarker(type, name) {
  return wikiCache.get(type + ":" + name) === undefined
    ? `<span class="wiki-hydrate" data-wt="${type}" data-wn="${escAttr(name)}" hidden></span>`
    : "";
}

/* ------------------------- fiches détail : helpers ------------------------- */
function detailBack(label = "← Explorer") {
  return `<button class="back-link" data-act="close-detail">${esc(label)}</button>`;
}
function detailFav(type, id) {
  const on = isFav(type, id);
  return `<button class="fav-button${on ? " on" : ""}" data-act="detail-fav" data-type="${type}" data-id="${escAttr(
    id
  )}">${on ? "★ Dans ma collection" : "☆ Ajouter à ma collection"}</button>`;
}
const paras = (text) => (text ? `<p>${esc(text)}</p>` : "");
const bullets = (arr) =>
  Array.isArray(arr) && arr.length ? `<ul class="detail-list">${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
const textOrList = (v) => (Array.isArray(v) ? bullets(v) : paras(v));
const pills = (arr) =>
  Array.isArray(arr) && arr.length ? `<div class="pill-row">${arr.map((x) => `<span class="pill">${esc(x)}</span>`).join("")}</div>` : "";
function section(title, html) {
  return html ? `<div class="detail-section"><h4>${esc(title)}</h4>${html}</div>` : "";
}
const emptyDetailNote = `<p class="empty-note">Fiche de référence — description détaillée à enrichir.</p>`;

function renderDetail() {
  const o = state.open;
  if (!o) return renderExplorerList();
  switch (o.type) {
    case "math":
      return renderMathDetail(o.id);
    case "theo":
      return renderTheoremDetail(o.id);
    case "prob":
      return renderProblemDetail(o.id);
    case "obj":
      return renderObjectDetail(o.id);
    case "form":
      return renderFormulaDetail(o.id);
    default:
      return renderExplorerList();
  }
}

function renderMathDetail(id) {
  const m = mathById.get(id);
  if (!m) return renderExplorerList();
  if (!progress.viewed.includes(m.id)) {
    progress.viewed.push(m.id);
    saveProgress();
  }
  const dates = [m.birth, m.death].filter(Boolean).join("–");
  const linked = (theoremsByMath.get(m.id) || []).join(", ");
  return `
    ${detailBack()}
    <p class="detail-role">${esc(role(m))} · ${esc(dates)}</p>
    <h2 class="detail-name">${esc(m.name)}</h2>
    ${renderPortraitFrame(m)}
    ${renderMathBio(m)}
    <dl class="detail-dl">
      <dt>Nationalité</dt><dd>${esc(m.nationality || "—")}</dd>
      <dt>Domaines</dt><dd>${esc((m.domains || []).join(", ") || "—")}</dd>
      <dt>Associé à</dt><dd>${esc(linked || "—")}</dd>
    </dl>
    ${detailFav("math", m.id)}`;
}

function renderTheoremDetail(id) {
  const t = theoByName.get(id);
  if (!t) return renderExplorerList();
  const sections =
    wikiSection("theo", t.name) +
    section("Énoncé", t.latex && t.statement && t.statement !== t.latex ? paras(scrub(t.statement)) : "") +
    section("Intuition", paras(scrub(t.intuition))) +
    section("Démonstration", textOrList(scrub(t.proof))) +
    section("Variantes", textOrList(scrub(t.variants))) +
    section("Généralisation", textOrList(scrub(t.generalization))) +
    section("Applications", textOrList(scrub(t.applications))) +
    section("Histoire", paras(scrub(t.history))) +
    section("Exercices liés", bullets(scrub(t.exercises))) +
    section("Références", bullets(scrub(t.references)));
  return `
    ${detailBack()}
    <p class="detail-role">Théorème${t.discoverer ? " · " + esc(t.discoverer) : ""}</p>
    <h2 class="detail-name">${esc(t.name)}</h2>
    <div class="formula-hero">${texSpan(t.latex || t.statement, t.statement)}</div>
    ${sections || emptyDetailNote}
    ${wikiMarker("theo", t.name)}
    ${detailFav("theo", t.name)}`;
}

function renderProblemDetail(id) {
  const p = probByName.get(id);
  if (!p) return renderExplorerList();
  const tags = [p.difficulty, p.period].filter(Boolean);
  const sections =
    wikiSection("prob", p.name) +
    section("En bref", paras(scrub(p.accessible))) +
    section("Énoncé", paras(scrub(p.text))) +
    section("Histoire", paras(scrub(p.history))) +
    section("État actuel", paras(scrub(p.current))) +
    section("Avancées", textOrList(scrub(p.advances))) +
    section("Avancées récentes", textOrList(scrub(p.recent))) +
    section("Impact", paras(scrub(p.impact))) +
    section("Références", bullets(scrub(p.references)));
  return `
    ${detailBack()}
    <p class="detail-role">Problème${p.category ? " · " + esc(p.category) : ""}${p.domain ? " · " + esc(p.domain) : ""}</p>
    <h2 class="detail-name">${esc(p.name)}</h2>
    <div class="pill-row">
      <span class="status-pill ${statusCls(p.status)}">${esc(p.status)}</span>
      ${tags.map((x) => `<span class="pill">${esc(x)}</span>`).join("")}
    </div>
    ${sections || emptyDetailNote}
    ${wikiMarker("prob", p.name)}
    ${detailFav("prob", p.name)}`;
}

function renderObjectDetail(id) {
  const o = objByName.get(id);
  if (!o) return renderExplorerList();
  const sections =
    wikiSection("obj", o.name) +
    section("Description", paras(scrub(o.description))) +
    section("Histoire", paras(scrub(o.history))) +
    section("Propriétés", bullets(scrub(o.properties))) +
    section("Applications", textOrList(scrub(o.applications))) +
    section("Visualisation", paras(scrub(o.visualization))) +
    section("Objets liés", pills(o.related));
  return `
    ${detailBack()}
    <p class="detail-role">Objet${[o.category, o.dimension].filter(Boolean).length ? " · " + esc([o.category, o.dimension].filter(Boolean).join(" · ")) : ""}</p>
    <h2 class="detail-name">${esc(o.name)}</h2>
    ${o.formula ? `<div class="formula-hero">${texSpan(o.formula, o.formula)}</div>` : ""}
    ${sections || emptyDetailNote}
    ${wikiMarker("obj", o.name)}
    ${detailFav("obj", o.name)}`;
}

function renderFormulaDetail(id) {
  const f = formByName.get(id);
  if (!f) return renderExplorerList();
  return `
    ${detailBack()}
    <p class="detail-role">Formule${f.category ? " · " + esc(f.category) : ""}</p>
    <h2 class="detail-name">${esc(f.name)}</h2>
    <div class="formula-hero">${texSpan(f.latex || f.expression, f.expression)}</div>
    ${wikiSection("form", f.name) +
    section("Explication", paras(scrub(f.explanation))) +
    section("Exemples", bullets(scrub(f.examples))) +
    section("Démonstration", textOrList(scrub(f.proof))) +
    section("Usages", bullets(scrub(f.uses))) || emptyDetailNote}
    ${wikiMarker("form", f.name)}
    ${detailFav("form", f.name)}`;
}

function renderExerciseDetail(id) {
  const e = exById.get(id);
  if (!e) return renderPratiquer();
  const done = (progress.done || []).includes(e.id);
  const d = DIFF_DOTS[e.difficulty] || 1;
  const dots = "●".repeat(d) + "○".repeat(3 - d);
  return `
    ${detailBack("← Pratiquer")}
    <p class="detail-role">Exercice · ${esc([e.domain, e.level].filter(Boolean).join(" · "))}</p>
    <h2 class="detail-name">${esc(e.prompt || e.title || "Exercice")}</h2>
    <div class="pill-row">
      <span class="pill">${esc(e.difficulty || "")} <span class="dots">${dots}</span></span>
      ${e.time ? `<span class="pill">${esc(e.time)}</span>` : ""}
      ${e.type ? `<span class="pill">${esc(e.type)}</span>` : ""}
    </div>
    ${section("Indice", paras(scrub(e.hint)))}
    ${section("Correction", paras(scrub(e.correction)))}
    ${section("Solution détaillée", paras(scrub(e.detailedSolution || e.solution)))}
    ${section("Démonstration", paras(scrub(e.proof)))}
    ${section("Références", bullets(scrub(e.references)))}
    <button class="fav-button${done ? " on" : ""}" data-act="ex-done" data-id="${escAttr(e.id)}">${
    done ? "✓ Exercice réalisé" : "Marquer comme réalisé"
  }</button>`;
}

function renderPratiquer() {
  const tabs = PRAT_TABS.map(
    ([k, label]) =>
      `<button class="${state.pratTab === k ? "active" : ""}" data-act="prat" data-tab="${k}">${label}</button>`
  ).join("");

  let body = "";
  if (state.pratTab === "ex") body = renderExercises();
  else if (state.pratTab === "quiz") body = renderQuiz();
  else body = renderProgression();

  const ateliers = `
    <div class="section-rule">
      <span class="eyebrow-brick">Ateliers</span>
      <span class="fill"></span>
    </div>
    <div class="atelier-grid">
      <div class="atelier">
        <h3>Enseignant</h3>
        <p>Générer une fiche de cours imprimable par domaine et niveau.</p>
      </div>
      <div class="atelier">
        <h3>Étudiant</h3>
        <p>Flashcards et fiches de synthèse par objectif.</p>
      </div>
    </div>`;

  return `<div class="segmented" style="grid-template-columns:repeat(3,1fr)">${tabs}</div>${body}${ateliers}`;
}

function renderExercises() {
  const chips = LEVELS.map(
    (l) =>
      `<button class="chip small level${state.lvl === l ? " active" : ""}" data-act="lvl" data-lvl="${escAttr(
        l
      )}">${l}</button>`
  ).join("");
  const list = exercises.filter((e) => state.lvl === "Tous" || e.level === state.lvl);
  const rows = list
    .slice(0, 60)
    .map((e) => {
      const d = DIFF_DOTS[e.difficulty] || 1;
      const dots = "●".repeat(d) + "○".repeat(3 - d);
      const title = e.prompt || e.title || "Exercice";
      const done = (progress.done || []).includes(e.id);
      return `
      <button class="exercise-row" data-act="open" data-type="ex" data-id="${escAttr(e.id)}">
        <span class="info">
          <span class="title">${done ? "✓ " : ""}${esc(title)}</span>
          <span class="meta">${esc([e.level, e.domain, e.time].filter(Boolean).join(" · "))}</span>
        </span>
        <span class="dots">${dots}</span>
      </button>`;
    })
    .join("");
  return `<div class="chip-row scroll">${chips}</div>${rows}`;
}

function renderQuiz() {
  const total = quiz.length;
  const item = quiz[state.quizIdx % total];
  const answered = state.quizPick != null;
  const answers = item.options
    .map((text, i) => {
      let cls = "";
      if (answered) {
        if (i === item.correct) cls = "correct";
        else if (i === state.quizPick) cls = "wrong";
        else cls = "dim";
      }
      return `<button class="${cls}" data-act="quiz-pick" data-i="${i}">${esc(text)}</button>`;
    })
    .join("");

  return `
    <div class="quiz-card">
      <p class="progress">Question ${state.quizIdx + 1} / ${total} · mode ${esc(item.mode || "libre").toLowerCase()}</p>
      <h3>${esc(item.question)}</h3>
      <div class="quiz-answers">${answers}</div>
      ${
        answered
          ? `<p class="quiz-expl">${esc(item.explanation || "")}</p>
             <button class="quiz-next" data-act="quiz-next">Question suivante →</button>`
          : ""
      }
    </div>`;
}

function renderProgression() {
  const stats = [
    [progress.days.length, "jours actifs"],
    [progress.correctQuiz, "quiz réussis"],
    [currentStreak(), "série (jours)"],
  ];

  // Signal par domaine : favoris mathématiciens (via domaines des fiches) + quiz réussis.
  const score = {};
  Object.entries(favs).forEach(([key, on]) => {
    if (!on || !key.startsWith("math:")) return;
    const m = mathById.get(key.slice(5));
    (m?.domains || []).forEach((d) => (score[d] = (score[d] || 0) + 2));
  });
  Object.entries(progress.quizByDomain).forEach(([d, n]) => (score[d] = (score[d] || 0) + n * 2));

  const baseDomains = ["Algèbre", "Géométrie", "Analyse", "Probabilités"];
  baseDomains.forEach((d) => (score[d] = score[d] || 0));
  const bars = Object.entries(score)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, s]) => {
      const pct = Math.min(100, s * 12);
      return `
      <div>
        <div class="bar-head"><span class="name">${esc(name)}</span><span class="pct">${pct} %</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      </div>`;
    })
    .join("");

  const domainsTouched = Object.values(score).filter((s) => s > 0).length;
  const anyActivity = progress.viewed.length > 0 || progress.correctQuiz > 0 || favCount() > 0;
  const badgeDefs = [
    ["Premier pas", "Premier contenu exploré", anyActivity],
    ["Série de 7 jours", "Une semaine de régularité", currentStreak() >= 7],
    ["Explorateur", "50 fiches consultées", progress.viewed.length >= 50],
    ["Polyvalence", "Actif dans 4 domaines", domainsTouched >= 4],
  ];
  const badges = badgeDefs
    .map(
      ([name, desc, on]) => `
      <div class="badge${on ? " on" : ""}">
        <strong>${name}</strong>
        <span>${desc}</span>
      </div>`
    )
    .join("");

  return `
    <div class="stat-grid">
      ${stats
        .map(([n, l]) => `<div class="stat-cell"><strong>${n}</strong><span>${l}</span></div>`)
        .join("")}
    </div>
    <div class="bars">${bars}</div>
    <div class="badge-grid">${badges}</div>`;
}

function renderLabo() {
  if (state.labTool) return renderLabTool();
  if (state.calcTool) return renderCalcTool();

  const tools = VISU_TOOLS.map(
    ([key, glyph, name, desc]) => `
    <button class="tool-card" data-act="lab-tool" data-tool="${key}">
      <div class="thumb">${esc(glyph)}</div>
      <div class="cap"><strong>${esc(name)}</strong><span>${esc(desc)}</span></div>
    </button>`
  ).join("");

  const calc = CALC_TOOLS.map(
    ([key, name, desc]) => `
    <button class="calc-row" data-act="calc-tool" data-tool="${key}">
      <span class="info"><span class="name">${esc(name)}</span><span class="desc">${esc(desc)}</span></span>
      <span class="arrow">→</span>
    </button>`
  ).join("");

  return `
    <div class="section-rule">
      <span class="eyebrow-brick">Visualiser</span>
      <span class="fill"></span>
    </div>
    <div class="tool-grid">${tools}</div>

    <div class="section-rule">
      <span class="eyebrow-brick">Calculer</span>
      <span class="fill"></span>
    </div>

    <div class="solver">
      <h3>Équation du second degré</h3>
      <p class="eq">ax² + bx + c = 0</p>
      <div class="coef-grid">
        <label>a<input id="eqA" inputmode="decimal" value="${escAttr(state.a)}" /></label>
        <label>b<input id="eqB" inputmode="decimal" value="${escAttr(state.b)}" /></label>
        <label>c<input id="eqC" inputmode="decimal" value="${escAttr(state.c)}" /></label>
      </div>
      <p class="solver-result" id="eqResult">${esc(solveQuadratic())}</p>
    </div>

    ${calc}`;
}

/* =========================================================
   OUTILS INTERACTIFS DU LABORATOIRE (canvas, sans dépendance)
   ========================================================= */
const LAB_META = {
  graph: ["Grapheur", "Tracer une fonction y = f(x). Molette pour zoomer, glisser pour déplacer."],
  geo: ["Géométrie dynamique", "Déplacer les sommets du triangle ; longueurs et angles se recalculent."],
  poly: ["Polyèdres 3D", "Solides en fil de fer ; glisser pour tourner, rotation automatique sinon."],
  fractal: ["Ensemble de Mandelbrot", "Cliquer pour zoomer, clic droit pour reculer."],
};

function renderLabTool() {
  const [title, hint] = LAB_META[state.labTool] || ["Outil", ""];
  let controls = "";
  if (state.labTool === "graph") {
    controls = `
      <div class="lab-controls">
        <label class="lab-field">f(x) =
          <input id="graphFn" type="text" value="${escAttr(state.graphFn || "sin(x) * x / 3")}" spellcheck="false" />
        </label>
        <div class="lab-presets">
          ${["sin(x)", "x^2/4", "cos(x)+x/4", "1/x", "exp(-x*x)", "abs(x)-2"]
            .map((f) => `<button class="chip small" data-act="graph-preset" data-fn="${escAttr(f)}">${esc(f)}</button>`)
            .join("")}
        </div>
        <p class="lab-msg" id="graphMsg"></p>
      </div>`;
  } else if (state.labTool === "poly") {
    controls = `
      <div class="lab-presets">
        ${[["tetra", "Tétraèdre"], ["cube", "Cube"], ["octa", "Octaèdre"]]
          .map(
            ([k, l]) =>
              `<button class="chip small${(state.polySolid || "cube") === k ? " active" : ""}" data-act="poly-solid" data-solid="${k}">${l}</button>`
          )
          .join("")}
      </div>`;
  } else if (state.labTool === "geo") {
    controls = `<p class="lab-readout" id="geoReadout"></p>`;
  } else if (state.labTool === "fractal") {
    controls = `<p class="lab-readout" id="fracReadout"></p>`;
  }

  return `
    <button class="back-link" data-act="lab-back">← Laboratoire</button>
    <h2 class="lab-title">${esc(title)}</h2>
    <p class="lab-hint">${esc(hint)}</p>
    <div class="lab-stage" id="labToolHost">
      <canvas id="labCanvas"></canvas>
    </div>
    ${controls}`;
}

// Analyseur d'expression sûr (shunting-yard) : chiffres, x, opérateurs et
// fonctions usuelles uniquement. Retourne une fonction (x) => nombre.
function compileExpr(src) {
  const fns = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos,
    atan: Math.atan, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    exp: Math.exp, log: Math.log, ln: Math.log, log10: Math.log10, sqrt: Math.sqrt,
    abs: Math.abs, sign: Math.sign, floor: Math.floor, ceil: Math.ceil, round: Math.round,
  };
  const consts = { pi: Math.PI, e: Math.E };
  const tokens = [];
  const re = /\s*([A-Za-z_]\w*|\d+\.?\d*|\.\d+|\*\*|[-+*/^(),])/g;
  let m;
  let pos = 0;
  while ((m = re.exec(src)) !== null) {
    if (m.index !== pos) throw new Error("Caractère invalide");
    pos = re.lastIndex;
    tokens.push(m[1] === "**" ? "^" : m[1]);
  }
  if (src.slice(pos).trim() !== "") throw new Error("Expression incomplète");

  const prec = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 3, u: 4 };
  const out = [];
  const ops = [];
  const isNum = (t) => /^(\d|\.)/.test(t);
  const isName = (t) => /^[A-Za-z_]/.test(t);
  let prev = null;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (isNum(t)) out.push({ n: parseFloat(t) });
    else if (isName(t)) {
      if (t === "x" || t === "n") out.push({ x: 1 });
      else if (t in consts) out.push({ n: consts[t] });
      else if (t in fns) ops.push({ f: t });
      else throw new Error("Inconnu : " + t);
    } else if (t === ",") {
      while (ops.length && ops[ops.length - 1] !== "(") out.push(ops.pop());
    } else if (t === "(") ops.push("(");
    else if (t === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") out.push(ops.pop());
      if (ops.pop() !== "(") throw new Error("Parenthèses");
      if (ops.length && ops[ops.length - 1] && ops[ops.length - 1].f) out.push(ops.pop());
    } else {
      // opérateur
      let op = t;
      const unary = op === "-" && (prev === null || prev === "(" || prev === "," || prev in prec);
      if (unary) op = "u";
      while (
        ops.length &&
        ops[ops.length - 1] !== "(" &&
        (ops[ops.length - 1].f ||
          prec[ops[ops.length - 1]] > prec[op] ||
          (prec[ops[ops.length - 1]] === prec[op] && op !== "^" && op !== "u"))
      )
        out.push(ops.pop());
      ops.push(op);
    }
    prev = t;
  }
  while (ops.length) {
    const o = ops.pop();
    if (o === "(") throw new Error("Parenthèses");
    out.push(o);
  }

  return (x) => {
    const st = [];
    for (const tok of out) {
      if (typeof tok === "object" && "n" in tok) st.push(tok.n);
      else if (typeof tok === "object" && "x" in tok) st.push(x);
      else if (typeof tok === "object" && tok.f) st.push(fns[tok.f](st.pop()));
      else if (tok === "u") st.push(-st.pop());
      else {
        const b = st.pop();
        const a = st.pop();
        st.push(tok === "+" ? a + b : tok === "-" ? a - b : tok === "*" ? a * b : tok === "/" ? a / b : Math.pow(a, b));
      }
    }
    return st.pop();
  };
}

function setupCanvas(host) {
  const canvas = host.querySelector("#labCanvas");
  const w = Math.max(240, host.clientWidth || 320);
  const h = Math.round(Math.min(w, 420));
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return { canvas, ctx, w, h };
}

function css(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#211f1a";
}

function mountGrapher(host) {
  const { canvas, ctx, w, h } = setupCanvas(host);
  const msg = document.getElementById("graphMsg");
  const view = { cx: 0, cy: 0, scale: 40 }; // pixels par unité
  let fn = null;

  const ink = css("--ink");
  const line = css("--line");
  const faint = css("--line-2");
  const accent = css("--accent");

  function compile() {
    try {
      fn = compileExpr(state.graphFn || "sin(x) * x / 3");
      if (msg) {
        msg.textContent = "";
        msg.classList.remove("err");
      }
    } catch (e) {
      fn = null;
      if (msg) {
        msg.textContent = "Expression invalide : " + e.message;
        msg.classList.add("err");
      }
    }
  }

  const toPx = (x, y) => [w / 2 + (x - view.cx) * view.scale, h / 2 - (y - view.cy) * view.scale];
  const toX = (px) => view.cx + (px - w / 2) / view.scale;

  function niceStep(unitPx) {
    const raw = 60 / unitPx; // ~60px entre graduations
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / pow;
    const step = (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * pow;
    return step;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = css("--card");
    ctx.fillRect(0, 0, w, h);

    const step = niceStep(view.scale);
    // grille
    ctx.lineWidth = 1;
    ctx.font = "11px Public Sans, sans-serif";
    ctx.fillStyle = css("--ink-3");
    const x0 = Math.ceil(toX(0) / step) * step;
    for (let x = x0; x <= toX(w); x += step) {
      const [px] = toPx(x, 0);
      ctx.strokeStyle = Math.abs(x) < 1e-9 ? line : faint;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
      if (Math.abs(x) > 1e-9) ctx.fillText(fmtDec(x), px + 2, h / 2 + 12);
    }
    const yTop = view.cy + (h / 2) / view.scale;
    const y0 = Math.ceil((yTop - h / view.scale) / step) * step;
    for (let y = y0; y <= yTop; y += step) {
      const [, py] = toPx(0, y);
      ctx.strokeStyle = Math.abs(y) < 1e-9 ? line : faint;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
      if (Math.abs(y) > 1e-9) ctx.fillText(fmtDec(y), w / 2 + 3, py - 3);
    }

    if (!fn) return;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let pen = false;
    for (let px = 0; px <= w; px++) {
      const x = toX(px);
      const y = fn(x);
      if (!Number.isFinite(y)) {
        pen = false;
        continue;
      }
      const [, py] = toPx(x, y);
      if (py < -1e4 || py > 1e4) {
        pen = false;
        continue;
      }
      if (pen) ctx.lineTo(px, py);
      else {
        ctx.moveTo(px, py);
        pen = true;
      }
    }
    ctx.stroke();
  }

  compile();
  draw();

  const onInput = (e) => {
    if (e.target.id !== "graphFn") return;
    state.graphFn = e.target.value;
    compile();
    draw();
  };
  host.ownerDocument.addEventListener("input", onInput);

  let drag = null;
  const onDown = (e) => {
    drag = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    if (!drag) return;
    view.cx -= (e.clientX - drag.x) / view.scale;
    view.cy += (e.clientY - drag.y) / view.scale;
    drag = { x: e.clientX, y: e.clientY };
    draw();
  };
  const onUp = () => (drag = null);
  const onWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    view.scale = Math.max(4, Math.min(4000, view.scale * factor));
    draw();
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  return () => {
    host.ownerDocument.removeEventListener("input", onInput);
  };
}

function mountGeometry(host) {
  const { canvas, ctx, w, h } = setupCanvas(host);
  const readout = document.getElementById("geoReadout");
  const pts = [
    { x: w * 0.25, y: h * 0.7 },
    { x: w * 0.72, y: h * 0.68 },
    { x: w * 0.52, y: h * 0.24 },
  ];
  const accent = css("--accent");
  const ink = css("--ink");
  const labels = ["A", "B", "C"];

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const angleAt = (p, q, r) => {
    const v1 = { x: q.x - p.x, y: q.y - p.y };
    const v2 = { x: r.x - p.x, y: r.y - p.y };
    const c = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y));
    return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
  };

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = css("--card");
    ctx.fillRect(0, 0, w, h);
    // triangle
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();
    ctx.fillStyle = "rgba(138,74,44,0.08)";
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    // longueurs des côtés
    ctx.font = "12px Public Sans, sans-serif";
    ctx.fillStyle = ink;
    const sides = [
      [pts[0], pts[1]],
      [pts[1], pts[2]],
      [pts[2], pts[0]],
    ];
    sides.forEach(([a, b]) => {
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      ctx.fillText((dist(a, b) / 40).toFixed(2), mx + 4, my);
    });
    // sommets
    pts.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.font = "600 13px Newsreader, serif";
      ctx.fillText(labels[i], p.x + 10, p.y - 8);
    });
    if (readout) {
      const aA = angleAt(pts[0], pts[1], pts[2]);
      const aB = angleAt(pts[1], pts[0], pts[2]);
      const aC = 180 - aA - aB;
      readout.textContent = `Â ${aA.toFixed(1)}°  ·  B̂ ${aB.toFixed(1)}°  ·  Ĉ ${aC.toFixed(1)}°  (somme 180°)`;
    }
  }

  let dragIdx = -1;
  const at = (x, y) => pts.findIndex((p) => Math.hypot(p.x - x, p.y - y) < 18);
  const local = (e) => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const onDown = (e) => {
    const [x, y] = local(e);
    dragIdx = at(x, y);
    if (dragIdx >= 0) canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    if (dragIdx < 0) return;
    const [x, y] = local(e);
    pts[dragIdx].x = Math.max(8, Math.min(w - 8, x));
    pts[dragIdx].y = Math.max(8, Math.min(h - 8, y));
    draw();
  };
  const onUp = () => (dragIdx = -1);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  draw();
  return () => {};
}

function mountPolyhedron(host) {
  const { canvas, ctx, w, h } = setupCanvas(host);
  const accent = css("--accent");
  const solids = {
    tetra: {
      v: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]],
      e: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]],
    },
    cube: {
      v: [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
      e: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]],
    },
    octa: {
      v: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]],
      e: [[0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5], [2, 4], [4, 3], [3, 5], [5, 2]],
    },
  };
  let ax = 0.6;
  let ay = 0.4;
  let auto = true;
  let raf = 0;

  function draw() {
    const solid = solids[state.polySolid || "cube"];
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = css("--card");
    ctx.fillRect(0, 0, w, h);
    const cosX = Math.cos(ax), sinX = Math.sin(ax);
    const cosY = Math.cos(ay), sinY = Math.sin(ay);
    // Projection perspective, puis mise à l'échelle automatique pour tenir dans le cadre.
    const raw = solid.v.map(([x, y, z]) => {
      let y1 = y * cosX - z * sinX;
      let z1 = y * sinX + z * cosX;
      let x1 = x * cosY + z1 * sinY;
      z1 = -x * sinY + z1 * cosY;
      const p = 5 / (5 + z1);
      return [x1 * p, y1 * p];
    });
    const maxR = Math.max(1e-6, ...raw.map(([x, y]) => Math.hypot(x, y)));
    const fit = (Math.min(w, h) * 0.4) / maxR;
    const proj = raw.map(([x, y]) => [w / 2 + x * fit, h / 2 + y * fit]);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    solid.e.forEach(([a, b]) => {
      ctx.moveTo(proj[a][0], proj[a][1]);
      ctx.lineTo(proj[b][0], proj[b][1]);
    });
    ctx.stroke();
    ctx.fillStyle = accent;
    proj.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function loop() {
    if (auto) {
      ay += 0.008;
      ax += 0.003;
    }
    draw();
    raf = requestAnimationFrame(loop);
  }

  let drag = null;
  const onDown = (e) => {
    drag = { x: e.clientX, y: e.clientY };
    auto = false;
    canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    if (!drag) return;
    ay += (e.clientX - drag.x) * 0.01;
    ax += (e.clientY - drag.y) * 0.01;
    drag = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => {
    drag = null;
    auto = true;
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  loop();
  return () => cancelAnimationFrame(raf);
}

function mountFractal(host) {
  const { canvas, ctx, w, h } = setupCanvas(host);
  const readout = document.getElementById("fracReadout");
  const view = { cx: -0.5, cy: 0, span: 3 };
  const maxIter = 140;
  // putImageData ignore la mise à l'échelle du contexte : on travaille en pixels réels.
  const dw = canvas.width;
  const dh = canvas.height;

  function draw() {
    const img = ctx.createImageData(dw, dh);
    const data = img.data;
    const scale = view.span / dw;
    const accent = [138, 74, 44];
    for (let py = 0; py < dh; py++) {
      const y0 = view.cy + (py - dh / 2) * scale;
      for (let px = 0; px < dw; px++) {
        const x0 = view.cx + (px - dw / 2) * scale;
        let x = 0, y = 0, i = 0;
        while (x * x + y * y <= 4 && i < maxIter) {
          const xt = x * x - y * y + x0;
          y = 2 * x * y + y0;
          x = xt;
          i++;
        }
        const idx = (py * dw + px) * 4;
        if (i === maxIter) {
          data[idx] = 33; data[idx + 1] = 31; data[idx + 2] = 26;
        } else {
          const s = Math.pow(i / maxIter, 0.5);
          data[idx] = Math.round(247 - (247 - accent[0]) * s);
          data[idx + 1] = Math.round(244 - (244 - accent[1]) * s);
          data[idx + 2] = Math.round(237 - (237 - accent[2]) * s);
        }
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    if (readout) readout.textContent = `centre (${fmtDec(view.cx)}, ${fmtDec(view.cy)}) · largeur ${view.span.toPrecision(3)}`;
  }

  const zoom = (e, factor) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    // coordonnées écran → pixels réels du canvas
    const px = (e.clientX - r.left) * (dw / r.width);
    const py = (e.clientY - r.top) * (dh / r.height);
    const scale = view.span / dw;
    view.cx += (px - dw / 2) * scale;
    view.cy += (py - dh / 2) * scale;
    view.span *= factor;
    draw();
  };
  const onClick = (e) => zoom(e, 0.5);
  const onContext = (e) => zoom(e, 2);
  canvas.addEventListener("click", onClick);
  canvas.addEventListener("contextmenu", onContext);
  draw();
  return () => {};
}

let labCleanup = null;
function mountLabTool() {
  if (labCleanup) {
    labCleanup();
    labCleanup = null;
  }
  if (state.screen !== "labo" || !state.labTool) return;
  const host = document.getElementById("labToolHost");
  if (!host) return;
  const mounts = { graph: mountGrapher, geo: mountGeometry, poly: mountPolyhedron, fractal: mountFractal };
  const fn = mounts[state.labTool];
  if (fn) labCleanup = fn(host);
}

/* =========================================================
   CALCULATRICES DU LABORATOIRE (DOM, calcul en direct)
   ========================================================= */
const CALC_META = {
  sci: ["Calculatrice scientifique", "+ − × ÷ ^, sin, cos, tan, exp, log, ln, sqrt, abs, pi, e."],
  matrix: ["Calcul matriciel 2×2", "Déterminant, inverse et produit de deux matrices 2×2."],
  seq: ["Suites", "Terme général u(n) : premiers termes et tendance."],
  stat: ["Statistiques & probabilités", "Série de valeurs et loi binomiale."],
  conv: ["Convertisseurs", "Angles, longueurs et masses."],
};
const num = (s) => parseFloat(String(s).replace(",", "."));
function fmtCalc(v) {
  if (!Number.isFinite(v)) return "—";
  if (Number.isInteger(v)) return v.toLocaleString("fr-FR");
  const abs = Math.abs(v);
  if (abs !== 0 && (abs < 1e-4 || abs >= 1e10)) return v.toExponential(6).replace(".", ",");
  return String(Number(v.toPrecision(10))).replace(".", ",");
}
const mtxInput = (id, v) => `<input id="${id}" class="mtx-cell" inputmode="decimal" value="${escAttr(v)}" />`;

function calcHtml(tool) {
  if (tool === "sci") {
    return `
      <label class="lab-field">= <input id="sciInput" type="text" value="2*pi + sqrt(2)" spellcheck="false" /></label>
      <p class="lab-readout" id="sciOut"></p>
      <div class="lab-presets">
        ${["sqrt(2)", "sin(pi/6)", "2^10", "ln(e^3)", "(1+sqrt(5))/2"]
          .map((x) => `<button class="chip small" data-preset="${escAttr(x)}" data-target="#sciInput">${esc(x)}</button>`)
          .join("")}
      </div>`;
  }
  if (tool === "matrix") {
    return `
      <div class="mtx-pair">
        <div><p class="mtx-label">A</p><div class="mtx-grid">${mtxInput("mA", "1")}${mtxInput("mB", "2")}${mtxInput(
      "mC",
      "3"
    )}${mtxInput("mD", "4")}</div></div>
        <div><p class="mtx-label">B</p><div class="mtx-grid">${mtxInput("mE", "0")}${mtxInput("mF", "1")}${mtxInput(
      "mG",
      "1"
    )}${mtxInput("mH", "0")}</div></div>
      </div>
      <div class="lab-readout" id="mtxOut"></div>`;
  }
  if (tool === "seq") {
    return `
      <label class="lab-field">u(n) = <input id="seqExpr" type="text" value="1/n" spellcheck="false" /></label>
      <div class="calc-inline">
        <label>de n = <input id="seqFrom" class="mtx-cell" inputmode="numeric" value="1" /></label>
        <label>sur <input id="seqN" class="mtx-cell" inputmode="numeric" value="8" /> termes</label>
      </div>
      <div class="lab-readout" id="seqOut"></div>`;
  }
  if (tool === "stat") {
    return `
      <label class="lab-field vert">Série de valeurs
        <input id="statData" type="text" value="12, 15, 9, 20, 7, 15" spellcheck="false" />
      </label>
      <div class="lab-readout" id="statOut"></div>
      <div class="section-rule"><span class="eyebrow-brick">Loi binomiale</span><span class="fill"></span></div>
      <div class="calc-inline">
        <label>n <input id="binN" class="mtx-cell" inputmode="numeric" value="10" /></label>
        <label>p <input id="binP" class="mtx-cell" inputmode="decimal" value="0,5" /></label>
        <label>k <input id="binK" class="mtx-cell" inputmode="numeric" value="4" /></label>
      </div>
      <div class="lab-readout" id="binOut"></div>`;
  }
  if (tool === "conv") {
    return `
      <div class="calc-inline"><label>Angle <input id="convAngle" class="mtx-cell" inputmode="decimal" value="90" /> °</label></div>
      <p class="lab-readout" id="convAngleOut"></p>
      <div class="calc-inline"><label>Longueur <input id="convLen" class="mtx-cell" inputmode="decimal" value="1" /> m</label></div>
      <p class="lab-readout" id="convLenOut"></p>
      <div class="calc-inline"><label>Masse <input id="convMass" class="mtx-cell" inputmode="decimal" value="1" /> kg</label></div>
      <p class="lab-readout" id="convMassOut"></p>`;
  }
  return "";
}

function renderCalcTool() {
  const [title, hint] = CALC_META[state.calcTool] || ["Outil", ""];
  return `
    <button class="back-link" data-act="lab-back">← Laboratoire</button>
    <h2 class="lab-title">${esc(title)}</h2>
    <p class="lab-hint">${esc(hint)}</p>
    <div class="calc-panel" id="calcPanel">${calcHtml(state.calcTool)}</div>`;
}

function calcCompute(tool, panel) {
  const $ = (id) => panel.querySelector(id);
  const set = (id, html) => {
    const el = $(id);
    if (el) el.innerHTML = html;
  };
  if (tool === "sci") {
    try {
      const v = compileExpr($("#sciInput").value)(0);
      set("#sciOut", Number.isFinite(v) ? "= <strong>" + fmtCalc(v) + "</strong>" : "Résultat non défini");
    } catch (e) {
      set("#sciOut", "Expression invalide");
    }
  } else if (tool === "matrix") {
    const [a, b, c, d, e, f, g, h] = ["#mA", "#mB", "#mC", "#mD", "#mE", "#mF", "#mG", "#mH"].map((id) => num($(id).value));
    if ([a, b, c, d, e, f, g, h].some(Number.isNaN)) return set("#mtxOut", "Compléter les huit coefficients.");
    const det = a * d - b * c;
    const prod = [a * e + b * g, a * f + b * h, c * e + d * g, c * f + d * h];
    const inv =
      det === 0
        ? "<em>non inversible (det = 0)</em>"
        : `¹⁄<sub>det</sub> · [ ${fmtCalc(d / det)}, ${fmtCalc(-b / det)} ; ${fmtCalc(-c / det)}, ${fmtCalc(a / det)} ]`;
    set(
      "#mtxOut",
      `<p>det(A) = <strong>${fmtCalc(det)}</strong></p>
       <p>A⁻¹ = ${inv}</p>
       <p>A × B = [ ${prod.map(fmtCalc).join(", ")} ]</p>`
    );
  } else if (tool === "seq") {
    const from = Math.round(num($("#seqFrom").value));
    const count = Math.min(40, Math.max(1, Math.round(num($("#seqN").value))));
    if (Number.isNaN(from) || Number.isNaN(count)) return set("#seqOut", "Indices invalides.");
    let fn;
    try {
      fn = compileExpr($("#seqExpr").value);
    } catch {
      return set("#seqOut", "Expression u(n) invalide.");
    }
    const terms = [];
    for (let i = 0; i < count; i++) terms.push(fn(from + i));
    const last = terms[terms.length - 1];
    const prev = terms[terms.length - 2];
    let trend = "";
    if (terms.length >= 2 && Number.isFinite(last) && Number.isFinite(prev)) {
      trend =
        Math.abs(last - prev) < 1e-6
          ? `semble converger vers ≈ ${fmtCalc(last)}`
          : last > prev
          ? "croissante sur la plage"
          : "décroissante sur la plage";
    }
    set(
      "#seqOut",
      `<p>${terms.map((t, i) => `u(${from + i}) = ${fmtCalc(t)}`).join("<br>")}</p>${trend ? `<p class="calc-note">${esc(trend)}</p>` : ""}`
    );
  } else if (tool === "stat") {
    const xs = ($("#statData").value.match(/-?\d+[.,]?\d*/g) || []).map((s) => num(s)).filter((n) => !Number.isNaN(n));
    if (!xs.length) set("#statOut", "Saisir des valeurs numériques.");
    else {
      const n = xs.length;
      const sum = xs.reduce((a, b) => a + b, 0);
      const mean = sum / n;
      const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
      const sorted = [...xs].sort((a, b) => a - b);
      const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
      set(
        "#statOut",
        `<p>n = <strong>${n}</strong> · somme = ${fmtCalc(sum)}</p>
         <p>moyenne = <strong>${fmtCalc(mean)}</strong> · médiane = ${fmtCalc(median)}</p>
         <p>variance = ${fmtCalc(variance)} · écart-type = ${fmtCalc(Math.sqrt(variance))}</p>
         <p>min = ${fmtCalc(sorted[0])} · max = ${fmtCalc(sorted[n - 1])}</p>`
      );
    }
    const bn = Math.round(num($("#binN").value));
    const bp = num($("#binP").value);
    const bk = Math.round(num($("#binK").value));
    if (Number.isNaN(bn) || Number.isNaN(bp) || Number.isNaN(bk) || bp < 0 || bp > 1 || bk < 0 || bk > bn) {
      set("#binOut", "Paramètres : 0 ≤ p ≤ 1 et 0 ≤ k ≤ n.");
    } else {
      let choose = 1;
      for (let i = 0; i < bk; i++) choose = (choose * (bn - i)) / (i + 1);
      const pk = choose * Math.pow(bp, bk) * Math.pow(1 - bp, bn - bk);
      set(
        "#binOut",
        `<p>P(X = ${bk}) = <strong>${fmtCalc(pk)}</strong></p>
         <p>espérance = ${fmtCalc(bn * bp)} · variance = ${fmtCalc(bn * bp * (1 - bp))}</p>`
      );
    }
  } else if (tool === "conv") {
    const deg = num($("#convAngle").value);
    set(
      "#convAngleOut",
      Number.isNaN(deg) ? "—" : `${fmtCalc((deg * Math.PI) / 180)} rad · ${fmtCalc((deg / 9) * 10)} grades`
    );
    const m = num($("#convLen").value);
    set(
      "#convLenOut",
      Number.isNaN(m) ? "—" : `${fmtCalc(m / 1000)} km · ${fmtCalc(m * 100)} cm · ${fmtCalc(m / 1609.344)} mi · ${fmtCalc(m / 0.3048)} ft`
    );
    const kg = num($("#convMass").value);
    set(
      "#convMassOut",
      Number.isNaN(kg) ? "—" : `${fmtCalc(kg * 1000)} g · ${fmtCalc(kg / 0.45359237)} lb · ${fmtCalc(kg / 0.0283495)} oz`
    );
  }
}

function mountCalcTool() {
  if (state.screen !== "labo" || !state.calcTool) return;
  const panel = document.getElementById("calcPanel");
  if (!panel) return;
  const tool = state.calcTool;
  const recompute = () => calcCompute(tool, panel);
  panel.addEventListener("input", recompute);
  panel.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-preset]");
    if (!chip) return;
    const input = panel.querySelector(chip.dataset.target || "input");
    if (input) {
      input.value = chip.dataset.preset;
      recompute();
    }
  });
  recompute();
}

function solveQuadratic() {
  const a = parseFloat(String(state.a).replace(",", "."));
  const b = parseFloat(String(state.b).replace(",", "."));
  const c = parseFloat(String(state.c).replace(",", "."));
  if ([a, b, c].some(Number.isNaN)) return "Saisir trois coefficients numériques.";
  if (a === 0) return b === 0 ? "Équation dégénérée (a = 0 et b = 0)." : "Équation linéaire — x = " + fmtDec(-c / b);
  const d = b * b - 4 * a * c;
  if (d > 0)
    return (
      "Δ = " +
      fmtDec(d) +
      " > 0 — deux solutions : x₁ = " +
      fmtDec((-b - Math.sqrt(d)) / (2 * a)) +
      ", x₂ = " +
      fmtDec((-b + Math.sqrt(d)) / (2 * a))
    );
  if (d === 0) return "Δ = 0 — solution double : x = " + fmtDec(-b / (2 * a));
  const re = fmtDec(-b / (2 * a));
  const im = fmtDec(Math.sqrt(-d) / (2 * a));
  return "Δ = " + fmtDec(d) + " < 0 — deux solutions complexes : x = " + re + " ± " + im + " i.";
}

function renderHistoire() {
  const tabs = [
    ["chrono", "Chronologie"],
    ["carte", "Carte du monde"],
  ]
    .map(
      ([k, label]) =>
        `<button class="${state.histTab === k ? "active" : ""}" data-act="hist" data-tab="${k}">${label}</button>`
    )
    .join("");

  let body = "";
  if (state.histTab === "chrono") {
    body = `<div class="timeline">${timelineItems
      .map((e) => {
        const items = (e.discoveries || e.people || []).slice(0, 4);
        return `
        <div class="era">
          <span class="dates">${esc(e.range || "")}</span>
          <div class="track">
            <span class="dot"></span>
            <h3>${esc(e.period || "")}</h3>
            <ul>${items.map((it) => `<li>${esc(it)}</li>`).join("")}</ul>
          </div>
        </div>`;
      })
      .join("")}</div>`;
  } else {
    const xs = places.map((p) => p.x).filter((n) => typeof n === "number");
    const ys = places.map((p) => p.y).filter((n) => typeof n === "number");
    const minX = Math.min(...xs) - 30, maxX = Math.max(...xs) + 30;
    const minY = Math.min(...ys) - 30, maxY = Math.max(...ys) + 30;
    const dots = places
      .filter((p) => typeof p.x === "number")
      .map((p) => `<circle class="map-dot" cx="${p.x}" cy="${p.y}" r="6"><title>${escAttr(p.city + " — " + p.country)}</title></circle>`)
      .join("");
    const rows = places
      .filter((p) => matchQ((p.city || "") + " " + (p.country || "") + " " + (p.note || "")))
      .map(
        (p) => `
      <div class="place-row">
        <div class="row-head">
          <strong>${esc(p.city)}${p.country ? " — " + esc(p.country) : ""}</strong>
          <span class="era-tag">${esc((p.periods && p.periods[0]) || p.kind || "")}</span>
        </div>
        <p>${esc(p.note || "")}</p>
      </div>`
      )
      .join("");
    body = `
      <div class="map-frame">
        <svg viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}" preserveAspectRatio="xMidYMid meet">${dots}</svg>
      </div>
      ${rows}`;
  }

  return `<div class="segmented" style="grid-template-columns:1fr 1fr">${tabs}</div>${body}`;
}

/* =========================================================
   ORCHESTRATION
   ========================================================= */
function screenBody() {
  if (state.menuOpen) return renderSommaire();
  switch (state.screen) {
    case "home":
      return renderHome();
    case "explorer":
      return state.open ? renderDetail() : renderExplorerList();
    case "pratiquer":
      return state.open && state.open.type === "ex" ? renderExerciseDetail(state.open.id) : renderPratiquer();
    case "labo":
      return renderLabo();
    case "histoire":
      return renderHistoire();
    default:
      return renderHome();
  }
}

function renderNav() {
  navEl.innerHTML = NAV.map(([k, num, label]) => {
    const active = !state.menuOpen && state.screen === k;
    return `
    <button class="${active ? "active" : ""}" data-act="nav" data-screen="${k}">
      <span class="num">${num}</span>
      <span class="label">${label}</span>
    </button>`;
  }).join("");
}

function renderMath() {
  if (!window.katex) return;
  screenEl.querySelectorAll(".tex[data-tex]").forEach((el) => {
    try {
      window.katex.render(el.dataset.tex, el, { throwOnError: false, displayMode: false });
    } catch {
      el.textContent = el.dataset.fallback || el.dataset.tex;
    }
  });
}

/* ------------------------- routage par hash (deep links + Retour) ------------------------- */
const DETAIL_CATS = ["math", "theo", "prob", "obj", "form"];
const EXPLORER_CATS = ["all", "math", "dom", "theo", "form", "obj", "prob", "bib", "fav"];

function stateToHash() {
  const s = state;
  switch (s.screen) {
    case "explorer":
      if (s.open && DETAIL_CATS.includes(s.open.type)) return `/explorer/${s.open.type}/${encodeURIComponent(s.open.id)}`;
      if (s.cat === "bib" && s.bibCol) return `/explorer/bib/${s.bibCol}`;
      return `/explorer/${s.cat}`;
    case "pratiquer":
      if (s.open && s.open.type === "ex") return `/pratiquer/ex/${encodeURIComponent(s.open.id)}`;
      return `/pratiquer/${s.pratTab}`;
    case "labo":
      if (s.labTool) return `/labo/${s.labTool}`;
      if (s.calcTool) return `/labo/calc/${s.calcTool}`;
      return "/labo";
    case "histoire":
      return `/histoire/${s.histTab}`;
    default:
      return "/";
  }
}

function applyHash(hash) {
  const raw = String(hash || "").replace(/^#\/?/, "");
  const seg = raw.split("/");
  const screen = seg[0] || "home";
  const a = seg[1] ? decodeURIComponent(seg[1]) : "";
  const rest = seg.slice(2).join("/");
  const b = rest ? decodeURIComponent(rest) : "";
  const patch = { menuOpen: false, open: null, bibCol: null, labTool: null, calcTool: null };

  if (screen === "explorer") {
    patch.screen = "explorer";
    patch.cat = EXPLORER_CATS.includes(a) ? a : "math";
    if (patch.cat === "bib" && b) patch.bibCol = b;
    else if (DETAIL_CATS.includes(patch.cat) && b) patch.open = { type: patch.cat, id: b };
  } else if (screen === "pratiquer") {
    patch.screen = "pratiquer";
    patch.pratTab = ["ex", "quiz", "prog"].includes(a) ? a : "ex";
    if (patch.pratTab === "ex" && b) patch.open = { type: "ex", id: b };
  } else if (screen === "labo") {
    patch.screen = "labo";
    if (["graph", "geo", "poly", "fractal"].includes(a)) patch.labTool = a;
    else if (a === "calc" && ["sci", "matrix", "seq", "stat", "conv"].includes(b)) patch.calcTool = b;
  } else if (screen === "histoire") {
    patch.screen = "histoire";
    patch.histTab = a === "carte" ? "carte" : "chrono";
  } else {
    patch.screen = "home";
  }
  Object.assign(state, patch);
}

let routeReady = false;
let lastAppliedHash = null;
function syncHash() {
  const target = "#" + stateToHash();
  if ((location.hash || "#/") !== target) {
    if (!routeReady) history.replaceState(null, "", target);
    else history.pushState(null, "", target);
  }
  routeReady = true;
  lastAppliedHash = location.hash;
}
function onRouteChange() {
  if (location.hash === lastAppliedHash) return;
  lastAppliedHash = location.hash;
  applyHash(location.hash);
  render();
}

function render() {
  const active = document.activeElement;
  const focusId = active && active.id;
  const selStart = active ? active.selectionStart : null;
  const selEnd = active ? active.selectionEnd : null;
  const scrollTop = screenEl.scrollTop;

  chapterEl.textContent = CHAPTER[state.screen] || "Édition 2026";
  menuButton.setAttribute("aria-expanded", String(state.menuOpen));
  screenEl.innerHTML = screenBody();
  renderNav();
  renderMath();
  hydratePortraits();
  hydrateConceptWiki();
  mountLabTool();
  mountCalcTool();
  syncHash();

  if (focusId) {
    const el = document.getElementById(focusId);
    if (el) {
      el.focus();
      try {
        if (selStart != null) el.setSelectionRange(selStart, selEnd);
      } catch {
        /* champ sans sélection */
      }
      screenEl.scrollTop = scrollTop;
      return;
    }
  }
  screenEl.scrollTop = 0;
}

/* ------------------------- délégation d'événements ------------------------- */
document.getElementById("app").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const act = btn.dataset.act;
  const d = btn.dataset;

  switch (act) {
    case "menu-toggle":
      setState({ menuOpen: !state.menuOpen });
      break;
    case "menu-go": {
      const patch = d.patch ? JSON.parse(d.patch) : {};
      state.q = "";
      setState({ screen: d.screen, menuOpen: false, open: null, bibCol: null, labTool: null, calcTool: null, ...patch });
      break;
    }
    case "nav":
      setScreen(d.screen);
      break;
    case "cat":
      setState({ cat: d.cat, bibCol: null, q: d.keepq ? state.q : "" });
      break;
    case "open":
      openItem(d.type || "math", d.id);
      break;
    case "close-detail":
      setState({ open: null });
      break;
    case "fav":
      toggleFav(d.type || "math", d.id);
      render();
      break;
    case "detail-fav":
      toggleFav(d.type || "math", d.id);
      render();
      break;
    case "ex-done": {
      const set = new Set(progress.done || []);
      if (set.has(d.id)) set.delete(d.id);
      else set.add(d.id);
      progress.done = [...set];
      saveProgress();
      render();
      break;
    }
    case "bib":
      setState({ bibCol: d.col, q: "" });
      break;
    case "bib-back":
      setState({ bibCol: null, q: "" });
      break;
    case "prat":
      setState({ pratTab: d.tab });
      break;
    case "lvl":
      setState({ lvl: d.lvl });
      break;
    case "quiz-pick": {
      if (state.quizPick != null) break;
      const i = Number(d.i);
      const item = quiz[state.quizIdx % quiz.length];
      if (i === item.correct) {
        progress.correctQuiz += 1;
        const dom = item.domain || "Autres";
        progress.quizByDomain[dom] = (progress.quizByDomain[dom] || 0) + 1;
        saveProgress();
      }
      setState({ quizPick: i });
      break;
    }
    case "quiz-next":
      setState({ quizIdx: (state.quizIdx + 1) % quiz.length, quizPick: null });
      break;
    case "hist":
      setState({ histTab: d.tab });
      break;
    case "lab-tool":
      setState({ labTool: d.tool });
      break;
    case "calc-tool":
      setState({ calcTool: d.tool });
      break;
    case "lab-back":
      setState({ labTool: null, calcTool: null });
      break;
    case "graph-preset":
      setState({ graphFn: d.fn });
      break;
    case "poly-solid":
      setState({ polySolid: d.solid });
      break;
    default:
      break;
  }
});

let searchTimer = null;
screenEl.addEventListener("input", (e) => {
  const t = e.target;
  if (t.id === "search") {
    state.q = t.value;
    // Debounce : évite de re-rendre (et re-filtrer 2000 entrées) à chaque frappe.
    clearTimeout(searchTimer);
    searchTimer = setTimeout(render, 130);
  } else if (t.id === "eqA" || t.id === "eqB" || t.id === "eqC") {
    state[t.id === "eqA" ? "a" : t.id === "eqB" ? "b" : "c"] = t.value;
    const out = document.getElementById("eqResult");
    if (out) out.textContent = solveQuadratic();
  }
});

// Accessibilité : activer au clavier (Entrée/Espace) les cartes cliquables
// qui ne sont pas des éléments interactifs natifs (role="button").
document.getElementById("app").addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
  const el = e.target.closest("[data-act]");
  if (!el || ["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
  e.preventDefault();
  el.click();
});

// Repli si l'image du portrait échoue à charger : on revient au glyphe.
screenEl.addEventListener(
  "error",
  (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.classList.contains("portrait-img")) return;
    const frame = img.closest(".portrait-frame");
    if (frame) {
      frame.classList.remove("has-img");
      // On revient au glyphe pour cette vue sans effacer l'URL en cache :
      // l'échec peut être passager (hors ligne) et l'image resservira ensuite.
      const id = frame.dataset.mid;
      if (id) wikiTried.add(id);
    }
    img.remove();
  },
  true
);

// Navigation Retour/Suivant du navigateur et édition manuelle du hash.
window.addEventListener("popstate", onRouteChange);
window.addEventListener("hashchange", onRouteChange);

// KaTeX peut arriver après le premier rendu (script defer).
window.addEventListener("load", renderMath);

// Restaure l'état depuis l'URL (lien profond) avant le premier rendu.
applyHash(location.hash);
render();
