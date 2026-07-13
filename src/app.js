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
const FAV_KEY = "mathemator:favs";
let favs = store.get(FAV_KEY, {});
const favCount = () => Object.values(favs).filter(Boolean).length;
function toggleFav(id) {
  favs = { ...favs, [id]: !favs[id] };
  store.set(FAV_KEY, favs);
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
  cat: "math", // math | dom | theo | prob | bib
  bibCol: null, // quotes | books | glossary | media
  personId: null,
  q: "",
  pratTab: "ex", // ex | quiz | prog
  lvl: "Tous",
  quizIdx: 0,
  quizPick: null,
  histTab: "chrono", // chrono | carte
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
  setState({ screen, personId: null, menuOpen: false, bibCol: null });
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
  ["math", "Mathématiciens"],
  ["dom", "Domaines"],
  ["theo", "Théorèmes"],
  ["prob", "Problèmes"],
  ["bib", "Bibliothèque"],
];
const LEVELS = ["Tous", "Collège", "Lycée", "Lycée avancé", "Licence", "Master"];
const DIFF_DOTS = { Facile: 1, Moyen: 2, Difficile: 3, Avancé: 3 };
const PRAT_TABS = [
  ["ex", "Exercices"],
  ["quiz", "Quiz"],
  ["prog", "Progression"],
];
const VISU_TOOLS = [
  ["ƒ(x)", "Grapheur", "Courbes 2D interactives"],
  ["△", "Géométrie dynamique", "Points déplaçables, mesures"],
  ["◇", "Polyèdres 3D", "Solides manipulables"],
  ["ℳ", "Fractales", "Mandelbrot, Julia, Koch"],
];
const CALC_TOOLS = [
  ["Calculatrice scientifique", "Expressions, fonctions usuelles"],
  ["Calcul matriciel", "Produit, déterminant, inverse"],
  ["Suites", "Termes de u(n), convergence"],
  ["Statistiques & probabilités", "Moyenne, variance, loi binomiale"],
  ["Convertisseurs", "Angles, longueurs, masses"],
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
    problems.length +
    books.length +
    quotes.length +
    glossary.length +
    media.length;

  const universes = [
    ["I.", "Explorer", "Mathématiciens, domaines, théorèmes, problèmes, bibliothèque.", `${fmtNum(totalFiches)} fiches`, "explorer"],
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

function renderExplorerList() {
  const chips = CATS.map(
    ([k, label]) =>
      `<button class="chip${state.cat === k ? " active" : ""}" data-act="cat" data-cat="${k}">${label}</button>`
  ).join("");

  let count = "";
  let body = "";

  if (state.cat === "math") {
    const list = mathematicians.filter((m) => matchQ(m.name + " " + (m.domains || []).join(" ")));
    count = `${fmtNum(list.length)} fiche${list.length > 1 ? "s" : ""} sur ${fmtNum(mathematicians.length)}`;
    body = list
      .slice(0, 80)
      .map(
        (m) => `
      <div class="person-row">
        <button class="portrait-glyph" data-act="open" data-id="${escAttr(m.id)}">${esc(m.portrait || m.name.charAt(0))}</button>
        <button class="info" data-act="open" data-id="${escAttr(m.id)}">
          <span class="name">${esc(m.name)}</span>
          <span class="meta">${esc(personMeta(m))}</span>
        </button>
        <button class="fav-star" data-act="fav" data-id="${escAttr(m.id)}" aria-label="Favori">${favs[m.id] ? "★" : "☆"}</button>
      </div>`
      )
      .join("");
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
    body = list
      .slice(0, 60)
      .map(
        (t) => `
      <div class="theorem-card">
        <div class="row-head">
          <h3>${esc(t.name)}</h3>
          <span class="who">${esc(t.discoverer || "")}</span>
        </div>
        <p class="formula-box">${texSpan(t.latex || t.statement, t.statement)}</p>
        <p class="desc">${esc(t.intuition || "")}</p>
      </div>`
      )
      .join("");
    if (list.length > 60) body += `<p class="count-label">Affiner la recherche pour voir les ${fmtNum(list.length - 60)} autres théorèmes.</p>`;
  } else if (state.cat === "prob") {
    const list = problems.filter((p) => matchQ(p.name + " " + (p.text || "")));
    count = `${list.length} problème${list.length > 1 ? "s" : ""} célèbre${list.length > 1 ? "s" : ""}`;
    const cls = (s) => (s === "Résolu" ? "solved" : s === "Actif" ? "active" : "open");
    body = list
      .map(
        (p) => `
      <div class="problem-row">
        <div class="row-head">
          <h3>${esc(p.name)}</h3>
          <span class="status-pill ${cls(p.status)}">${esc(p.status)}</span>
        </div>
        <p>${esc(p.accessible || p.text || "")}</p>
      </div>`
      )
      .join("");
  } else if (state.cat === "bib") {
    if (state.bibCol) return renderBiblioCollection();
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
    <input class="search-input" id="search" type="search" placeholder="Rechercher dans l'encyclopédie…" value="${escAttr(
      state.q
    )}" />
    <div class="chip-row">${chips}</div>
    <p class="count-label">${esc(count)}</p>
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

function renderDetail() {
  const m = mathById.get(state.personId);
  if (!m) return renderExplorerList();

  if (!progress.viewed.includes(m.id)) {
    progress.viewed.push(m.id);
    saveProgress();
  }

  const dates = [m.birth, m.death].filter(Boolean).join("–");
  const on = !!favs[m.id];
  const associated = [...(m.namedObjects || []), ...(m.theorems || [])]
    .filter((x) => x && !/^objet associé|^méthode de|^résultat de/i.test(x))
    .slice(0, 3);
  const linked = associated.length ? associated.join(", ") : (m.namedObjects || []).slice(0, 2).join(", ");

  return `
    <button class="back-link" data-act="close-detail">← Explorer</button>
    <p class="detail-role">${esc(role(m))} · ${esc(dates)}</p>
    <h2 class="detail-name">${esc(m.name)}</h2>

    <div class="portrait-frame">
      <span class="glyph">${esc(m.portrait || m.name.charAt(0))}</span>
      <span class="cap">portrait — ${esc(m.imageSource || "Illustration générée")}</span>
    </div>

    <p class="detail-bio">${esc(m.biography || "")}</p>

    <dl class="detail-dl">
      <dt>Nationalité</dt><dd>${esc(m.nationality || "—")}</dd>
      <dt>Domaines</dt><dd>${esc((m.domains || []).join(", ") || "—")}</dd>
      <dt>Associé à</dt><dd>${esc(linked || "—")}</dd>
    </dl>

    <button class="fav-button${on ? " on" : ""}" data-act="detail-fav" data-id="${escAttr(m.id)}">${
    on ? "★ Dans ma collection" : "☆ Ajouter à ma collection"
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
      return `
      <div class="exercise-row">
        <span class="info">
          <span class="title">${esc(title)}</span>
          <span class="meta">${esc([e.level, e.domain, e.time].filter(Boolean).join(" · "))}</span>
        </span>
        <span class="dots">${dots}</span>
      </div>`;
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

  // Signal par domaine : favoris (via domaines des fiches) + quiz réussis.
  const score = {};
  Object.entries(favs).forEach(([id, on]) => {
    if (!on) return;
    const m = mathById.get(id);
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
  const tools = VISU_TOOLS.map(
    ([glyph, name, desc]) => `
    <div class="tool-card">
      <div class="thumb">${esc(glyph)}</div>
      <div class="cap"><strong>${esc(name)}</strong><span>${esc(desc)}</span></div>
    </div>`
  ).join("");

  const calc = CALC_TOOLS.map(
    ([name, desc]) => `
    <div class="calc-row">
      <span class="info"><span class="name">${esc(name)}</span><span class="desc">${esc(desc)}</span></span>
      <span class="arrow">→</span>
    </div>`
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
      return state.personId ? renderDetail() : renderExplorerList();
    case "pratiquer":
      return renderPratiquer();
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
      setState({ screen: d.screen, menuOpen: false, personId: null, bibCol: null, ...patch });
      break;
    }
    case "nav":
      setScreen(d.screen);
      break;
    case "cat":
      setState({ cat: d.cat, bibCol: null, q: "" });
      break;
    case "open":
      setState({ personId: d.id });
      break;
    case "close-detail":
      setState({ personId: null });
      break;
    case "fav":
      toggleFav(d.id);
      render();
      break;
    case "detail-fav":
      toggleFav(d.id);
      render();
      break;
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
    default:
      break;
  }
});

screenEl.addEventListener("input", (e) => {
  const t = e.target;
  if (t.id === "search") {
    state.q = t.value;
    render();
  } else if (t.id === "eqA" || t.id === "eqB" || t.id === "eqC") {
    state[t.id === "eqA" ? "a" : t.id === "eqB" ? "b" : "c"] = t.value;
    const out = document.getElementById("eqResult");
    if (out) out.textContent = solveQuadratic();
  }
});

// KaTeX peut arriver après le premier rendu (script defer).
window.addEventListener("load", renderMath);

render();
