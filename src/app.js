import { loadContent } from "./content.js";

const content = await loadContent();
const {
  books,
  dailyItems,
  domains,
  entries,
  exercises,
  formulas,
  glossary,
  mathematicians,
  media,
  modeContent,
  modules,
  objects,
  places,
  problems,
  quiz,
  quotes,
  theorems,
  timelineItems,
} = content;

const $ = (selector) => document.querySelector(selector);
const store = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

let activeReference = "Théorèmes";
let activeLibrary = "Citations";
let activeMode = "Enseignant";
let homeMediaOffset = 0;
let teacherDomain = "Géométrie";
let teacherLevel = "Lycée";
let teacherDuration = "45";
let studentDomain = "Géométrie";
let studentGoal = "Revoir 5 cartes";
let studentFlashcard = 0;
let studentFlashcardRevealed = false;
let currentExercise = 0;
let currentQuiz = 0;
let activeQuizMode = "Libre";
let quizScore = 0;
let quizStreak = 0;
let quizAnswered = false;
let quizTimeLeft = 0;
let quizTimer = null;
let hintVisible = false;
let activeTypeFilter = "Tous";
let activePeriodFilter = "Tous";
let activeNationalityFilter = "Tous";
let activeDifficultyFilter = "Tous";
let activeSearchDomainFilter = "Tous";
let activeSearchLevelFilter = "Tous";
let activeSearchTheoremFilter = "Tous";
let activeSearchKeywordFilter = "Tous";
let activeChipFilter = "Tous";
let activeFavoriteType = "Tous";
let activeScreen = "home";
let activeTimelinePeriod = "Toutes";
let activeMapKind = "Tous";
let activeMapCountry = "Tous";
let activeMapPlace = "";
let activeDomainFamily = "Tous";
let activeTheoremDomain = "Tous";
let activeTheoremDiscoverer = "Tous";
let activeFormulaCategory = "Tous";
let activeFormulaUse = "Tous";
let activeObjectCategory = "Tous";
let activeObjectDimension = "Tous";
let activeExerciseLevel = "Tous";
let activeExerciseDomain = "Tous";
let activeExerciseDifficulty = "Tous";
let activeExerciseTime = "Tous";
let activeExerciseId = exercises[0]?.id || "";
let activeProblemCategory = "Tous";
let activeProblemStatus = "Tous";
let activeProblemDomain = "Tous";
let activeQuoteAuthor = "Tous";
let activeQuoteTheme = "Tous";
let activeQuotePeriod = "Tous";
let activeBookAuthor = "Tous";
let activeBookCategory = "Tous";
let activeBookLevel = "Tous";
let activeGlossaryInitial = "Tous";
let activeGlossaryLink = "Tous";
let activeMediaType = "Tous";
let activeMediaDomain = "Tous";
let activeMediaSource = "Tous";
let activeNetworkType = "Tous";
let activeNetworkNode = "";

const screenLabels = {
  home: "Accueil",
  search: "Recherche",
  cards: "Fiches",
  lab: "Labo",
  learn: "Apprendre",
  favorites: "Favoris",
};

function setScreen(screen, options = {}) {
  activeScreen = screenLabels[screen] ? screen : "home";
  document.body.classList.add("app-ready");
  document.body.dataset.screen = activeScreen;
  document.querySelectorAll(".screen-section").forEach((section) => {
    section.classList.toggle("screen-active", section.dataset.screen === activeScreen);
  });
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.classList.toggle("active", button.dataset.nav === activeScreen);
  });
  if (activeScreen !== "search" && activeScreen !== "cards" && activeScreen !== "favorites") {
    $("#detailPanel").hidden = true;
  }
  if (activeScreen === "home") {
    requestAnimationFrame(() => dispatchEvent(new Event("resize")));
  }
  if (!options.silent) {
    history.replaceState(null, "", `#${activeScreen}`);
    scrollTo({ top: 0, behavior: "smooth" });
  }
}

function setMenuOpen(open) {
  document.body.classList.toggle("menu-open", open);
  $("#menuButton").setAttribute("aria-expanded", String(open));
  $("#mainMenu").setAttribute("aria-hidden", String(!open));
  $("#menuOverlay").hidden = !open;
}

function closeMenu() {
  setMenuOpen(false);
}

function navigateFromMenu(screen, target = "") {
  setScreen(screen);
  closeMenu();
  if (!target) return;
  requestAnimationFrame(() => {
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function openMediaType(type) {
  activeLibrary = "Médiathèque";
  activeMediaType = type;
  renderLibrary();
  setScreen("cards");
  requestAnimationFrame(() => {
    $("#ressources").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function card(title, body, meta = "", action = "") {
  return `
    <article class="result-card">
      <div>
        ${meta ? `<span>${meta}</span>` : ""}
        <h3>${title}</h3>
      </div>
      <p>${body}</p>
      ${action}
    </article>
  `;
}

function asSearchText(value) {
  return JSON.stringify(value).toLowerCase();
}

function normalize(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function optionList(values, label = "Tous") {
  return [`<option value="Tous">${label}</option>`, ...values.map((value) => `<option value="${value}">${value}</option>`)].join("");
}

function fieldList(items) {
  return items.filter(Boolean).map((item) => `<li>${item}</li>`).join("");
}

const domainNames = domains.map((domain) => domain.name);

function uniqueValues(values) {
  return [...new Set(values.flat().filter(Boolean))];
}

function inferPeriodFromText(...values) {
  const text = values.filter(Boolean).join(" ");
  return text.match(/Antiquité|Moyen Âge|Renaissance|[XVI]+e siècle/i)?.[0] || "";
}

function inferDomains(...values) {
  const text = normalize(values.filter(Boolean).join(" "));
  return domainNames.filter((domain) => text.includes(normalize(domain)));
}

function inferTheorems(...values) {
  const text = normalize(values.filter(Boolean).join(" "));
  return theorems
    .filter((theorem) => text.includes(normalize(theorem.name)))
    .map((theorem) => theorem.name)
    .slice(0, 8);
}

function searchEntry(fields) {
  return {
    ...fields,
    domains: uniqueValues(fields.domains || []),
    theorems: uniqueValues(fields.theorems || []),
    keywords: uniqueValues(fields.keywords || fields.tags || []),
    level: fields.level || "",
    period: fields.period || "",
    nationality: fields.nationality || "",
    difficulty: fields.difficulty || "",
  };
}

const searchIndex = [
  ...entries.map((item) => searchEntry({
    id: `entry:${item.title}`,
    type: item.type,
    title: item.title,
    meta: item.meta,
    text: item.text,
    tags: item.tags,
    period: inferPeriodFromText(item.meta),
    domains: inferDomains(item.title, item.meta, item.text, item.tags?.join(" ")),
    theorems: inferTheorems(item.title, item.meta, item.text),
    keywords: item.tags,
    difficulty: "",
    payload: item,
  })),
  ...mathematicians.map((item) => searchEntry({
    id: `person:${item.id}`,
    type: "Mathématicien",
    title: item.name,
    meta: `${item.period} · ${item.nationality} · ${item.domains.join(", ")}`,
    text: item.biography,
    tags: [...item.domains, item.nationality, item.period],
    period: item.period,
    nationality: item.nationality,
    domains: item.domains,
    theorems: item.theorems,
    keywords: [...item.domains, ...(item.discoveries || []), ...(item.namedObjects || [])],
    difficulty: "",
    payload: item,
  })),
  ...theorems.map((item) => searchEntry({
    id: `theorem:${item.name}`,
    type: "Théorème",
    title: item.name,
    meta: `${item.discoverer} · ${item.applications}`,
    text: item.intuition,
    tags: [item.discoverer, item.history, ...item.variants],
    domains: inferDomains(item.name, item.applications, item.history, item.variants?.join(" ")),
    theorems: [item.name],
    keywords: [item.discoverer, item.history, item.generalization, ...item.variants, ...(item.references || [])],
    period: "",
    nationality: "",
    difficulty: "",
    payload: item,
  })),
  ...formulas.map((item) => searchEntry({
    id: `formula:${item.name}`,
    type: "Formule",
    title: item.name,
    meta: item.category,
    text: item.explanation,
    tags: [item.category, ...item.uses],
    domains: uniqueValues([item.category, ...item.uses]).filter((value) => domainNames.includes(value)),
    theorems: inferTheorems(item.name, item.category, item.explanation),
    keywords: [item.category, ...item.uses, ...(item.examples || [])],
    period: "",
    nationality: "",
    difficulty: "",
    payload: item,
  })),
  ...domains.map((item) => searchEntry({
    id: `domain:${item.name}`,
    type: "Domaine",
    title: item.name,
    meta: `${item.family} · ${item.people}`,
    text: item.intro,
    tags: [item.family, ...item.concepts, ...item.theorems, ...(item.methods || []), ...(item.subdomains || []), ...(item.related || []), item.applications],
    domains: [item.name, ...(item.related || []).filter((value) => domainNames.includes(value))],
    theorems: item.theorems,
    keywords: [item.family, ...item.concepts, ...(item.methods || []), ...(item.subdomains || []), item.applications],
    period: "",
    nationality: "",
    difficulty: "",
    payload: item,
  })),
  ...objects.map((item) => searchEntry({
    id: `object:${item.name}`,
    type: "Objet",
    title: item.name,
    meta: `${item.category || "Objet"} · ${item.dimension || ""} · ${item.applications}`,
    text: item.description,
    tags: [item.category, item.dimension, ...item.properties, ...(item.related || []), item.history, item.interactive, item.formula],
    domains: uniqueValues([item.category, ...(item.related || [])]).filter((value) => domainNames.includes(value)),
    theorems: inferTheorems(item.name, item.description, item.history, item.related?.join(" ")),
    keywords: [item.category, item.dimension, ...item.properties, ...(item.related || []), item.interactive],
    period: "",
    nationality: "",
    difficulty: "",
    payload: item,
  })),
  ...exercises.map((item, index) => searchEntry({
    id: `exercise:${index}`,
    type: "Exercice",
    title: item.prompt,
    meta: `${item.domain} · ${item.level} · ${item.difficulty} · ${item.time}`,
    text: item.solution,
    tags: [item.domain, item.level, item.difficulty],
    domains: [item.domain],
    theorems: inferTheorems(item.prompt, item.solution, item.references?.join(" ")),
    keywords: [item.domain, item.level, item.difficulty, item.time, item.method, ...(item.references || [])],
    level: item.level,
    period: "",
    nationality: "",
    difficulty: item.difficulty,
    payload: item,
  })),
  ...quiz.map((item) => searchEntry({
    id: `quiz:${item.id}`,
    type: "Quiz",
    title: item.question,
    meta: `${item.domain} · ${item.mode} · ${item.difficulty} · ${item.points} points`,
    text: item.explanation,
    tags: [item.domain, item.mode, item.difficulty],
    domains: [item.domain],
    theorems: inferTheorems(item.question, item.explanation),
    keywords: [item.domain, item.mode, item.difficulty, `${item.points} points`],
    difficulty: item.difficulty,
    payload: item,
  })),
  ...problems.map((item) => searchEntry({
    id: `problem:${item.name}`,
    type: "Problème",
    title: item.name,
    meta: item.status,
    text: item.text,
    tags: [item.history, item.current, item.advances, item.impact],
    domains: [item.domain],
    theorems: inferTheorems(item.name, item.text, item.history),
    keywords: [item.status, item.category, item.difficulty, item.current, item.impact, ...(item.references || [])],
    period: item.period || "",
    nationality: "",
    difficulty: item.difficulty || "",
    payload: item,
  })),
  ...books.map((item) => searchEntry({
    id: `book:${item.title}`,
    type: "Livre",
    title: item.title,
    meta: `${item.author} · ${item.category} · ${item.level}`,
    text: item.description,
    tags: [item.author, item.category, item.level],
    domains: inferDomains(item.title, item.category, item.description),
    theorems: inferTheorems(item.title, item.description),
    keywords: [item.author, item.category, item.level],
    level: item.level,
    period: "",
    nationality: "",
    difficulty: item.level,
    payload: item,
  })),
  ...glossary.map((item) => searchEntry({
    id: `glossary:${item.term}`,
    type: "Glossaire",
    title: item.term,
    meta: item.links.join(", "),
    text: item.definition,
    tags: item.links,
    domains: inferDomains(item.term, item.definition, item.links.join(" ")),
    theorems: inferTheorems(item.term, item.definition, item.links.join(" ")),
    keywords: item.links,
    period: "",
    nationality: "",
    difficulty: "",
    payload: item,
  })),
  ...media.map((item) => searchEntry({
    id: `media:${item.id}`,
    type: "Média",
    title: item.title,
    meta: `${item.type} · ${item.source} · ${item.license}`,
    text: item.description,
    tags: [item.type, item.source, item.license, item.format, item.period, ...(item.links || [])],
    domains: inferDomains(item.domain, item.description, item.links?.join(" ")),
    theorems: inferTheorems(item.title, item.description, item.links?.join(" ")),
    keywords: [item.type, item.source, item.license, item.format, item.period, ...(item.links || [])],
    period: item.period,
    nationality: "",
    difficulty: "",
    payload: item,
  })),
].map((item) => ({ ...item, searchText: normalize(asSearchText(item)) }));

function createFullTextEngine() {
  try {
    if (!window.MiniSearch) return null;
    const engine = new window.MiniSearch({
      fields: ["title", "meta", "text", "searchText"],
      storeFields: ["id"],
      searchOptions: {
        boost: { title: 5, meta: 2 },
        fuzzy: 0.18,
        prefix: true,
      },
    });
    const seen = new Set();
    engine.addAll(searchIndex
      .filter((entry) => {
        if (seen.has(entry.id)) return false;
        seen.add(entry.id);
        return true;
      })
      .map((entry) => ({
        id: entry.id,
        title: entry.title,
        meta: entry.meta,
        text: entry.text,
        searchText: entry.searchText,
      })));
    return engine;
  } catch {
    return null;
  }
}

let fullTextEngine = null;

function fullTextScores(query) {
  if (!query.trim()) return null;
  fullTextEngine = fullTextEngine || createFullTextEngine();
  if (!fullTextEngine) return null;
  const scores = new Map();
  fullTextEngine.search(query).forEach((result) => {
    scores.set(result.id, Math.max(scores.get(result.id) || 0, Math.round(result.score * 10)));
  });
  return scores;
}

function latex(value) {
  return `<span class="latex" data-latex="${value.replaceAll('"', "&quot;")}">${value}</span>`;
}

function renderMath() {
  if (!window.katex) return;
  document.querySelectorAll("[data-latex]").forEach((node) => {
    window.katex.render(node.dataset.latex, node, { throwOnError: false, displayMode: false });
  });
}

function scoreEntry(entry, query) {
  let score = 1;
  if (!query) return score;
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return 1;
  score = 0;
  const title = normalize(entry.title);
  const meta = normalize(entry.meta);
  const tags = normalize((entry.tags || []).join(" "));
  const domainsText = normalize((entry.domains || []).join(" "));
  const theoremsText = normalize((entry.theorems || []).join(" "));
  const keywordsText = normalize((entry.keywords || []).join(" "));
  for (const term of terms) {
    if (title === term) score += 18;
    if (title.startsWith(term)) score += 12;
    if (title.includes(term)) score += 8;
    if (domainsText.includes(term)) score += 7;
    if (theoremsText.includes(term)) score += 7;
    if (keywordsText.includes(term)) score += 5;
    if (tags.includes(term)) score += 5;
    if (meta.includes(term)) score += 4;
    if (entry.searchText.includes(term)) score += 2;
  }
  return score;
}

function matchesSearchValue(values, selected) {
  return selected === "Tous" || uniqueValues(values).includes(selected);
}

function activeFilterScore(entry) {
  let score = 0;
  if (activeTypeFilter !== "Tous" && entry.type === activeTypeFilter) score += 3;
  if (activePeriodFilter !== "Tous" && entry.period === activePeriodFilter) score += 3;
  if (activeNationalityFilter !== "Tous" && entry.nationality === activeNationalityFilter) score += 3;
  if (activeDifficultyFilter !== "Tous" && entry.difficulty === activeDifficultyFilter) score += 3;
  if (activeSearchDomainFilter !== "Tous" && entry.domains.includes(activeSearchDomainFilter)) score += 5;
  if (activeSearchLevelFilter !== "Tous" && entry.level === activeSearchLevelFilter) score += 4;
  if (activeSearchTheoremFilter !== "Tous" && entry.theorems.includes(activeSearchTheoremFilter)) score += 5;
  if (activeSearchKeywordFilter !== "Tous" && entry.keywords.includes(activeSearchKeywordFilter)) score += 4;
  return score;
}

function searchOptionValues(field, limit = Infinity) {
  return uniqueValues(searchIndex.map((entry) => entry[field] || []))
    .sort((a, b) => a.localeCompare(b, "fr"))
    .slice(0, limit);
}

function renderDaily() {
  $("#dailyGrid").innerHTML = dailyItems
    .map(({ label, title, text, latex: latexValue }) => `
      <article class="daily-card">
        <span>${label}</span>
        <h3>${title}</h3>
        ${latexValue ? `<div class="formula-render">${latex(latexValue)}</div>` : ""}
        <p>${text}</p>
      </article>
    `)
    .join("");
  renderMath();
}

function renderHomeMedia() {
  const mediaTypeOrder = [
    "Portrait",
    "Manuscrit",
    "Page originale",
    "Livre historique",
    "Gravure",
    "Schéma géométrique",
    "Figure interactive",
    "Fractale",
    "Graphique animé",
    "Polyèdre 3D",
    "Réseau et graphe",
    "Carte historique",
    "Chronologie illustrée",
    "Carte géographique",
    "Arbre de connaissances",
    "Infographie",
    "Animation",
    "Animation de démonstration",
    "Simulation interactive",
    "Carte",
  ];
  const groups = Object.entries(media.reduce((acc, item) => {
    acc[item.type] = acc[item.type] || [];
    acc[item.type].push(item);
    return acc;
  }, {})).sort((a, b) => {
    const ai = mediaTypeOrder.indexOf(a[0]);
    const bi = mediaTypeOrder.indexOf(b[0]);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    return a[0].localeCompare(b[0], "fr");
  });
  const featured = Array.from({ length: Math.min(8, groups.length) }, (_, index) => groups[(homeMediaOffset + index) % groups.length]);
  $("#homeMediaGrid").innerHTML = featured.map(([type, items]) => {
    const sample = items[0];
    const examples = items.slice(0, 3).map((item) => item.title).join(" · ");
    const sourceCount = new Set(items.map((item) => item.source)).size;
    return `
    <article class="home-media-card" tabindex="0" role="button" data-media-type="${type}" aria-label="Explorer ${type}">
      ${mediaVisual(sample)}
      <div>
        <span class="home-media-meta">${items.length} ressources · ${sourceCount} sources</span>
        <h3>${type}</h3>
        <p>${examples}</p>
        <small>Explorer la collection ${type.toLowerCase()}</small>
      </div>
    </article>
    `;
  }).join("");
  $("#homeMediaGrid").querySelectorAll("[data-media-type]").forEach((card) => {
    card.addEventListener("click", () => openMediaType(card.dataset.mediaType));
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openMediaType(card.dataset.mediaType);
    });
  });
}

function renderSearch() {
  const filters = ["Tous", "Mathématicien", "Théorème", "Formule", "Algèbre", "Analyse", "Fractales", "Graphes", "Nombres", "Topologie"];
  const input = $("#searchInput");
  const chips = $("#filterChips");
  const list = $("#resultList");
  const typeFilter = $("#typeFilter");
  const periodFilter = $("#periodFilter");
  const nationalityFilter = $("#nationalityFilter");
  const difficultyFilter = $("#difficultyFilter");
  const domainFilter = $("#searchDomainFilter");
  const levelFilter = $("#searchLevelFilter");
  const theoremFilter = $("#searchTheoremFilter");
  const keywordFilter = $("#searchKeywordFilter");
  typeFilter.innerHTML = optionList([...new Set(searchIndex.map((entry) => entry.type))].sort());
  periodFilter.innerHTML = optionList(searchOptionValues("period"));
  nationalityFilter.innerHTML = optionList([...new Set(searchIndex.map((entry) => entry.nationality).filter(Boolean))].sort(), "Toutes");
  difficultyFilter.innerHTML = optionList([...new Set(searchIndex.map((entry) => entry.difficulty).filter(Boolean))].sort(), "Toutes");
  domainFilter.innerHTML = optionList(searchOptionValues("domains"));
  levelFilter.innerHTML = optionList(searchOptionValues("level"));
  theoremFilter.innerHTML = optionList(searchOptionValues("theorems"));
  keywordFilter.innerHTML = optionList(searchOptionValues("keywords"));
  typeFilter.value = activeTypeFilter;
  periodFilter.value = activePeriodFilter;
  nationalityFilter.value = activeNationalityFilter;
  difficultyFilter.value = activeDifficultyFilter;
  domainFilter.value = activeSearchDomainFilter;
  levelFilter.value = activeSearchLevelFilter;
  theoremFilter.value = activeSearchTheoremFilter;
  keywordFilter.value = activeSearchKeywordFilter;
  const draw = () => {
    const query = input.value.trim();
    const chip = normalize(activeChipFilter);
    const textScores = fullTextScores(query);
    const visible = searchIndex
      .map((entry) => ({
        ...entry,
        score: (textScores ? textScores.get(entry.id) || 0 : scoreEntry(entry, query)) + activeFilterScore(entry),
      }))
      .filter((entry) => entry.score > 0 || (!query && !textScores))
      .filter((entry) => activeChipFilter === "Tous" || entry.searchText.includes(chip) || normalize(entry.type).includes(chip))
      .filter((entry) => activeTypeFilter === "Tous" || entry.type === activeTypeFilter)
      .filter((entry) => activePeriodFilter === "Tous" || entry.period === activePeriodFilter)
      .filter((entry) => activeNationalityFilter === "Tous" || entry.nationality === activeNationalityFilter)
      .filter((entry) => activeDifficultyFilter === "Tous" || entry.difficulty === activeDifficultyFilter)
      .filter((entry) => matchesSearchValue(entry.domains, activeSearchDomainFilter))
      .filter((entry) => activeSearchLevelFilter === "Tous" || entry.level === activeSearchLevelFilter)
      .filter((entry) => matchesSearchValue(entry.theorems, activeSearchTheoremFilter))
      .filter((entry) => matchesSearchValue(entry.keywords, activeSearchKeywordFilter))
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "fr"))
      .slice(0, 40);
    $("#searchStats").innerHTML = `
      <strong>${visible.length}</strong><span>résultats</span>
      <strong>${new Set(visible.map((entry) => entry.type)).size}</strong><span>types</span>
      <strong>${new Set(visible.flatMap((entry) => entry.domains)).size}</strong><span>domaines</span>
      <strong>${textScores ? "MiniSearch" : "local"}</strong><span>moteur</span>
    `;
    chips.innerHTML = filters.map((filter) => `<button class="${filter === activeChipFilter ? "active" : ""}" type="button">${filter}</button>`).join("");
    list.innerHTML = visible.map(({ id, type, title, meta, text, score }) => card(
      title,
      text,
      `${type} · ${meta}`,
      `<div class="card-actions"><span class="search-score">Score ${score}</span><button class="mini-button" type="button" data-open="${id}">Ouvrir</button>${favoriteButton(id, title)}</div>`
    )).join("");
    chips.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        activeChipFilter = button.textContent;
        draw();
      });
    });
    bindFavorites();
    bindDetailButtons();
    renderFavorites();
  };
  input.addEventListener("input", draw);
  typeFilter.addEventListener("change", () => {
    activeTypeFilter = typeFilter.value || "Tous";
    draw();
  });
  periodFilter.addEventListener("change", () => {
    activePeriodFilter = periodFilter.value || "Tous";
    draw();
  });
  nationalityFilter.addEventListener("change", () => {
    activeNationalityFilter = nationalityFilter.value || "Tous";
    draw();
  });
  difficultyFilter.addEventListener("change", () => {
    activeDifficultyFilter = difficultyFilter.value || "Tous";
    draw();
  });
  domainFilter.addEventListener("change", () => {
    activeSearchDomainFilter = domainFilter.value || "Tous";
    draw();
  });
  levelFilter.addEventListener("change", () => {
    activeSearchLevelFilter = levelFilter.value || "Tous";
    draw();
  });
  theoremFilter.addEventListener("change", () => {
    activeSearchTheoremFilter = theoremFilter.value || "Tous";
    draw();
  });
  keywordFilter.addEventListener("change", () => {
    activeSearchKeywordFilter = keywordFilter.value || "Tous";
    draw();
  });
  draw();
}

function favoriteButton(id, label = id) {
  const favorites = store.get("mathemator:favorites", []);
  const active = favorites.includes(id);
  return `<button class="mini-button favorite-button ${active ? "active" : ""}" type="button" data-favorite="${id}" data-favorite-label="${label}">${active ? "Favori" : "Ajouter aux favoris"}</button>`;
}

function bindFavorites() {
  document.querySelectorAll("[data-favorite]").forEach((button) => {
    const favorites = store.get("mathemator:favorites", []);
    const active = favorites.includes(button.dataset.favorite);
    button.classList.toggle("active", active);
    button.textContent = active ? "Favori" : "Ajouter aux favoris";
  });
}

function toggleFavorite(id) {
  const favorites = store.get("mathemator:favorites", []);
  const active = favorites.includes(id);
  const next = active ? favorites.filter((item) => item !== id) : [...favorites, id];
  store.set("mathemator:favorites", next);
  bindFavorites();
  if (activeScreen === "search") renderSearch();
  renderProgress();
  renderFavorites();
}

function bindDetailButtons() {
  document.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (event.target.closest("[data-favorite]")) return;
      openDetail(button.dataset.open);
    });
    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openDetail(button.dataset.open);
    });
  });
}

function renderFavorites() {
  const favorites = store.get("mathemator:favorites", []);
  const typeFilter = $("#favoriteTypeFilter");
  const list = $("#favoritesList");
  const items = favorites.map((id) => searchIndex.find((entry) => entry.id === id) || { id, type: "Favori", title: id, meta: "", text: "Élément enregistré." });
  const types = [...new Set(items.map((item) => item.type))].sort((a, b) => a.localeCompare(b, "fr"));
  typeFilter.innerHTML = optionList(types);
  if (activeFavoriteType !== "Tous" && !types.includes(activeFavoriteType)) activeFavoriteType = "Tous";
  typeFilter.value = activeFavoriteType;
  const visible = items.filter((item) => activeFavoriteType === "Tous" || item.type === activeFavoriteType);
  $("#favoriteStats").innerHTML = `
    <strong>${items.length}</strong><span>favoris</span>
    <strong>${visible.length}</strong><span>affichés</span>
    <strong>${types.length}</strong><span>types</span>
  `;
  list.innerHTML = visible.length
    ? visible.map(({ id, type, title, meta, text }) => card(
      title,
      text,
      `${type}${meta ? ` · ${meta}` : ""}`,
      `<div class="card-actions"><button class="mini-button" type="button" data-open="${id}">Ouvrir</button>${favoriteButton(id, title)}</div>`
    )).join("")
    : card("Aucun favori", "Ajoute des mathématiciens, théorèmes, formules, exercices ou objets depuis les fiches et les résultats.", "Collection");
  typeFilter.onchange = () => {
    activeFavoriteType = typeFilter.value;
    renderFavorites();
  };
  bindFavorites();
  bindDetailButtons();
}

function detailList(label, items) {
  if (!items?.length) return "";
  return `<section><h3>${label}</h3><ul>${fieldList(items)}</ul></section>`;
}

function detailDefinition(label, value) {
  if (!value) return "";
  return `<section><h3>${label}</h3><p>${value}</p></section>`;
}

function mediaActivities(item) {
  const generated = item.license === "Création Mathemator";
  const base = [
    `Situer ${item.title} dans le domaine ${item.domain}.`,
    `Relier cette ressource aux notions : ${(item.links || []).join(", ")}.`,
    generated ? `Utiliser cette visualisation comme support d'exploration ou de démonstration en classe.` : `Comparer l'image ouverte avec une version générée dans le style Mathemator.`,
  ];
  if (item.type.includes("interactive") || item.type.includes("Simulation")) {
    base.push("Modifier les paramètres de la figure dans le laboratoire associé.");
  }
  if (item.type.includes("Carte")) {
    base.push("Repérer les lieux liés dans la carte du monde de l'application.");
  }
  if (item.type.includes("Portrait") || item.type.includes("Manuscrit") || item.type.includes("Page")) {
    base.push("Associer la source historique aux mathématiciens et ouvrages correspondants.");
  }
  return base;
}

function detailFor(entry) {
  const item = entry.payload;
  if (entry.type === "Mathématicien") {
    return `
      <div class="detail-lead">
        <div class="portrait" aria-hidden="true">${item.portrait}</div>
        <p>${item.biography}</p>
      </div>
      ${detailList("Chronologie", item.timeline)}
      ${detailList("Domaines", item.domains)}
      ${detailList("Découvertes", item.discoveries)}
      ${detailList("Publications", item.publications)}
      ${detailList("Citations", item.quotes)}
      ${detailList("Élèves", item.students)}
      ${detailList("Professeurs", item.teachers)}
      ${detailList("Collaborateurs", item.collaborators)}
      ${detailList("Distinctions", item.distinctions)}
      ${detailList("Objets nommés", item.namedObjects)}
      ${detailList("Théorèmes associés", item.theorems)}
      <section><h3>Équations</h3>${item.equations.map((equation) => `<p>${latex(equation)}</p>`).join("")}</section>
      ${detailList("Anecdotes", item.anecdotes)}
      ${detailList("Bibliographie", item.bibliography)}
      ${detailList("Liens", item.links.map((link) => `<a href="${link}" target="_blank" rel="noreferrer">${link}</a>`))}
    `;
  }
  if (entry.type === "Théorème") {
    return `
      <section><h3>Énoncé</h3><p>${latex(item.latex)}</p></section>
      ${detailDefinition("Explication intuitive", item.intuition)}
      ${detailDefinition("Démonstration", item.proof)}
      ${detailList("Variantes", item.variants)}
      ${detailDefinition("Généralisation", item.generalization)}
      ${detailDefinition("Applications", item.applications)}
      ${detailDefinition("Historique", item.history)}
      ${detailDefinition("Découvreur", item.discoverer)}
      ${detailList("Exercices", item.exercises)}
      ${detailList("Références", item.references)}
    `;
  }
  if (entry.type === "Formule") {
    return `
      <section><h3>Formule</h3><p>${latex(item.latex)}</p></section>
      ${detailDefinition("Catégorie", item.category)}
      ${detailDefinition("Explication", item.explanation)}
      ${detailList("Exemples", item.examples)}
      ${detailDefinition("Démonstration", item.proof)}
      ${detailList("Cas d'utilisation", item.uses)}
    `;
  }
  if (entry.type === "Domaine") {
    return `
      ${detailDefinition("Présentation", item.intro)}
      ${detailDefinition("Historique", item.history)}
      ${detailList("Concepts fondamentaux", item.concepts)}
      ${detailList("Théorèmes majeurs", item.theorems)}
      ${detailList("Méthodes", item.methods)}
      ${detailList("Sous-domaines", item.subdomains)}
      ${detailList("Domaines liés", item.related)}
      ${detailDefinition("Applications", item.applications)}
      ${detailDefinition("Mathématiciens associés", item.people)}
    `;
  }
  if (entry.type === "Objet") {
    return `
      ${detailDefinition("Description", item.description)}
      ${detailDefinition("Histoire", item.history)}
      ${detailDefinition("Catégorie", item.category)}
      ${detailDefinition("Dimension", item.dimension)}
      ${detailList("Propriétés", item.properties)}
      ${detailDefinition("Applications", item.applications)}
      ${detailDefinition("Visualisation", `Module prévu : ${item.visualization}`)}
      ${detailDefinition("Interaction", item.interactive)}
      ${detailDefinition("Formule ou modèle", item.formula)}
      ${detailList("Objets liés", item.related)}
    `;
  }
  if (entry.type === "Exercice") {
    return `
      ${detailDefinition("Énoncé", item.prompt)}
      ${detailDefinition("Classement", `${item.level} · ${item.domain} · ${item.difficulty} · ${item.time}`)}
      ${detailDefinition("Indice", item.hint)}
      ${detailDefinition("Correction", item.solution)}
      ${detailDefinition("Démonstration", item.proof)}
    `;
  }
  if (entry.type === "Problème") {
    return `
      ${detailDefinition("Présentation", item.text)}
      ${detailDefinition("Historique", item.history)}
      ${detailDefinition("État actuel", item.current)}
      ${detailDefinition("Avancées récentes", item.advances)}
      ${detailDefinition("Impact", item.impact)}
    `;
  }
  if (entry.type === "Quiz") {
    return `
      ${detailDefinition("Question", item.question)}
      ${detailList("Réponses proposées", item.options)}
      ${detailDefinition("Réponse attendue", item.options[item.correct])}
      ${detailDefinition("Explication", item.explanation)}
      ${detailDefinition("Classement", `${item.domain} · ${item.mode} · ${item.difficulty} · ${item.points} points`)}
    `;
  }
  if (entry.type === "Livre") {
    return `
      ${detailDefinition("Auteur", item.author)}
      ${detailDefinition("Catégorie", item.category)}
      ${detailDefinition("Niveau", item.level)}
      ${detailDefinition("Description", item.description)}
    `;
  }
  if (entry.type === "Glossaire") {
    return `
      ${detailDefinition("Définition", item.definition)}
      ${detailList("Renvois automatiques", item.links)}
    `;
  }
  if (entry.type === "Média") {
    return `
      <div class="media-detail-visual">${mediaVisual(item, true)}</div>
      ${detailDefinition("Description", item.description)}
      ${detailList("À explorer", mediaActivities(item))}
      <section>
        <h3>Attribution</h3>
        <dl class="detail-kv">
          <dt>Type</dt><dd>${item.type}</dd>
          <dt>Domaine</dt><dd>${item.domain}</dd>
          <dt>Période</dt><dd>${item.period}</dd>
          <dt>Source</dt><dd>${item.source}</dd>
          <dt>Licence</dt><dd>${item.license}</dd>
          <dt>Format</dt><dd>${item.format}</dd>
        </dl>
      </section>
      ${item.sourceUrl ? detailDefinition("Page source", `<a href="${item.sourceUrl}" target="_blank" rel="noreferrer">Ouvrir la page source</a>`) : ""}
      ${detailList("Liens conceptuels", item.links)}
    `;
  }
  return detailDefinition("Résumé", entry.text);
}

function openDetail(id) {
  const entry = searchIndex.find((item) => item.id === id);
  if (!entry) return;
  $("#detailType").textContent = entry.type;
  $("#detailTitle").textContent = entry.title;
  $("#detailBody").innerHTML = `
    <div class="detail-actions">${favoriteButton(entry.id, entry.title)}</div>
    ${detailFor(entry)}
  `;
  $("#detailPanel").hidden = false;
  bindFavorites();
  renderMath();
  $("#detailPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderTimeline() {
  const timeline = $("#timeline");
  const periodButtons = ["Toutes", ...timelineItems.map(({ period }) => period)];
  const draw = () => {
    const rawQuery = $("#timelineSearch")?.value ?? "";
    const query = normalize(rawQuery);
    const visible = timelineItems
      .filter((item) => activeTimelinePeriod === "Toutes" || item.period === activeTimelinePeriod)
      .filter((item) => !query || normalize(asSearchText(item)).includes(query));
    const totals = visible.reduce((acc, item) => {
      acc.people += item.people.length;
      acc.discoveries += item.discoveries.length;
      acc.publications += item.publications.length;
      acc.events += item.events.length;
      return acc;
    }, { people: 0, discoveries: 0, publications: 0, events: 0 });
    timeline.innerHTML = `
      <div class="timeline-controls">
        <label for="timelineSearch">Explorer la frise</label>
        <input id="timelineSearch" type="search" placeholder="Période, mathématicien, découverte, publication...">
        <div class="timeline-periods">
          ${periodButtons.map((period) => `<button class="${period === activeTimelinePeriod ? "active" : ""}" type="button" data-timeline-period="${period}">${period}</button>`).join("")}
        </div>
      </div>
      <div class="timeline-stats" aria-label="Statistiques de la chronologie">
        <span><strong>${visible.length}</strong> périodes</span>
        <span><strong>${totals.people}</strong> mathématiciens</span>
        <span><strong>${totals.discoveries}</strong> découvertes</span>
        <span><strong>${totals.publications}</strong> publications</span>
        <span><strong>${totals.events}</strong> événements</span>
      </div>
      <div class="timeline-track">
        ${visible.map((item) => timelineCard(item)).join("") || card("Aucun résultat", "Aucune période ne correspond à cette recherche.", "Chronologie")}
      </div>
    `;
    const search = $("#timelineSearch");
    search.value = rawQuery;
    search.addEventListener("input", draw);
    document.querySelectorAll("[data-timeline-period]").forEach((button) => {
      button.addEventListener("click", () => {
        activeTimelinePeriod = button.dataset.timelinePeriod;
        draw();
      });
    });
  };
  draw();
}

function timelineList(title, items) {
  return `
    <section class="timeline-list">
      <h3>${title}</h3>
      <ul>${fieldList(items)}</ul>
    </section>
  `;
}

function timelineCard({ period, range, text, people, discoveries, publications, events }) {
  return `
    <article class="timeline-card">
      <div class="timeline-marker">
        <time>${period}</time>
        <span>${range}</span>
      </div>
      <div class="timeline-content">
        <p>${text}</p>
        <div class="timeline-columns">
          ${timelineList("Mathématiciens", people)}
          ${timelineList("Découvertes", discoveries)}
          ${timelineList("Publications importantes", publications)}
          ${timelineList("Événements scientifiques", events)}
        </div>
      </div>
    </article>
  `;
}

function renderMathematicians() {
  $("#personGrid").innerHTML = mathematicians.map((person) => `
    <article class="person-card">
      <div class="portrait" aria-hidden="true">${person.portrait}</div>
      <div>
        <span>${person.nationality} · ${person.period} · ${person.birth}-${person.death}</span>
        <h3>${person.name}</h3>
        <p>${person.biography}</p>
      </div>
      <dl>
        <dt>Domaines</dt><dd>${person.domains.join(", ")}</dd>
        <dt>Chronologie</dt><dd>${person.timeline.join(" · ")}</dd>
        <dt>Découvertes</dt><dd>${person.discoveries.join(", ")}</dd>
        <dt>Publications</dt><dd>${person.publications.join(", ")}</dd>
        <dt>Élèves</dt><dd>${person.students.join(", ")}</dd>
        <dt>Professeurs</dt><dd>${person.teachers.join(", ")}</dd>
        <dt>Collaborateurs</dt><dd>${person.collaborators.join(", ")}</dd>
        <dt>Distinctions</dt><dd>${person.distinctions.join(", ")}</dd>
        <dt>Objets</dt><dd>${person.namedObjects.join(", ")}</dd>
        <dt>Théorèmes</dt><dd>${person.theorems.join(", ")}</dd>
        <dt>Équations</dt><dd>${person.equations.map(latex).join(", ")}</dd>
        <dt>Anecdotes</dt><dd>${person.anecdotes.join(" ")}</dd>
        <dt>Bibliographie</dt><dd>${person.bibliography.join(", ")}</dd>
      </dl>
      <div class="card-actions">
        <button class="mini-button" type="button" data-open="person:${person.id}">Ouvrir</button>
        ${favoriteButton(`person:${person.id}`, person.name)}
      </div>
    </article>
  `).join("");
  bindFavorites();
  bindDetailButtons();
  renderMath();
}

function renderMap() {
  const input = $("#mapFilter");
  const kindFilter = $("#mapKindFilter");
  const countryFilter = $("#mapCountryFilter");
  const list = $("#mapList");
  const stats = $("#mapStats");
  const svg = $("#worldMap");
  const detail = $("#mapDetail");
  const mapKinds = [...new Set(places.flatMap((place) => place.types || [place.kind]))].sort();
  const mapCountries = [...new Set(places.map((place) => place.country))].sort((a, b) => a.localeCompare(b, "fr"));
  kindFilter.innerHTML = optionList(mapKinds);
  countryFilter.innerHTML = optionList(mapCountries);
  const draw = () => {
    const query = normalize(input.value.trim());
    const visible = places
      .filter((place) => !query || normalize(asSearchText(place)).includes(query))
      .filter((place) => activeMapKind === "Tous" || (place.types || [place.kind]).includes(activeMapKind))
      .filter((place) => activeMapCountry === "Tous" || place.country === activeMapCountry);
    if (!visible.some((place) => mapPlaceId(place) === activeMapPlace)) {
      activeMapPlace = visible[0] ? mapPlaceId(visible[0]) : "";
    }
    const selected = visible.find((place) => mapPlaceId(place) === activeMapPlace);
    kindFilter.value = activeMapKind;
    countryFilter.value = activeMapCountry;
    stats.innerHTML = `
      <strong>${visible.length}</strong><span>lieux</span>
      <strong>${new Set(visible.map((place) => place.country)).size}</strong><span>pays</span>
      <strong>${new Set(visible.flatMap((place) => place.institutions || [])).size}</strong><span>institutions</span>
      <strong>${visible.filter((place) => place.births?.length).length}</strong><span>naissances</span>
    `;
    svg.innerHTML = `
      <path class="land" d="M80 180 C170 90 260 120 330 165 C410 215 480 120 570 150 C675 185 780 130 840 220 C760 318 620 300 530 340 C430 386 345 300 250 335 C155 370 70 292 80 180Z"/>
      <path class="land muted-land" d="M125 255 C205 220 295 240 356 285 C280 330 190 345 125 255Z"/>
      <path class="land muted-land" d="M610 245 C660 210 735 210 790 242 C750 288 666 300 610 245Z"/>
      <path class="land muted-land" d="M720 350 C785 335 830 365 815 405 C755 420 705 395 720 350Z"/>
      ${visible.map((place) => `
        <g class="map-pin ${mapPlaceId(place) === activeMapPlace ? "active" : ""}" tabindex="0" role="button" data-map-place="${mapPlaceId(place)}" transform="translate(${place.x} ${place.y})">
          <circle r="11"></circle>
          <text x="16" y="5">${place.city}</text>
          <title>${place.kind} · ${place.city}, ${place.country} · ${place.people} · ${place.note}</title>
        </g>
      `).join("")}
    `;
    detail.innerHTML = selected ? mapDetail(selected) : card("Aucun lieu", "Aucun lieu ne correspond aux filtres actifs.", "Carte");
    list.innerHTML = visible.map((place) => `
      <button class="map-list-item ${mapPlaceId(place) === activeMapPlace ? "active" : ""}" type="button" data-map-place="${mapPlaceId(place)}">
        <span>${place.kind} · ${place.country}</span>
        <strong>${place.city}</strong>
        <small>${place.people}</small>
      </button>
    `).join("");
    document.querySelectorAll("[data-map-place]").forEach((node) => {
      node.addEventListener("click", () => {
        activeMapPlace = node.dataset.mapPlace;
        draw();
      });
      node.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activeMapPlace = node.dataset.mapPlace;
          draw();
        }
      });
    });
  };
  input.addEventListener("input", draw);
  kindFilter.addEventListener("change", () => {
    activeMapKind = kindFilter.value;
    draw();
  });
  countryFilter.addEventListener("change", () => {
    activeMapCountry = countryFilter.value;
    draw();
  });
  draw();
}

function mapPlaceId({ city, country }) {
  return `${city}:${country}`;
}

function mapDetail(place) {
  const meta = `${place.kind} · ${place.city}, ${place.country}`;
  return `
    <article>
      <span>${meta}</span>
      <h3>${place.city}</h3>
      <p>${place.note}</p>
      <dl>
        <dt>Mathématiciens</dt><dd>${place.people}</dd>
        <dt>Institutions</dt><dd>${(place.institutions || []).join(", ") || "Non renseigné"}</dd>
        <dt>Types</dt><dd>${(place.types || [place.kind]).join(", ")}</dd>
        <dt>Naissances</dt><dd>${(place.births || []).join(", ") || "Non renseigné"}</dd>
        <dt>Décès</dt><dd>${(place.deaths || []).join(", ") || "Non renseigné"}</dd>
        <dt>Périodes</dt><dd>${(place.periods || []).join(", ") || "Non renseigné"}</dd>
      </dl>
    </article>
  `;
}

function renderDomains() {
  const grid = $("#domainGrid");
  const search = $("#domainSearch");
  const familyFilter = $("#domainFamilyFilter");
  const stats = $("#domainStats");
  const families = [...new Set(domains.map((domain) => domain.family).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  familyFilter.innerHTML = optionList(families, "Toutes");
  const draw = () => {
    const query = normalize(search.value.trim());
    const visible = domains
      .filter((domain) => activeDomainFamily === "Tous" || domain.family === activeDomainFamily)
      .filter((domain) => !query || normalize(asSearchText(domain)).includes(query));
    familyFilter.value = activeDomainFamily;
    stats.innerHTML = `
      <strong>${visible.length}</strong><span>domaines</span>
      <strong>${new Set(visible.map((domain) => domain.family)).size}</strong><span>familles</span>
      <strong>${visible.reduce((sum, domain) => sum + domain.concepts.length, 0)}</strong><span>concepts</span>
      <strong>${visible.reduce((sum, domain) => sum + domain.theorems.length, 0)}</strong><span>théorèmes</span>
    `;
    grid.innerHTML = visible.map((domain) => domainCard(domain)).join("") || card("Aucun domaine", "Aucune discipline ne correspond aux filtres actifs.", "Encyclopédie");
    bindFavorites();
    bindDetailButtons();
  };
  search.addEventListener("input", draw);
  familyFilter.addEventListener("change", () => {
    activeDomainFamily = familyFilter.value;
    draw();
  });
  draw();
}

function domainCard({ name, family, intro, history, concepts, theorems: domainTheorems, applications, people, methods, subdomains, related }) {
  return `
    <article class="domain-card">
      <div class="domain-card-header">
        <span>${family}</span>
        <h3>${name}</h3>
      </div>
      <p>${intro}</p>
      <dl>
        <dt>Historique</dt><dd>${history}</dd>
        <dt>Concepts</dt><dd>${concepts.join(", ")}</dd>
        <dt>Théorèmes</dt><dd>${domainTheorems.join(", ")}</dd>
        <dt>Méthodes</dt><dd>${(methods || []).join(", ")}</dd>
        <dt>Sous-domaines</dt><dd>${(subdomains || []).join(", ")}</dd>
        <dt>Applications</dt><dd>${applications}</dd>
        <dt>Figures</dt><dd>${people}</dd>
        <dt>Liens</dt><dd>${(related || []).join(", ")}</dd>
      </dl>
      <div class="card-actions">
        <button class="mini-button" type="button" data-open="domain:${name}">Ouvrir</button>
        ${favoriteButton(`domain:${name}`, name)}
      </div>
    </article>
  `;
}

function renderReferences() {
  const tabs = ["Théorèmes", "Formules"];
  $("#referenceTabs").innerHTML = tabs.map((tab) => `<button class="${tab === activeReference ? "active" : ""}" type="button">${tab}</button>`).join("");
  const theoremTools = $("#theoremTools");
  const formulaTools = $("#formulaTools");
  theoremTools.hidden = activeReference !== "Théorèmes";
  formulaTools.hidden = activeReference !== "Formules";
  if (activeReference === "Théorèmes") {
    renderTheoremReference();
  } else {
    renderFormulaReference();
  }
  bindReferenceTabs();
}

function renderTheoremReference() {
  const search = $("#theoremSearch");
  const domainFilter = $("#theoremDomainFilter");
  const discovererFilter = $("#theoremDiscovererFilter");
  const stats = $("#theoremStats");
  const panel = $("#referencePanel");
  const theoremDomains = [...new Set(theorems.map(theoremDomain))].sort((a, b) => a.localeCompare(b, "fr"));
  const theoremDiscoverers = [...new Set(theorems.map((item) => item.discoverer))].sort((a, b) => a.localeCompare(b, "fr"));
  domainFilter.innerHTML = optionList(theoremDomains);
  discovererFilter.innerHTML = optionList(theoremDiscoverers);
  const draw = () => {
    const query = normalize(search.value.trim());
    const visible = theorems
      .filter((item) => activeTheoremDomain === "Tous" || theoremDomain(item) === activeTheoremDomain)
      .filter((item) => activeTheoremDiscoverer === "Tous" || item.discoverer === activeTheoremDiscoverer)
      .filter((item) => !query || normalize(asSearchText(item)).includes(query));
    domainFilter.value = activeTheoremDomain;
    discovererFilter.value = activeTheoremDiscoverer;
    stats.innerHTML = `
      <strong>${visible.length}</strong><span>théorèmes</span>
      <strong>${new Set(visible.map(theoremDomain)).size}</strong><span>domaines</span>
      <strong>${new Set(visible.map((item) => item.discoverer)).size}</strong><span>découvreurs</span>
      <strong>${visible.reduce((sum, item) => sum + item.exercises.length, 0)}</strong><span>exercices</span>
    `;
    panel.innerHTML = visible.map(theoremCard).join("") || card("Aucun théorème", "Aucun résultat ne correspond aux filtres actifs.", "Référence");
    renderMath();
    bindFavorites();
    bindDetailButtons();
  };
  search.oninput = draw;
  domainFilter.onchange = () => {
    activeTheoremDomain = domainFilter.value;
    draw();
  };
  discovererFilter.onchange = () => {
    activeTheoremDiscoverer = discovererFilter.value;
    draw();
  };
  draw();
}

function theoremDomain(item) {
  return item.applications.split(",")[0]?.trim() || "Général";
}

function theoremCard(item) {
  return `
    <article class="theorem-card">
      <div class="theorem-card-header">
        <span>${theoremDomain(item)}</span>
        <h3>${item.name}</h3>
      </div>
      <div class="formula-render">${latex(item.latex)}</div>
      <p>${item.intuition}</p>
      <dl>
        <dt>Énoncé</dt><dd>${item.statement}</dd>
        <dt>Démonstration</dt><dd>${item.proof}</dd>
        <dt>Variantes</dt><dd>${item.variants.join(", ")}</dd>
        <dt>Généralisation</dt><dd>${item.generalization}</dd>
        <dt>Applications</dt><dd>${item.applications}</dd>
        <dt>Historique</dt><dd>${item.history}</dd>
        <dt>Découvreur</dt><dd>${item.discoverer}</dd>
        <dt>Exercices</dt><dd>${item.exercises.join(", ")}</dd>
        <dt>Références</dt><dd>${item.references.join(", ")}</dd>
      </dl>
      <div class="card-actions">
        <button class="mini-button" type="button" data-open="theorem:${item.name}">Ouvrir</button>
        ${favoriteButton(`theorem:${item.name}`, item.name)}
      </div>
    </article>
  `;
}

function renderFormulaReference() {
  const search = $("#formulaSearch");
  const categoryFilter = $("#formulaCategoryFilter");
  const useFilter = $("#formulaUseFilter");
  const stats = $("#formulaStats");
  const panel = $("#referencePanel");
  const categories = [...new Set(formulas.map((item) => item.category))].sort((a, b) => a.localeCompare(b, "fr"));
  const uses = [...new Set(formulas.flatMap((item) => item.uses))].sort((a, b) => a.localeCompare(b, "fr"));
  categoryFilter.innerHTML = optionList(categories);
  useFilter.innerHTML = optionList(uses);
  const draw = () => {
    const query = normalize(search.value.trim());
    const visible = formulas
      .filter((item) => activeFormulaCategory === "Tous" || item.category === activeFormulaCategory)
      .filter((item) => activeFormulaUse === "Tous" || item.uses.includes(activeFormulaUse))
      .filter((item) => !query || normalize(asSearchText(item)).includes(query));
    categoryFilter.value = activeFormulaCategory;
    useFilter.value = activeFormulaUse;
    stats.innerHTML = `
      <strong>${visible.length}</strong><span>formules</span>
      <strong>${new Set(visible.map((item) => item.category)).size}</strong><span>catégories</span>
      <strong>${new Set(visible.flatMap((item) => item.uses)).size}</strong><span>usages</span>
      <strong>${visible.reduce((sum, item) => sum + item.examples.length, 0)}</strong><span>exemples</span>
    `;
    panel.innerHTML = visible.map(formulaCard).join("") || card("Aucune formule", "Aucune formule ne correspond aux filtres actifs.", "Référence");
    renderMath();
    bindFavorites();
    bindDetailButtons();
  };
  search.oninput = draw;
  categoryFilter.onchange = () => {
    activeFormulaCategory = categoryFilter.value;
    draw();
  };
  useFilter.onchange = () => {
    activeFormulaUse = useFilter.value;
    draw();
  };
  draw();
}

function formulaCard(item) {
  return `
    <article class="formula-card">
      <div class="formula-card-header">
        <span>${item.category}</span>
        <h3>${item.name}</h3>
      </div>
      <div class="formula-render">${latex(item.latex)}</div>
      <p>${item.explanation}</p>
      <dl>
        <dt>Expression</dt><dd>${item.expression}</dd>
        <dt>Exemples</dt><dd>${item.examples.join(", ")}</dd>
        <dt>Démonstration</dt><dd>${item.proof}</dd>
        <dt>Cas d'utilisation</dt><dd>${item.uses.join(", ")}</dd>
      </dl>
      <div class="card-actions">
        <button class="mini-button" type="button" data-open="formula:${item.name}">Ouvrir</button>
        ${favoriteButton(`formula:${item.name}`, item.name)}
      </div>
    </article>
  `;
}

function bindReferenceTabs() {
  renderMath();
  $("#referenceTabs").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeReference = button.textContent;
      renderReferences();
    });
  });
}

function renderObjects() {
  const grid = $("#objectGrid");
  const search = $("#objectSearch");
  const categoryFilter = $("#objectCategoryFilter");
  const dimensionFilter = $("#objectDimensionFilter");
  const stats = $("#objectStats");
  const categories = [...new Set(objects.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  const dimensions = [...new Set(objects.map((item) => item.dimension).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  categoryFilter.innerHTML = optionList(categories);
  dimensionFilter.innerHTML = optionList(dimensions);
  const draw = () => {
    const query = normalize(search.value.trim());
    const visible = objects
      .filter((item) => activeObjectCategory === "Tous" || item.category === activeObjectCategory)
      .filter((item) => activeObjectDimension === "Tous" || item.dimension === activeObjectDimension)
      .filter((item) => !query || normalize(asSearchText(item)).includes(query));
    categoryFilter.value = activeObjectCategory;
    dimensionFilter.value = activeObjectDimension;
    stats.innerHTML = `
      <strong>${visible.length}</strong><span>objets</span>
      <strong>${new Set(visible.map((item) => item.category)).size}</strong><span>catégories</span>
      <strong>${new Set(visible.map((item) => item.dimension)).size}</strong><span>dimensions</span>
      <strong>${visible.reduce((sum, item) => sum + item.properties.length, 0)}</strong><span>propriétés</span>
    `;
    grid.innerHTML = visible.map(objectCard).join("") || card("Aucun objet", "Aucun objet ne correspond aux filtres actifs.", "Galerie");
    bindFavorites();
    bindDetailButtons();
  };
  search.addEventListener("input", draw);
  categoryFilter.addEventListener("change", () => {
    activeObjectCategory = categoryFilter.value;
    draw();
  });
  dimensionFilter.addEventListener("change", () => {
    activeObjectDimension = dimensionFilter.value;
    draw();
  });
  draw();
}

function objectCard({ name, category, dimension, description, history, properties, applications, visualization, interactive }, index) {
  return `
    <article class="object-card">
      <div class="object-figure object-${visualization}" aria-hidden="true">${objectGlyph(visualization)}</div>
      <div class="object-card-header">
        <span>${category} · ${dimension}</span>
        <h3>${name}</h3>
      </div>
      <p>${description}</p>
      <dl>
        <dt>Histoire</dt><dd>${history}</dd>
        <dt>Propriétés</dt><dd>${properties.join(", ")}</dd>
        <dt>Applications</dt><dd>${applications}</dd>
        <dt>Interaction</dt><dd>${interactive}</dd>
      </dl>
      <div class="card-actions">
        <button class="mini-button" type="button" data-open="object:${name}">Ouvrir</button>
        ${favoriteButton(`object:${name}`, name)}
      </div>
    </article>
  `;
}

function objectGlyph(type) {
  const glyphs = {
    twist: "∞",
    surface: "∿",
    mandelbrot: "M",
    julia: "J",
    sierpinski: "△",
    menger: "▦",
    koch: "⌁",
    polyhedra: "⬡",
    tiling: "▧",
    minimal: "H=0",
    platonic: "◇",
    archimedean: "◈"
  };
  return glyphs[type] || "∗";
}

function renderLearning() {
  renderExercise();
  renderQuiz();
  renderProgress();
}

function renderExercise() {
  const search = $("#exerciseSearch");
  const levelFilter = $("#exerciseLevelFilter");
  const domainFilter = $("#exerciseDomainFilter");
  const difficultyFilter = $("#exerciseDifficultyFilter");
  const timeFilter = $("#exerciseTimeFilter");
  levelFilter.innerHTML = optionList([...new Set(exercises.map((item) => item.level))].sort((a, b) => a.localeCompare(b, "fr")));
  domainFilter.innerHTML = optionList([...new Set(exercises.map((item) => item.domain))].sort((a, b) => a.localeCompare(b, "fr")));
  difficultyFilter.innerHTML = optionList([...new Set(exercises.map((item) => item.difficulty))], "Toutes");
  timeFilter.innerHTML = optionList(["Moins de 10 min", "10 à 15 min", "16 à 20 min", "Plus de 20 min"]);
  const draw = () => {
    const query = normalize(search.value.trim());
    const visible = exercises
      .filter((item) => activeExerciseLevel === "Tous" || item.level === activeExerciseLevel)
      .filter((item) => activeExerciseDomain === "Tous" || item.domain === activeExerciseDomain)
      .filter((item) => activeExerciseDifficulty === "Tous" || item.difficulty === activeExerciseDifficulty)
      .filter((item) => activeExerciseTime === "Tous" || exerciseTimeBucket(item.estimatedMinutes) === activeExerciseTime)
      .filter((item) => !query || normalize(asSearchText(item)).includes(query));
    if (!visible.some((item) => item.id === activeExerciseId)) {
      activeExerciseId = visible[0]?.id || "";
      hintVisible = false;
    }
    const selected = visible.find((item) => item.id === activeExerciseId);
    levelFilter.value = activeExerciseLevel;
    domainFilter.value = activeExerciseDomain;
    difficultyFilter.value = activeExerciseDifficulty;
    timeFilter.value = activeExerciseTime;
    $("#exerciseStats").innerHTML = `
      <strong>${visible.length}</strong><span>exercices</span>
      <strong>${new Set(visible.map((item) => item.domain)).size}</strong><span>domaines</span>
      <strong>${new Set(visible.map((item) => item.level)).size}</strong><span>niveaux</span>
      <strong>${Math.round(visible.reduce((sum, item) => sum + item.estimatedMinutes, 0) / Math.max(visible.length, 1))}</strong><span>min moy.</span>
    `;
    $("#exerciseBox").innerHTML = selected ? `
      <div class="exercise-layout">
        <div class="exercise-list">
          ${visible.slice(0, 36).map((item) => `
            <button class="${item.id === selected.id ? "active" : ""}" type="button" data-exercise-id="${item.id}">
              <span>${item.domain} · ${item.level}</span>
              <strong>${item.prompt}</strong>
              <small>${item.difficulty} · ${item.time}</small>
            </button>
          `).join("")}
        </div>
        <article class="exercise-detail">
          <span class="badge">${selected.domain} · ${selected.level} · ${selected.difficulty} · ${selected.time}</span>
          <h3>${selected.prompt}</h3>
          <dl>
            <dt>Type</dt><dd>${selected.type}</dd>
            <dt>Domaine</dt><dd>${selected.domain}</dd>
            <dt>Niveau</dt><dd>${selected.level}</dd>
            <dt>Temps estimé</dt><dd>${selected.time}</dd>
          </dl>
          ${hintVisible ? exerciseCorrection(selected) : `<p class="muted">Active l'indice pour afficher la correction, la solution détaillée et la démonstration.</p>`}
          <div class="card-actions">
            <button class="mini-button" id="completeExerciseButton" type="button">Marquer réalisé</button>
            <button class="mini-button" id="nextExerciseButton" type="button">Exercice suivant</button>
            ${favoriteButton(`exercise:${exercises.indexOf(selected)}`, selected.prompt)}
          </div>
        </article>
      </div>
    ` : card("Aucun exercice", "Aucun exercice ne correspond aux filtres actifs.", "Exercices");
    $("#exerciseBox").querySelectorAll("[data-exercise-id]").forEach((button) => {
      button.addEventListener("click", () => {
        activeExerciseId = button.dataset.exerciseId;
        hintVisible = false;
        draw();
      });
    });
    $("#completeExerciseButton")?.addEventListener("click", () => {
      bumpProgress("exercises", { domain: selected.domain, minutes: selected.estimatedMinutes || 3 });
      renderProgress();
    });
    $("#nextExerciseButton")?.addEventListener("click", () => {
      const index = visible.findIndex((item) => item.id === activeExerciseId);
      activeExerciseId = visible[(index + 1) % visible.length]?.id || activeExerciseId;
      currentExercise += 1;
      hintVisible = false;
      draw();
    });
    bindFavorites();
  };
  search.oninput = draw;
  levelFilter.onchange = () => {
    activeExerciseLevel = levelFilter.value;
    draw();
  };
  domainFilter.onchange = () => {
    activeExerciseDomain = domainFilter.value;
    draw();
  };
  difficultyFilter.onchange = () => {
    activeExerciseDifficulty = difficultyFilter.value;
    draw();
  };
  timeFilter.onchange = () => {
    activeExerciseTime = timeFilter.value;
    draw();
  };
  draw();
}

function exerciseTimeBucket(minutes = 0) {
  if (minutes < 10) return "Moins de 10 min";
  if (minutes <= 15) return "10 à 15 min";
  if (minutes <= 20) return "16 à 20 min";
  return "Plus de 20 min";
}

function exerciseCorrection(exercise) {
  return `
    <section class="exercise-solution">
      <h4>Indice</h4>
      <p>${exercise.hint}</p>
      <h4>Correction</h4>
      <p>${exercise.correction || exercise.solution}</p>
      <h4>Solution détaillée</h4>
      <p>${exercise.detailedSolution || exercise.solution}</p>
      <h4>Démonstration</h4>
      <p>${exercise.proof}</p>
      <h4>Références</h4>
      <ul>${fieldList(exercise.references || [])}</ul>
    </section>
  `;
}

function renderQuiz() {
  clearQuizTimer();
  const modeSelect = $("#quizModeSelect");
  modeSelect.value = activeQuizMode;
  const visible = quiz.filter((item) => item.mode === activeQuizMode);
  const items = visible.length ? visible : quiz;
  const current = activeQuizMode === "Défis quotidiens" ? dailyQuiz(items) : items[currentQuiz % items.length];
  quizAnswered = false;
  const modeLabel = activeQuizMode === "Multijoueur (à envisager)" ? "Multijoueur à envisager" : activeQuizMode;
  $("#quizBox").innerHTML = `
    <div class="quiz-head">
      <span class="badge">${modeLabel}</span>
      <div class="quiz-score">
        <span><strong>${quizScore}</strong> pts</span>
        <span><strong>${quizStreak}</strong> série</span>
        <span><strong>${items.length}</strong> questions</span>
      </div>
    </div>
    ${activeQuizMode === "Multijoueur (à envisager)" ? multiplayerPreview(items) : quizQuestionMarkup(current)}
  `;
  if (activeQuizMode !== "Multijoueur (à envisager)") {
    $("#quizBox").querySelectorAll("[data-answer]").forEach((button) => {
      button.addEventListener("click", () => answerQuiz(current, Number(button.dataset.answer)));
    });
    bindFavorites();
    if (activeQuizMode === "Chronométré") startQuizTimer(current);
  }
}

function quizQuestionMarkup(current) {
  return `
    <article class="quiz-question">
      <span>${current.domain} · ${current.difficulty} · ${current.points} points</span>
      <h3>${current.question}</h3>
      ${activeQuizMode === "Chronométré" ? `<div class="quiz-timer"><span id="quizTimerBar"></span></div><p id="quizTimerText" class="muted">${current.timeLimit}s restantes</p>` : ""}
      <div class="answer-grid">
        ${current.options.map((option, index) => `<button type="button" data-answer="${index}">${option}</button>`).join("")}
      </div>
      <div class="card-actions">${favoriteButton(`quiz:${current.id}`, current.question)}</div>
      <p id="quizFeedback" class="muted">${quizModePrompt()}</p>
    </article>
  `;
}

function quizModePrompt() {
  if (activeQuizMode === "Chronométré") return "Réponds avant la fin du compte à rebours.";
  if (activeQuizMode === "Championnat") return "Enchaîne les bonnes réponses pour augmenter la série.";
  if (activeQuizMode === "Défis quotidiens") return "Question du jour, stable pour la date courante.";
  return "Sélectionne une réponse.";
}

function answerQuiz(current, answer) {
  if (quizAnswered) return;
  quizAnswered = true;
  clearQuizTimer();
  const ok = answer === current.correct;
  const feedback = $("#quizFeedback");
  const buttons = $("#quizBox").querySelectorAll("[data-answer]");
  buttons.forEach((button) => {
    const index = Number(button.dataset.answer);
    button.disabled = true;
    button.classList.toggle("correct", index === current.correct);
    button.classList.toggle("wrong", index === answer && !ok);
  });
  if (ok) {
    quizStreak += 1;
    const bonus = activeQuizMode === "Championnat" ? Math.min(quizStreak * 2, 20) : 0;
    quizScore += current.points + bonus;
    bumpProgress("quiz", { domain: current.domain, minutes: 2, streak: quizStreak });
  } else {
    quizStreak = 0;
  }
  feedback.innerHTML = `
    <strong>${ok ? "Réponse correcte." : `Réponse attendue : ${current.options[current.correct]}.`}</strong>
    <span>${current.explanation || ""}</span>
  `;
  renderProgress();
}

function dailyQuiz(items) {
  const day = Math.floor(Date.now() / 86400000);
  return items[day % items.length];
}

function multiplayerPreview(items) {
  const domains = [...new Set(items.map((item) => item.domain))].slice(0, 6);
  return `
    <article class="quiz-question">
      <h3>Mode multijoueur à envisager</h3>
      <p class="muted">Structure prête pour salons, manches synchronisées, score partagé et défis entre joueurs.</p>
      <div class="quiz-lobby">
        <span><strong>2-4</strong> joueurs</span>
        <span><strong>${items.length}</strong> questions disponibles</span>
        <span><strong>${domains.join(", ")}</strong></span>
      </div>
    </article>
  `;
}

function startQuizTimer(current) {
  quizTimeLeft = current.timeLimit || 30;
  updateQuizTimer(current);
  quizTimer = setInterval(() => {
    quizTimeLeft -= 1;
    updateQuizTimer(current);
    if (quizTimeLeft <= 0) {
      clearQuizTimer();
      if (!quizAnswered) {
        quizAnswered = true;
        quizStreak = 0;
        $("#quizFeedback").innerHTML = `<strong>Temps écoulé.</strong><span>Réponse attendue : ${current.options[current.correct]}. ${current.explanation || ""}</span>`;
        $("#quizBox").querySelectorAll("[data-answer]").forEach((button) => {
          button.disabled = true;
          button.classList.toggle("correct", Number(button.dataset.answer) === current.correct);
        });
      }
    }
  }, 1000);
}

function updateQuizTimer(current) {
  $("#quizTimerText").textContent = `${Math.max(quizTimeLeft, 0)}s restantes`;
  $("#quizTimerBar").style.width = `${Math.max(0, (quizTimeLeft / (current.timeLimit || 30)) * 100)}%`;
}

function clearQuizTimer() {
  if (quizTimer) clearInterval(quizTimer);
  quizTimer = null;
}

function defaultProgress() {
  return { exercises: 0, quiz: 0, minutes: 12, domains: {}, days: [], bestStreak: 0 };
}

function getProgress() {
  const progress = store.get("mathemator:progress", defaultProgress());
  return {
    ...defaultProgress(),
    ...progress,
    domains: progress.domains || {},
    days: progress.days || [],
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function bumpProgress(key, details = {}) {
  const progress = getProgress();
  progress[key] = (progress[key] || 0) + 1;
  progress.minutes = (progress.minutes || 0) + (details.minutes || 3);
  progress.days = [...new Set([...(progress.days || []), todayKey()])];
  if (details.streak) progress.bestStreak = Math.max(progress.bestStreak || 0, details.streak);
  if (details.domain) {
    progress.domains[details.domain] ||= { exercises: 0, quiz: 0, minutes: 0 };
    if (key === "exercises") progress.domains[details.domain].exercises += 1;
    if (key === "quiz") progress.domains[details.domain].quiz += 1;
    progress.domains[details.domain].minutes += details.minutes || 3;
  }
  store.set("mathemator:progress", progress);
}

function favoriteDomains(favorites) {
  return favorites
    .map((id) => searchIndex.find((entry) => entry.id === id))
    .filter(Boolean)
    .flatMap((entry) => entry.domains || []);
}

function domainProgressRows(progress, favorites) {
  const favoriteCounts = favoriteDomains(favorites).reduce((acc, domain) => {
    acc[domain] = (acc[domain] || 0) + 1;
    return acc;
  }, {});
  return uniqueValues([Object.keys(progress.domains), Object.keys(favoriteCounts)])
    .map((domain) => {
      const stats = progress.domains[domain] || { exercises: 0, quiz: 0, minutes: 0 };
      const score = stats.exercises * 8 + stats.quiz * 10 + (favoriteCounts[domain] || 0) * 3;
      return { domain, ...stats, favorites: favoriteCounts[domain] || 0, score: Math.min(100, score) };
    })
    .sort((a, b) => b.score - a.score || a.domain.localeCompare(b.domain, "fr"));
}

function progressBadges(progress, favorites, domainRows) {
  return [
    { name: "Premier pas", text: "1 exercice réalisé", active: progress.exercises >= 1 },
    { name: "Série vive", text: "3 bonnes réponses de suite", active: progress.bestStreak >= 3 },
    { name: "Explorateur", text: "5 favoris enregistrés", active: favorites.length >= 5 },
    { name: "Régulier", text: "3 jours actifs", active: progress.days.length >= 3 },
    { name: "Polyvalent", text: "3 domaines travaillés", active: domainRows.length >= 3 },
    { name: "Maîtrise", text: "1 domaine à 60%", active: domainRows.some((row) => row.score >= 60) },
  ];
}

function renderProgress() {
  const progress = getProgress();
  const favorites = store.get("mathemator:favorites", []);
  const domainRows = domainProgressRows(progress, favorites);
  const badges = progressBadges(progress, favorites, domainRows);
  const unlocked = badges.filter((badge) => badge.active).length;
  const mastery = Math.round(Math.min(100, 12 + progress.exercises * 5 + progress.quiz * 4 + favorites.length * 3 + unlocked * 6 + domainRows.reduce((sum, row) => sum + row.score, 0) / 12));
  const topDomains = domainRows.slice(0, 5);
  $("#progressBox").innerHTML = `
    <div class="meter"><span style="width:${mastery}%"></span></div>
    <div class="stats-row">
      <strong>${progress.minutes}</strong><span>min</span>
      <strong>${progress.exercises}</strong><span>exercices</span>
      <strong>${progress.quiz}</strong><span>quiz</span>
      <strong>${favorites.length}</strong><span>favoris</span>
    </div>
    <p class="muted">Maîtrise estimée : ${mastery}%</p>
    <div class="progress-detail-grid">
      <article>
        <strong>${progress.bestStreak || 0}</strong>
        <span>meilleure série</span>
      </article>
      <article>
        <strong>${progress.days.length}</strong>
        <span>jours actifs</span>
      </article>
      <article>
        <strong>${domainRows.length}</strong>
        <span>domaines suivis</span>
      </article>
      <article>
        <strong>${unlocked}/${badges.length}</strong>
        <span>succès</span>
      </article>
    </div>
    <section class="progress-section">
      <h3>Domaines maîtrisés</h3>
      ${topDomains.length ? topDomains.map((row) => `
        <div class="domain-progress">
          <div><strong>${row.domain}</strong><span>${row.exercises} ex. · ${row.quiz} quiz · ${row.favorites} fav.</span></div>
          <div class="meter small"><span style="width:${row.score}%"></span></div>
        </div>
      `).join("") : `<p class="muted">Réalise un exercice, réussis un quiz ou ajoute un favori pour démarrer le suivi par domaine.</p>`}
    </section>
    <section class="progress-section">
      <h3>Badges</h3>
      <div class="achievement-grid">
        ${badges.map((badge) => `
          <article class="${badge.active ? "unlocked" : ""}">
            <strong>${badge.name}</strong>
            <span>${badge.text}</span>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function mediaVisual(item, large = false) {
  const label = item.title.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const sizeClass = large ? "large" : "";
  const visual = item.visual || "infographic";
  if (item.assetUrl) {
    return `
      <figure class="media-visual media-asset ${sizeClass} accent-${item.accent}">
        <img src="${item.assetUrl}" alt="${item.title}" loading="lazy" referrerpolicy="no-referrer" />
        <figcaption>${item.source}</figcaption>
      </figure>
    `;
  }
  if (visual === "portrait") {
    return `<div class="media-visual ${sizeClass} accent-${item.accent} media-portrait"><span>${label.slice(0, 2)}</span></div>`;
  }
  if (visual === "manuscript" || visual === "book") {
    return `
      <div class="media-visual ${sizeClass} accent-${item.accent} media-manuscript">
        <i></i><i></i><i></i><b></b>
      </div>
    `;
  }
  if (visual === "fractal") {
    return `
      <div class="media-visual ${sizeClass} accent-${item.accent} media-fractal">
        <span></span><span></span><span></span><span></span>
      </div>
    `;
  }
  if (visual === "polyhedron") {
    return `
      <div class="media-visual ${sizeClass} accent-${item.accent} media-polyhedron">
        <svg viewBox="0 0 120 90" aria-hidden="true">
          <path d="M60 8 108 36 92 78 28 78 12 36Z"></path>
          <path d="M60 8 60 50 12 36M60 50 108 36M60 50 92 78M60 50 28 78"></path>
        </svg>
      </div>
    `;
  }
  if (visual === "graph" || visual === "tree" || visual === "simulation") {
    return `
      <div class="media-visual ${sizeClass} accent-${item.accent} media-graph">
        <svg viewBox="0 0 120 90" aria-hidden="true">
          <path d="M22 62 48 28 78 52 100 20M48 28 58 72M78 52 58 72"></path>
          <circle cx="22" cy="62" r="7"></circle><circle cx="48" cy="28" r="7"></circle><circle cx="78" cy="52" r="7"></circle><circle cx="100" cy="20" r="7"></circle><circle cx="58" cy="72" r="7"></circle>
        </svg>
      </div>
    `;
  }
  if (visual === "map") {
    return `
      <div class="media-visual ${sizeClass} accent-${item.accent} media-map">
        <svg viewBox="0 0 120 90" aria-hidden="true">
          <path d="M16 20c16-10 26 8 42-1 19-10 26 3 46 0v52c-20 5-30-9-47 0-18 9-28-8-41 1Z"></path>
          <path d="M36 23v45M72 20v45M18 45h84"></path>
          <circle cx="58" cy="45" r="5"></circle>
        </svg>
      </div>
    `;
  }
  if (visual === "wave" || visual === "conics" || visual === "proof") {
    return `
      <div class="media-visual ${sizeClass} accent-${item.accent} media-wave">
        <svg viewBox="0 0 120 90" aria-hidden="true">
          <path d="M8 48c14-36 28 36 42 0s28 36 42 0 16-24 20-10"></path>
          <path d="M18 70c20-12 62-12 84 0"></path>
        </svg>
      </div>
    `;
  }
  if (visual === "timeline") {
    return `
      <div class="media-visual ${sizeClass} accent-${item.accent} media-timeline">
        <span></span><span></span><span></span><span></span>
      </div>
    `;
  }
  return `
    <div class="media-visual ${sizeClass} accent-${item.accent} media-infographic">
      <span></span><span></span><span></span><b></b>
    </div>
  `;
}

function renderLibrary() {
  const tabs = ["Citations", "Livres", "Glossaire", "Médiathèque"];
  $("#libraryTabs").innerHTML = tabs.map((tab) => `<button class="${tab === activeLibrary ? "active" : ""}" type="button">${tab}</button>`).join("");
  const quoteTools = $("#quoteTools");
  const bookTools = $("#bookTools");
  const glossaryTools = $("#glossaryTools");
  const mediaTools = $("#mediaTools");
  quoteTools.hidden = activeLibrary !== "Citations";
  bookTools.hidden = activeLibrary !== "Livres";
  glossaryTools.hidden = activeLibrary !== "Glossaire";
  mediaTools.hidden = activeLibrary !== "Médiathèque";
  if (activeLibrary === "Citations") {
    renderQuotes();
  } else if (activeLibrary === "Livres") {
    renderBooks();
  } else if (activeLibrary === "Glossaire") {
    renderGlossary();
  } else {
    renderMedia();
  }
  $("#libraryTabs").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeLibrary = button.textContent;
      renderLibrary();
    });
  });
}

function renderQuotes() {
  const search = $("#quoteSearch");
  const authorFilter = $("#quoteAuthorFilter");
  const themeFilter = $("#quoteThemeFilter");
  const periodFilter = $("#quotePeriodFilter");
  authorFilter.innerHTML = optionList([...new Set(quotes.map((item) => item.author).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")));
  themeFilter.innerHTML = optionList([...new Set(quotes.map((item) => item.theme).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")));
  periodFilter.innerHTML = optionList([...new Set(quotes.map((item) => item.period).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")), "Toutes");
  const query = normalize(search.value.trim());
  const visible = quotes
    .filter((item) => activeQuoteAuthor === "Tous" || item.author === activeQuoteAuthor)
    .filter((item) => activeQuoteTheme === "Tous" || item.theme === activeQuoteTheme)
    .filter((item) => activeQuotePeriod === "Tous" || item.period === activeQuotePeriod)
    .filter((item) => !query || normalize(asSearchText(item)).includes(query));
  authorFilter.value = activeQuoteAuthor;
  themeFilter.value = activeQuoteTheme;
  periodFilter.value = activeQuotePeriod;
  $("#quoteStats").innerHTML = `
    <strong>${visible.length}</strong><span>citations</span>
    <strong>${new Set(visible.map((item) => item.author)).size}</strong><span>auteurs</span>
    <strong>${new Set(visible.map((item) => item.theme)).size}</strong><span>thèmes</span>
    <strong>${new Set(visible.map((item) => item.period)).size}</strong><span>époques</span>
  `;
  $("#libraryPanel").innerHTML = visible.map(quoteCard).join("") || card("Aucune citation", "Aucune citation ne correspond aux filtres actifs.", "Bibliothèque");
}

function quoteCard({ author, text, theme, period }) {
  return `
    <article class="quote-card">
      <blockquote>« ${text} »</blockquote>
      <div>
        <strong>${author}</strong>
        <span>${theme} · ${period}</span>
      </div>
    </article>
  `;
}

function renderBooks() {
  const search = $("#bookSearch");
  const authorFilter = $("#bookAuthorFilter");
  const categoryFilter = $("#bookCategoryFilter");
  const levelFilter = $("#bookLevelFilter");
  authorFilter.innerHTML = optionList([...new Set(books.map((item) => item.author).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")));
  categoryFilter.innerHTML = optionList([...new Set(books.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")), "Toutes");
  levelFilter.innerHTML = optionList([...new Set(books.map((item) => item.level).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")));
  const query = normalize(search.value.trim());
  const visible = books
    .filter((item) => activeBookAuthor === "Tous" || item.author === activeBookAuthor)
    .filter((item) => activeBookCategory === "Tous" || item.category === activeBookCategory)
    .filter((item) => activeBookLevel === "Tous" || item.level === activeBookLevel)
    .filter((item) => !query || normalize(asSearchText(item)).includes(query));
  authorFilter.value = activeBookAuthor;
  categoryFilter.value = activeBookCategory;
  levelFilter.value = activeBookLevel;
  $("#bookStats").innerHTML = `
    <strong>${visible.length}</strong><span>livres</span>
    <strong>${new Set(visible.map((item) => item.author)).size}</strong><span>auteurs</span>
    <strong>${new Set(visible.map((item) => item.category)).size}</strong><span>catégories</span>
    <strong>${new Set(visible.map((item) => item.level)).size}</strong><span>niveaux</span>
  `;
  $("#libraryPanel").innerHTML = visible.map(bookCard).join("") || card("Aucun livre", "Aucun livre ne correspond aux filtres actifs.", "Bibliothèque");
}

function bookCard({ title, author, category, level, description }) {
  return `
    <article class="book-card">
      <div class="book-card-header">
        <span>${category}</span>
        <small>${level}</small>
      </div>
      <h3>${title}</h3>
      <p>${description}</p>
      <strong>${author}</strong>
    </article>
  `;
}

function glossaryInitial(term = "") {
  return normalize(term).charAt(0).toUpperCase();
}

function renderGlossary() {
  const search = $("#glossarySearch");
  const initialFilter = $("#glossaryInitialFilter");
  const linkFilter = $("#glossaryLinkFilter");
  const initials = [...new Set(glossary.map((item) => glossaryInitial(item.term)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  const links = [...new Set(glossary.flatMap((item) => item.links || []).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  initialFilter.innerHTML = optionList(initials, "Toutes");
  linkFilter.innerHTML = optionList(links);
  if (activeGlossaryInitial !== "Tous" && !initials.includes(activeGlossaryInitial)) activeGlossaryInitial = "Tous";
  if (activeGlossaryLink !== "Tous" && !links.includes(activeGlossaryLink)) activeGlossaryLink = "Tous";
  const query = normalize(search.value.trim());
  const visible = glossary
    .filter((item) => activeGlossaryInitial === "Tous" || glossaryInitial(item.term) === activeGlossaryInitial)
    .filter((item) => activeGlossaryLink === "Tous" || item.links?.includes(activeGlossaryLink))
    .filter((item) => !query || normalize(asSearchText(item)).includes(query))
    .sort((a, b) => a.term.localeCompare(b.term, "fr"));
  const displayed = visible.slice(0, 180);
  initialFilter.value = activeGlossaryInitial;
  linkFilter.value = activeGlossaryLink;
  $("#glossaryStats").innerHTML = `
    <strong>${glossary.length}</strong><span>définitions</span>
    <strong>${visible.length}</strong><span>résultats</span>
    <strong>${displayed.length}</strong><span>affichées</span>
    <strong>${new Set(visible.flatMap((item) => item.links || [])).size}</strong><span>renvois</span>
  `;
  $("#libraryPanel").innerHTML = displayed.map(glossaryCard).join("") || card("Aucune définition", "Aucune définition ne correspond aux filtres actifs.", "Glossaire");
  $("#libraryPanel").querySelectorAll("[data-glossary-link]").forEach((button) => {
    button.addEventListener("click", () => {
      activeGlossaryLink = button.dataset.glossaryLink;
      activeLibrary = "Glossaire";
      renderLibrary();
    });
  });
  bindFavorites();
  bindDetailButtons();
}

function glossaryCard({ term, definition, links = [] }) {
  return `
    <article class="glossary-card">
      <div class="glossary-card-header">
        <span>${glossaryInitial(term)}</span>
        <h3>${term}</h3>
      </div>
      <p>${definition}</p>
      <div class="glossary-links">
        ${links.map((link) => `<button type="button" data-glossary-link="${link}">${link}</button>`).join("")}
      </div>
      <div class="card-actions">
        <button class="mini-button" type="button" data-open="glossary:${term}">Ouvrir</button>
        ${favoriteButton(`glossary:${term}`, term)}
      </div>
    </article>
  `;
}

function renderMedia() {
  const search = $("#mediaSearch");
  const typeFilter = $("#mediaTypeFilter");
  const domainFilter = $("#mediaDomainFilter");
  const sourceFilter = $("#mediaSourceFilter");
  const types = [...new Set(media.map((item) => item.type).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  const mediaDomains = [...new Set(media.map((item) => item.domain).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  const sources = [...new Set(media.map((item) => item.source).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  typeFilter.innerHTML = optionList(types);
  domainFilter.innerHTML = optionList(mediaDomains);
  sourceFilter.innerHTML = optionList(sources, "Toutes");
  if (activeMediaType !== "Tous" && !types.includes(activeMediaType)) activeMediaType = "Tous";
  if (activeMediaDomain !== "Tous" && !mediaDomains.includes(activeMediaDomain)) activeMediaDomain = "Tous";
  if (activeMediaSource !== "Tous" && !sources.includes(activeMediaSource)) activeMediaSource = "Tous";
  const query = normalize(search.value.trim());
  const visible = media
    .filter((item) => activeMediaType === "Tous" || item.type === activeMediaType)
    .filter((item) => activeMediaDomain === "Tous" || item.domain === activeMediaDomain)
    .filter((item) => activeMediaSource === "Tous" || item.source === activeMediaSource)
    .filter((item) => !query || normalize(asSearchText(item)).includes(query));
  typeFilter.value = activeMediaType;
  domainFilter.value = activeMediaDomain;
  sourceFilter.value = activeMediaSource;
  $("#mediaStats").innerHTML = `
    <strong>${visible.length}</strong><span>médias</span>
    <strong>${media.length}</strong><span>collection</span>
    <strong>${new Set(visible.map((item) => item.type)).size}</strong><span>types visibles</span>
    <strong>${new Set(visible.map((item) => item.source)).size}</strong><span>sources</span>
    <strong>${visible.filter((item) => item.license === "Création Mathemator").length}</strong><span>générés</span>
    <strong>${visible.filter((item) => item.license !== "Création Mathemator").length}</strong><span>sources ouvertes</span>
  `;
  $("#libraryPanel").innerHTML = visible.map(mediaCard).join("") || card("Aucun média", "Aucun média ne correspond aux filtres actifs.", "Médiathèque");
  bindFavorites();
  bindDetailButtons();
}

function mediaCard(item) {
  return `
    <article class="media-card" tabindex="0" role="button" data-open="media:${item.id}" aria-label="Ouvrir ${item.title}">
      ${mediaVisual(item)}
      <div class="media-card-body">
        <div class="media-card-header">
          <span>${item.type}</span>
          <small>${item.format}</small>
        </div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <dl>
          <dt>Source</dt><dd>${item.source}</dd>
          <dt>Licence</dt><dd>${item.license}</dd>
          <dt>Domaine</dt><dd>${item.domain} · ${item.period}</dd>
        </dl>
        <div class="media-tags">${(item.links || []).slice(0, 4).map((link) => `<span>${link}</span>`).join("")}</div>
        <div class="card-actions">
          <button class="mini-button" type="button" data-open="media:${item.id}">Ouvrir</button>
          ${favoriteButton(`media:${item.id}`, item.title)}
        </div>
      </div>
    </article>
  `;
}

function renderProblems() {
  const search = $("#problemSearch");
  const categoryFilter = $("#problemCategoryFilter");
  const statusFilter = $("#problemStatusFilter");
  const domainFilter = $("#problemDomainFilter");
  categoryFilter.innerHTML = optionList([...new Set(problems.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")), "Toutes");
  statusFilter.innerHTML = optionList([...new Set(problems.map((item) => item.status).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")));
  domainFilter.innerHTML = optionList([...new Set(problems.map((item) => item.domain).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")));
  const draw = () => {
    const query = normalize(search.value.trim());
    const visible = problems
      .filter((item) => activeProblemCategory === "Tous" || item.category === activeProblemCategory)
      .filter((item) => activeProblemStatus === "Tous" || item.status === activeProblemStatus)
      .filter((item) => activeProblemDomain === "Tous" || item.domain === activeProblemDomain)
      .filter((item) => !query || normalize(asSearchText(item)).includes(query));
    categoryFilter.value = activeProblemCategory;
    statusFilter.value = activeProblemStatus;
    domainFilter.value = activeProblemDomain;
    $("#problemStats").innerHTML = `
      <strong>${visible.length}</strong><span>problèmes</span>
      <strong>${visible.filter((item) => item.status === "Ouvert").length}</strong><span>ouverts</span>
      <strong>${visible.filter((item) => item.status === "Résolu").length}</strong><span>résolus</span>
      <strong>${new Set(visible.map((item) => item.domain)).size}</strong><span>domaines</span>
    `;
    $("#problemList").innerHTML = visible.map(problemCard).join("") || card("Aucun problème", "Aucun problème ne correspond aux filtres actifs.", "Problèmes célèbres");
    bindFavorites();
  };
  search.addEventListener("input", draw);
  categoryFilter.addEventListener("change", () => {
    activeProblemCategory = categoryFilter.value;
    draw();
  });
  statusFilter.addEventListener("change", () => {
    activeProblemStatus = statusFilter.value;
    draw();
  });
  domainFilter.addEventListener("change", () => {
    activeProblemDomain = domainFilter.value;
    draw();
  });
  draw();
}

function problemCard({ name, status, category, domain, difficulty, period, text, history, current, accessible, advances, recent, impact, references = [] }) {
  return `
    <article class="problem-card">
      <div class="problem-card-header">
        <span class="${status === "Ouvert" ? "status-open" : status === "Résolu" ? "status-solved" : "status-active"}">${status}</span>
        <small>${category || "Problème"} · ${domain || "Mathématiques"} · ${difficulty || "Avancé"} · ${period || "Moderne"}</small>
      </div>
      <h3>${name}</h3>
      <p>${text}</p>
      <dl>
        <dt>Historique</dt><dd>${history}</dd>
        <dt>État actuel</dt><dd>${current}</dd>
        <dt>Explication accessible</dt><dd>${accessible || text}</dd>
        <dt>Avancées récentes</dt><dd>${recent || advances}</dd>
        <dt>Impact</dt><dd>${impact}</dd>
      </dl>
      <section class="problem-references">
        <strong>Références</strong>
        <ul>${fieldList(references)}</ul>
      </section>
      <div class="card-actions">${favoriteButton(`problem:${name}`, name)}</div>
    </article>
  `;
}

function teacherPlan() {
  const domain = teacherDomain;
  const level = teacherLevel;
  const domainTheorems = theorems.filter((item) => normalize(asSearchText(item)).includes(normalize(domain))).slice(0, 3);
  const domainFormulas = formulas.filter((item) => item.category === domain || item.uses?.includes(domain) || normalize(item.category).includes(normalize(domain))).slice(0, 3);
  const domainExercises = exercises.filter((item) => item.domain === domain && (level === "Tous" || item.level === level)).slice(0, 5);
  const fallbackExercises = domainExercises.length ? domainExercises : exercises.filter((item) => item.domain === domain).slice(0, 5);
  const domainQuiz = quiz.filter((item) => item.domain === domain).slice(0, 6);
  const concepts = domains.find((item) => item.name === domain)?.concepts?.slice(0, 6) || [];
  return {
    domain,
    level,
    duration: Number(teacherDuration) || 45,
    concepts,
    theorems: domainTheorems,
    formulas: domainFormulas,
    exercises: fallbackExercises,
    quiz: domainQuiz,
  };
}

function teacherExportText(plan = teacherPlan()) {
  return [
    `Parcours enseignant - ${plan.domain}`,
    `Niveau : ${plan.level}`,
    `Durée : ${plan.duration} min`,
    "",
    "Objectifs",
    ...plan.concepts.map((item) => `- ${item}`),
    "",
    "Théorèmes",
    ...plan.theorems.map((item) => `- ${item.name} : ${item.statement}`),
    "",
    "Formules",
    ...plan.formulas.map((item) => `- ${item.name} : ${item.expression}`),
    "",
    "Exercices",
    ...plan.exercises.map((item) => `- ${item.prompt} (${item.difficulty}, ${item.time})`),
    "",
    "Quiz",
    ...plan.quiz.map((item) => `- ${item.question} Réponse : ${item.options[item.correct]}`),
  ].join("\n");
}

function renderTeacherMode() {
  const domainOptions = [...new Set([...domains.map((item) => item.name), ...exercises.map((item) => item.domain)])].sort((a, b) => a.localeCompare(b, "fr"));
  const levelOptions = ["Tous", ...new Set(exercises.map((item) => item.level))];
  const plan = teacherPlan();
  return `
    <div class="teacher-workbench" id="teacherWorkbench">
      <div class="teacher-controls">
        <label>
          Domaine
          <select id="teacherDomainSelect">${domainOptions.map((domain) => `<option value="${domain}" ${domain === teacherDomain ? "selected" : ""}>${domain}</option>`).join("")}</select>
        </label>
        <label>
          Niveau
          <select id="teacherLevelSelect">${levelOptions.map((level) => `<option value="${level}" ${level === teacherLevel ? "selected" : ""}>${level}</option>`).join("")}</select>
        </label>
        <label>
          Durée
          <select id="teacherDurationSelect">${["30", "45", "60", "90"].map((duration) => `<option value="${duration}" ${duration === teacherDuration ? "selected" : ""}>${duration} min</option>`).join("")}</select>
        </label>
      </div>
      <div class="stats-row">
        <strong>${plan.concepts.length}</strong><span>objectifs</span>
        <strong>${plan.theorems.length}</strong><span>théorèmes</span>
        <strong>${plan.exercises.length}</strong><span>exercices</span>
        <strong>${plan.quiz.length}</strong><span>quiz</span>
      </div>
      <div class="teacher-actions">
        <button class="mini-button" id="teacherPrintButton" type="button">Exporter PDF</button>
        <button class="mini-button" id="teacherCopyButton" type="button">Copier fiche</button>
        <button class="mini-button" id="teacherFullscreenButton" type="button">Présentation</button>
      </div>
      <article class="teacher-sheet" id="teacherSheet">
        <header>
          <span class="badge">${plan.level} · ${plan.duration} min</span>
          <h3>Parcours ${plan.domain}</h3>
        </header>
        <section>
          <h4>Objectifs</h4>
          <ul>${fieldList(plan.concepts)}</ul>
        </section>
        <section>
          <h4>Ressources</h4>
          <ul>
            ${plan.theorems.map((item) => `<li><strong>${item.name}</strong> — ${item.statement}</li>`).join("")}
            ${plan.formulas.map((item) => `<li><strong>${item.name}</strong> — ${item.expression}</li>`).join("")}
          </ul>
        </section>
        <section>
          <h4>Exercices</h4>
          <ol>${plan.exercises.map((item) => `<li>${item.prompt}<br><span>${item.difficulty} · ${item.time}</span></li>`).join("")}</ol>
        </section>
        <section>
          <h4>Quiz généré</h4>
          <ol>${plan.quiz.map((item) => `<li>${item.question}<br><span>Réponse : ${item.options[item.correct]}</span></li>`).join("")}</ol>
        </section>
      </article>
    </div>
  `;
}

function bindTeacherMode() {
  $("#teacherDomainSelect")?.addEventListener("change", (event) => {
    teacherDomain = event.target.value;
    renderModes();
  });
  $("#teacherLevelSelect")?.addEventListener("change", (event) => {
    teacherLevel = event.target.value;
    renderModes();
  });
  $("#teacherDurationSelect")?.addEventListener("change", (event) => {
    teacherDuration = event.target.value;
    renderModes();
  });
  $("#teacherPrintButton")?.addEventListener("click", () => {
    document.body.classList.add("printing-teacher");
    print();
    setTimeout(() => document.body.classList.remove("printing-teacher"), 500);
  });
  $("#teacherCopyButton")?.addEventListener("click", async () => {
    const text = teacherExportText();
    try {
      await navigator.clipboard.writeText(text);
      $("#teacherCopyButton").textContent = "Fiche copiée";
    } catch {
      $("#teacherCopyButton").textContent = "Copie indisponible";
    }
  });
  $("#teacherFullscreenButton")?.addEventListener("click", async () => {
    const sheet = $("#teacherSheet");
    if (sheet?.requestFullscreen) await sheet.requestFullscreen();
  });
}

function studentHistory() {
  return store.get("mathemator:student-history", []);
}

function recordStudentEvent(kind, label, domain = studentDomain) {
  const history = studentHistory();
  store.set("mathemator:student-history", [
    { date: todayKey(), kind, label, domain },
    ...history,
  ].slice(0, 30));
}

function studentDeck(domain = studentDomain) {
  const domainInfo = domains.find((item) => item.name === domain);
  const conceptCards = (domainInfo?.concepts || []).slice(0, 6).map((concept) => ({
    front: concept,
    back: `Concept central en ${domain}. Relis sa définition, puis cherche un exemple et un contre-exemple.`,
    meta: "Concept",
  }));
  const theoremCards = theorems
    .filter((item) => normalize(asSearchText(item)).includes(normalize(domain)))
    .slice(0, 5)
    .map((item) => ({ front: item.name, back: item.intuition || item.statement, meta: "Théorème" }));
  const formulaCards = formulas
    .filter((item) => item.category === domain || item.uses?.includes(domain) || normalize(item.category).includes(normalize(domain)))
    .slice(0, 4)
    .map((item) => ({ front: item.name, back: `${item.expression} — ${item.explanation}`, meta: "Formule" }));
  const glossaryCards = glossary
    .filter((item) => item.links?.includes(domain))
    .slice(0, 5)
    .map((item) => ({ front: item.term, back: item.definition, meta: "Glossaire" }));
  return [...conceptCards, ...theoremCards, ...formulaCards, ...glossaryCards];
}

function studentSummary(domain = studentDomain) {
  const domainInfo = domains.find((item) => item.name === domain);
  if (!domainInfo) return null;
  return {
    intro: domainInfo.intro,
    concepts: domainInfo.concepts?.slice(0, 6) || [],
    theorems: domainInfo.theorems?.slice(0, 5) || [],
    methods: domainInfo.methods?.slice(0, 5) || [],
  };
}

function renderStudentMode() {
  const domainOptions = [...new Set([...domains.map((item) => item.name), ...exercises.map((item) => item.domain)])].sort((a, b) => a.localeCompare(b, "fr"));
  const goals = ["Revoir 5 cartes", "Réussir 3 quiz", "Terminer 2 exercices", "Renforcer un domaine faible"];
  const deck = studentDeck();
  const card = deck[studentFlashcard % Math.max(deck.length, 1)];
  const summary = studentSummary();
  const progress = getProgress();
  const domainStats = progress.domains[studentDomain] || { exercises: 0, quiz: 0, minutes: 0 };
  const history = studentHistory().filter((item) => studentDomain === "Tous" || item.domain === studentDomain).slice(0, 8);
  return `
    <div class="student-workbench" id="studentWorkbench">
      <div class="student-controls">
        <label>
          Domaine
          <select id="studentDomainSelect">${domainOptions.map((domain) => `<option value="${domain}" ${domain === studentDomain ? "selected" : ""}>${domain}</option>`).join("")}</select>
        </label>
        <label>
          Objectif
          <select id="studentGoalSelect">${goals.map((goal) => `<option value="${goal}" ${goal === studentGoal ? "selected" : ""}>${goal}</option>`).join("")}</select>
        </label>
        <button class="mini-button" id="studentSaveGoalButton" type="button">Enregistrer objectif</button>
      </div>
      <div class="stats-row">
        <strong>${domainStats.minutes}</strong><span>min</span>
        <strong>${domainStats.exercises}</strong><span>exercices</span>
        <strong>${domainStats.quiz}</strong><span>quiz</span>
        <strong>${deck.length}</strong><span>cartes</span>
      </div>
      <div class="student-grid">
        <article class="student-summary">
          <span class="badge">Fiche de synthèse</span>
          <h3>${studentDomain}</h3>
          <p>${summary?.intro || "Sélectionne un domaine pour afficher une synthèse."}</p>
          <dl>
            <dt>Concepts</dt><dd>${summary?.concepts.join(", ") || "Aucun concept"}</dd>
            <dt>Théorèmes</dt><dd>${summary?.theorems.join(", ") || "Aucun théorème"}</dd>
            <dt>Méthodes</dt><dd>${summary?.methods.join(", ") || "Aucune méthode"}</dd>
          </dl>
        </article>
        <article class="flashcard">
          <div class="flashcard-header">
            <span>${card?.meta || "Carte"}</span>
            <small>${deck.length ? studentFlashcard + 1 : 0}/${deck.length}</small>
          </div>
          <h3>${card?.front || "Aucune carte"}</h3>
          <p>${studentFlashcardRevealed ? card?.back || "" : "Réfléchis, puis révèle la réponse."}</p>
          <div class="card-actions">
            <button class="mini-button" id="studentPrevCardButton" type="button">Précédente</button>
            <button class="mini-button" id="studentRevealCardButton" type="button">${studentFlashcardRevealed ? "Masquer" : "Révéler"}</button>
            <button class="mini-button" id="studentNextCardButton" type="button">Suivante</button>
            <button class="mini-button" id="studentKnownCardButton" type="button">Acquise</button>
          </div>
        </article>
      </div>
      <article class="student-history">
        <h3>Historique</h3>
        ${history.length ? `<ul>${history.map((item) => `<li><strong>${item.date}</strong> · ${item.kind} · ${item.label}</li>`).join("")}</ul>` : `<p class="muted">Aucune révision enregistrée pour ce domaine.</p>`}
      </article>
    </div>
  `;
}

function bindStudentMode() {
  $("#studentDomainSelect")?.addEventListener("change", (event) => {
    studentDomain = event.target.value;
    studentFlashcard = 0;
    studentFlashcardRevealed = false;
    renderModes();
  });
  $("#studentGoalSelect")?.addEventListener("change", (event) => {
    studentGoal = event.target.value;
  });
  $("#studentSaveGoalButton")?.addEventListener("click", () => {
    store.set("mathemator:student-goal", { domain: studentDomain, goal: studentGoal, date: todayKey() });
    recordStudentEvent("objectif", studentGoal);
    renderModes();
  });
  $("#studentPrevCardButton")?.addEventListener("click", () => {
    const length = studentDeck().length || 1;
    studentFlashcard = (studentFlashcard - 1 + length) % length;
    studentFlashcardRevealed = false;
    renderModes();
  });
  $("#studentRevealCardButton")?.addEventListener("click", () => {
    studentFlashcardRevealed = !studentFlashcardRevealed;
    renderModes();
  });
  $("#studentNextCardButton")?.addEventListener("click", () => {
    const length = studentDeck().length || 1;
    studentFlashcard = (studentFlashcard + 1) % length;
    studentFlashcardRevealed = false;
    recordStudentEvent("carte revue", studentDeck()[studentFlashcard]?.front || "Carte");
    renderModes();
  });
  $("#studentKnownCardButton")?.addEventListener("click", () => {
    const card = studentDeck()[studentFlashcard];
    recordStudentEvent("carte acquise", card?.front || "Carte");
    renderModes();
  });
}

function renderModes() {
  const tabs = Object.keys(modeContent);
  $("#modeTabs").innerHTML = tabs.map((tab) => `<button class="${tab === activeMode ? "active" : ""}" type="button">${tab}</button>`).join("");
  $("#modePanel").innerHTML = activeMode === "Enseignant" ? renderTeacherMode() : activeMode === "Étudiant" ? renderStudentMode() : `
      <div class="workflow">
        ${modeContent[activeMode].map((item, index) => `<article><strong>${index + 1}</strong><span>${item}</span></article>`).join("")}
      </div>
    `;
  if (activeMode === "Enseignant") bindTeacherMode();
  if (activeMode === "Étudiant") bindStudentMode();
  $("#modeTabs").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeMode = button.textContent;
      renderModes();
    });
  });
}

function renderModules() {
  $("#moduleGrid").innerHTML = modules.map((module, index) => `
    <article>
      <strong>${String(index + 1).padStart(2, "0")}</strong>
      <span>${module}</span>
      <small>Réalisé</small>
    </article>
  `).join("");
}

const networkTypeLabels = {
  domain: "Domaines",
  concept: "Concepts",
  person: "Mathématiciens",
  theorem: "Théorèmes",
  formula: "Formules",
  object: "Objets",
};
const networkTypes = ["Tous", ...Object.values(networkTypeLabels)];

function networkId(type, label) {
  return `${type}:${normalize(label).replace(/[^a-z0-9]+/g, "-")}`;
}

function buildKnowledgeNetwork() {
  const nodes = new Map();
  const edges = [];
  const addNode = (type, label, meta, summary, x, y, payload = {}) => {
    const id = networkId(type, label);
    if (!nodes.has(id)) nodes.set(id, { id, type, label, meta, summary, x, y, payload, neighbors: new Set() });
    return id;
  };
  const addEdge = (source, target) => {
    if (!source || !target || source === target) return;
    edges.push({ source, target });
    nodes.get(source)?.neighbors.add(target);
    nodes.get(target)?.neighbors.add(source);
  };
  const selectedDomains = domains.slice(0, 10);
  const centerX = 450;
  const centerY = 260;
  selectedDomains.forEach((domain, index) => {
    const angle = (index / selectedDomains.length) * Math.PI * 2 - Math.PI / 2;
    const x = centerX + Math.cos(angle) * 230;
    const y = centerY + Math.sin(angle) * 165;
    const domainId = addNode("domain", domain.name, domain.family, domain.intro, x, y, domain);
    const relatedPeople = mathematicians.filter((person) => person.domains?.includes(domain.name) || domain.people?.includes(person.name)).slice(0, 2);
    const relatedTheorems = theorems.filter((theorem) => domain.theorems?.includes(theorem.name) || normalize(asSearchText(theorem)).includes(normalize(domain.name))).slice(0, 1);
    const relatedFormulas = formulas.filter((formula) => formula.category === domain.name || formula.uses?.includes(domain.name) || normalize(formula.category).includes(normalize(domain.name))).slice(0, 1);
    const relatedObjects = objects.filter((object) => object.category === domain.name || object.related?.includes(domain.name) || normalize(asSearchText(object)).includes(normalize(domain.name))).slice(0, 1);
    const spokes = [
      ...domain.concepts.slice(0, 2).map((item) => ["concept", item, "Concept", `Concept central en ${domain.name}.`, item]),
      ...relatedPeople.map((item) => ["person", item.name, item.period, item.biography, item]),
      ...relatedTheorems.map((item) => ["theorem", item.name, item.discoverer, item.statement, item]),
      ...relatedFormulas.map((item) => ["formula", item.name, item.category, item.explanation, item]),
      ...relatedObjects.map((item) => ["object", item.name, item.category, item.description, item]),
    ];
    spokes.forEach(([type, label, meta, summary, payload], spokeIndex) => {
      const spokeAngle = angle + (spokeIndex - (spokes.length - 1) / 2) * 0.22;
      const spokeRadius = type === "concept" ? 80 : 118;
      const nodeId = addNode(type, label, meta, summary, x + Math.cos(spokeAngle) * spokeRadius, y + Math.sin(spokeAngle) * spokeRadius, payload);
      addEdge(domainId, nodeId);
    });
  });
  if (!activeNetworkNode || !nodes.has(activeNetworkNode)) activeNetworkNode = selectedDomains[0] ? networkId("domain", selectedDomains[0].name) : "";
  return { nodes: [...nodes.values()].map((node) => ({ ...node, neighbors: [...node.neighbors] })), edges };
}

const knowledgeNetwork = buildKnowledgeNetwork();

function drawHero() {
  const canvas = $("#heroCanvas");
  const ctx = canvas.getContext("2d");
  const resize = () => {
    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
  };
  resize();
  addEventListener("resize", resize);
  let t = 0;
  const loop = () => {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#0f766e");
    gradient.addColorStop(0.5, "#203a43");
    gradient.addColorStop(1, "#7c2d12");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,.28)";
    ctx.lineWidth = 1.4 * devicePixelRatio;
    for (let i = 0; i < 26; i += 1) {
      ctx.beginPath();
      for (let x = 0; x < w; x += 12 * devicePixelRatio) {
        const y = h * 0.5 + Math.sin(x * 0.009 / devicePixelRatio + i * 0.52 + t) * h * 0.12 + (i - 13) * h * 0.018;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,.78)";
    for (let i = 0; i < 80; i += 1) {
      const x = (Math.sin(i * 91.7 + t * 0.2) * 0.5 + 0.5) * w;
      const y = (Math.cos(i * 37.2 + t * 0.3) * 0.5 + 0.5) * h;
      ctx.beginPath();
      ctx.arc(x, y, (1 + (i % 3)) * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
    }
    t += 0.012;
    requestAnimationFrame(loop);
  };
  loop();
}

function drawMandelbrot() {
  const canvas = $("#mandelbrotCanvas");
  const ctx = canvas.getContext("2d");
  const { width: w, height: h } = canvas;
  const img = ctx.createImageData(w, h);
  const zoom = 1 + Math.random() * 0.35;
  const ox = -0.62 + (Math.random() - 0.5) * 0.18;
  const oy = (Math.random() - 0.5) * 0.12;
  for (let px = 0; px < w; px += 1) {
    for (let py = 0; py < h; py += 1) {
      const x0 = (px / w - 0.5) * 3.35 / zoom + ox;
      const y0 = (py / h - 0.5) * 2.25 / zoom + oy;
      let x = 0;
      let y = 0;
      let iter = 0;
      while (x * x + y * y <= 4 && iter < 80) {
        const xt = x * x - y * y + x0;
        y = 2 * x * y + y0;
        x = xt;
        iter += 1;
      }
      const p = (py * w + px) * 4;
      const c = iter === 80 ? 0 : iter * 3.2;
      img.data[p] = c * 0.8;
      img.data[p + 1] = 90 + c * 1.6;
      img.data[p + 2] = 120 + c * 0.7;
      img.data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function drawSurface(rotation = 48) {
  const canvas = $("#surfaceCanvas");
  const ctx = canvas.getContext("2d");
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, w, h);
  const a = (rotation / 100) * Math.PI * 2;
  const project = (x, y, z) => {
    const xr = x * Math.cos(a) - z * Math.sin(a);
    const zr = x * Math.sin(a) + z * Math.cos(a);
    const scale = 86 / (2.9 + zr * 0.15);
    return [w / 2 + xr * scale, h / 2 + (y - z * 0.22) * scale];
  };
  for (let pass = 0; pass < 2; pass += 1) {
    for (let a1 = -3; a1 <= 3; a1 += 0.18) {
      ctx.beginPath();
      for (let a2 = -3; a2 <= 3; a2 += 0.18) {
        const u = pass ? a2 : a1;
        const v = pass ? a1 : a2;
        const z = Math.sin(u * u + v * v) * 0.7;
        const [x, y] = project(u, v, z);
        a2 === -3 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = pass ? "rgba(124,45,18,.22)" : "rgba(15,118,110,.34)";
      ctx.stroke();
    }
  }
}

function drawGrid(ctx, w, h, step = 42) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "#1f2937";
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
}

function drawCurveVisualization(mode = $("#curveMode").value) {
  const canvas = $("#curveCanvas");
  const ctx = canvas.getContext("2d");
  const { width: w, height: h } = canvas;
  const scale = 92;
  const px = (x) => w / 2 + x * scale;
  const py = (y) => h / 2 - y * scale;
  drawGrid(ctx, w, h);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#0f766e";
  ctx.beginPath();
  let started = false;
  if (mode === "parametric") {
    for (let i = 0; i <= 720; i += 1) {
      const t = (i / 720) * Math.PI * 2;
      const x = Math.sin(3 * t + Math.PI / 6) * 2.05;
      const y = Math.cos(2 * t) * 1.45;
      started ? ctx.lineTo(px(x), py(y)) : ctx.moveTo(px(x), py(y));
      started = true;
    }
  } else if (mode === "polar") {
    for (let i = 0; i <= 900; i += 1) {
      const t = (i / 900) * Math.PI * 2;
      const r = 1.35 + 0.55 * Math.cos(5 * t);
      const x = r * Math.cos(t);
      const y = r * Math.sin(t);
      started ? ctx.lineTo(px(x), py(y)) : ctx.moveTo(px(x), py(y));
      started = true;
    }
  } else {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#7c2d12";
    for (let level = -2; level <= 2; level += 1) {
      ctx.beginPath();
      started = false;
      for (let i = -260; i <= 260; i += 1) {
        const x = i / 72;
        const y = Math.sin(x * x + level * 0.7) + level * 0.42;
        started ? ctx.lineTo(px(x), py(y)) : ctx.moveTo(px(x), py(y));
        started = true;
      }
      ctx.stroke();
    }
    ctx.strokeStyle = "#0f766e";
    ctx.beginPath();
    started = false;
    for (let i = -220; i <= 220; i += 1) {
      const y = i / 84;
      const x = Math.sqrt(1 + y * y);
      started ? ctx.lineTo(px(x), py(y)) : ctx.moveTo(px(x), py(y));
      started = true;
    }
    for (let i = 220; i >= -220; i -= 1) {
      const y = i / 84;
      const x = -Math.sqrt(1 + y * y);
      ctx.lineTo(px(x), py(y));
    }
  }
  ctx.stroke();
  ctx.fillStyle = "#334155";
  ctx.font = "600 18px system-ui";
  const labels = {
    parametric: "x = sin(3t), y = cos(2t)",
    polar: "r = 1.35 + 0.55 cos(5θ)",
    implicit: "Contours et hyperbole x² - y² = 1",
  };
  ctx.fillText(labels[mode], 18, 30);
}

function drawArrow(ctx, x1, y1, x2, y2, color = "#0f766e") {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(angle - 0.45) * 9, y2 - Math.sin(angle - 0.45) * 9);
  ctx.lineTo(x2 - Math.cos(angle + 0.45) * 9, y2 - Math.sin(angle + 0.45) * 9);
  ctx.closePath();
  ctx.fill();
}

function drawVectorVisualization(angle = Number($("#matrixSlider").value)) {
  const canvas = $("#vectorCanvas");
  const ctx = canvas.getContext("2d");
  const { width: w, height: h } = canvas;
  drawGrid(ctx, w, h, 40);
  const cx = w / 2;
  const cy = h / 2;
  const scale = 34;
  for (let gx = -7; gx <= 7; gx += 1) {
    for (let gy = -4; gy <= 4; gy += 1) {
      const len = Math.hypot(gx, gy) || 1;
      const vx = -gy / len;
      const vy = gx / len;
      const x = cx + gx * scale;
      const y = cy - gy * scale;
      drawArrow(ctx, x, y, x + vx * 18, y - vy * 18, "rgba(15,118,110,.5)");
    }
  }
  const a = (angle / 180) * Math.PI;
  const shear = 0.35;
  const transform = ([x, y]) => [
    Math.cos(a) * x - Math.sin(a) * y + shear * y,
    Math.sin(a) * x + Math.cos(a) * y,
  ];
  const basis = [[2.2, 0], [0, 2.2], [1.6, 1.2], [-1.2, 1.5]];
  basis.forEach((vector, index) => {
    const [tx, ty] = transform(vector);
    drawArrow(ctx, cx, cy, cx + vector[0] * 54, cy - vector[1] * 54, "rgba(51,65,85,.38)");
    drawArrow(ctx, cx, cy, cx + tx * 54, cy - ty * 54, index < 2 ? "#7c2d12" : "#0f766e");
  });
  ctx.fillStyle = "#334155";
  ctx.font = "600 18px system-ui";
  ctx.fillText(`Champ rotationnel · matrice angle ${angle}°`, 18, 30);
}

function drawNetworkVisualization(mode = $("#networkMode").value) {
  const canvas = $("#networkCanvas");
  const ctx = canvas.getContext("2d");
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, w, h);
  if (mode === "network") {
    const nodes = [
      ["Algèbre", 120, 100], ["Groupes", 280, 74], ["Matrices", 460, 115], ["Graphes", 530, 260],
      ["Topologie", 340, 330], ["Analyse", 155, 300], ["Probabilités", 315, 210],
    ];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [2, 6], [6, 5], [6, 3], [1, 6]];
    ctx.strokeStyle = "rgba(15,118,110,.35)";
    ctx.lineWidth = 3;
    edges.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(nodes[a][1], nodes[a][2]);
      ctx.lineTo(nodes[b][1], nodes[b][2]);
      ctx.stroke();
    });
    nodes.forEach(([label, x, y], index) => {
      ctx.fillStyle = index === 0 ? "#0f766e" : "#ffffff";
      ctx.strokeStyle = index === 0 ? "#0f766e" : "#cbd5e1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, label.length > 9 ? 44 : 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = index === 0 ? "#ffffff" : "#1f2937";
      ctx.font = "700 14px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x, y);
    });
  } else {
    const angle = (Date.now() / 1800) % (Math.PI * 2);
    const vertices = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    const project = ([x, y, z]) => {
      const xr = x * Math.cos(angle) - z * Math.sin(angle);
      const zr = x * Math.sin(angle) + z * Math.cos(angle);
      const yr = y * Math.cos(angle * 0.62) - zr * Math.sin(angle * 0.62);
      const zz = y * Math.sin(angle * 0.62) + zr * Math.cos(angle * 0.62);
      const s = 118 / (3.2 + zz);
      return [w / 2 + xr * s, h / 2 + yr * s];
    };
    const points = vertices.map(project);
    ctx.strokeStyle = "#0f766e";
    ctx.lineWidth = 4;
    edges.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(points[a][0], points[a][1]);
      ctx.lineTo(points[b][0], points[b][1]);
      ctx.stroke();
    });
    points.forEach(([x, y]) => {
      ctx.fillStyle = "#7c2d12";
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#334155";
    ctx.font = "600 18px system-ui";
    ctx.fillText("Polyèdre 3D manipulable", 18, 30);
  }
}

function animateNetworkStage() {
  if ($("#networkMode").value === "polyhedron") drawNetworkVisualization("polyhedron");
  requestAnimationFrame(animateNetworkStage);
}

function drawPlot() {
  const target = $("#plotlyChart");
  const expr = $("#functionInput").value;
  let fn;
  try {
    fn = createMathFunction(expr, ["x"]);
    fn(1);
  } catch {
    target.textContent = "Expression invalide.";
    return;
  }
  const xs = Array.from({ length: 801 }, (_, index) => -10 + index * 0.025);
  const ys = xs.map((x) => {
    const y = Number(fn(x));
    return Number.isFinite(y) && Math.abs(y) < 1e6 ? y : null;
  });
  if (!window.Plotly) {
    target.textContent = "Plotly.js n'est pas chargé.";
    return;
  }
  window.Plotly.react(target, [{
    x: xs,
    y: ys,
    mode: "lines",
    line: { color: "#0f766e", width: 3 },
    name: `f(x) = ${expr}`,
  }], {
    margin: { t: 28, r: 18, b: 42, l: 48 },
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    xaxis: { title: "x", zeroline: true, gridcolor: "#e5e7eb" },
    yaxis: { title: "f(x)", zeroline: true, gridcolor: "#e5e7eb" },
    showlegend: true,
  }, { responsive: true, displaylogo: false });
}

function renderLatexEditor() {
  const preview = $("#latexPreview");
  const value = $("#latexEditor").value.trim();
  if (!window.katex) {
    preview.textContent = value;
    return;
  }
  try {
    window.katex.render(value, preview, { throwOnError: false, displayMode: true });
  } catch {
    preview.textContent = "Formule LaTeX invalide.";
  }
}

let geometryPoints = {
  A: { x: 90, y: 245 },
  B: { x: 430, y: 245 },
  C: { x: 250, y: 72 },
};

function geometryDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function renderGeometry() {
  const svg = $("#geometryStage");
  const preset = $("#geometryPreset").value;
  const { A, B, C } = geometryPoints;
  const ab = geometryDistance(A, B);
  const bc = geometryDistance(B, C);
  const ca = geometryDistance(C, A);
  const midAB = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  const radius = geometryDistance(midAB, C);
  const thalesPoint = { x: A.x + (B.x - A.x) * 0.68, y: A.y + (B.y - A.y) * 0.68 };
  const thalesTop = { x: thalesPoint.x + (C.x - A.x) * 0.68, y: thalesPoint.y + (C.y - A.y) * 0.68 };
  const triangle = `
    <polygon points="${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}" fill="rgba(15,118,110,.12)" stroke="#0f766e" stroke-width="3"></polygon>
  `;
  const extras = preset === "circle" ? `
    <circle cx="${midAB.x}" cy="${midAB.y}" r="${radius}" fill="none" stroke="#1d4ed8" stroke-width="3"></circle>
    <line x1="${midAB.x}" y1="${midAB.y}" x2="${C.x}" y2="${C.y}" stroke="#1d4ed8" stroke-width="2"></line>
  ` : preset === "thales" ? `
    <line x1="${A.x}" y1="${C.y}" x2="${B.x}" y2="${C.y}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="8 6"></line>
    <line x1="${thalesPoint.x}" y1="${thalesPoint.y}" x2="${thalesTop.x}" y2="${thalesTop.y}" stroke="#9a3412" stroke-width="3"></line>
    <circle cx="${thalesPoint.x}" cy="${thalesPoint.y}" r="5" fill="#9a3412"></circle>
    <circle cx="${thalesTop.x}" cy="${thalesTop.y}" r="5" fill="#9a3412"></circle>
  ` : `
    <line x1="${C.x}" y1="${C.y}" x2="${midAB.x}" y2="${midAB.y}" stroke="#9a3412" stroke-width="3" stroke-dasharray="6 5"></line>
  `;
  svg.innerHTML = `
    <rect x="0" y="0" width="520" height="320" rx="8" fill="#f8fafc"></rect>
    ${triangle}
    ${extras}
    ${Object.entries(geometryPoints).map(([label, point]) => `
      <g class="geometry-point" data-point="${label}" tabindex="0">
        <circle cx="${point.x}" cy="${point.y}" r="12" fill="#ffffff" stroke="#0f766e" stroke-width="4"></circle>
        <text x="${point.x}" y="${point.y - 18}" text-anchor="middle">${label}</text>
      </g>
    `).join("")}
  `;
  $("#geometryReadout").textContent = `AB=${formatNumber(ab)} · BC=${formatNumber(bc)} · CA=${formatNumber(ca)} · aire≈${formatNumber(Math.abs((A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) / 2))}`;
  svg.querySelectorAll("[data-point]").forEach((node) => {
    node.addEventListener("pointerdown", (event) => {
      node.setPointerCapture(event.pointerId);
      const move = (moveEvent) => {
        const rect = svg.getBoundingClientRect();
        const x = ((moveEvent.clientX - rect.left) / rect.width) * 520;
        const y = ((moveEvent.clientY - rect.top) / rect.height) * 320;
        geometryPoints[node.dataset.point] = {
          x: Math.max(24, Math.min(496, x)),
          y: Math.max(24, Math.min(296, y)),
        };
        renderGeometry();
      };
      const up = () => {
        node.removeEventListener("pointermove", move);
        node.removeEventListener("pointerup", up);
      };
      node.addEventListener("pointermove", move);
      node.addEventListener("pointerup", up);
    });
  });
}

let threeSceneState = null;

function renderThreeScene() {
  const stage = $("#threeStage");
  if (!window.THREE) {
    stage.textContent = "Three.js n'est pas chargé.";
    return;
  }
  const probe = document.createElement("canvas");
  if (!probe.getContext("webgl") && !probe.getContext("experimental-webgl")) {
    stage.innerHTML = `<div class="three-fallback">Three.js est chargé, mais WebGL n'est pas disponible dans ce navigateur.</div>`;
    return;
  }
  const width = stage.clientWidth || 520;
  const height = 320;
  stage.innerHTML = "";
  try {
    const scene = new window.THREE.Scene();
    scene.background = new window.THREE.Color(0xf8fafc);
    const camera = new window.THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 4.6);
    const renderer = new window.THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    stage.appendChild(renderer.domElement);
    scene.add(new window.THREE.HemisphereLight(0xffffff, 0x94a3b8, 2.4));
    const material = new window.THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.38, metalness: 0.08 });
    const shape = $("#threeShape").value;
    const geometry = shape === "dodecahedron"
      ? new window.THREE.DodecahedronGeometry(1.35)
      : shape === "box"
        ? new window.THREE.BoxGeometry(1.85, 1.85, 1.85)
        : new window.THREE.IcosahedronGeometry(1.45);
    const mesh = new window.THREE.Mesh(geometry, material);
    const wire = new window.THREE.LineSegments(new window.THREE.WireframeGeometry(geometry), new window.THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
    mesh.add(wire);
    scene.add(mesh);
    threeSceneState = { renderer, scene, camera, mesh };
    const animate = () => {
      if (threeSceneState?.mesh !== mesh) return;
      mesh.rotation.x += 0.008;
      mesh.rotation.y += 0.012;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  } catch {
    stage.innerHTML = `<div class="three-fallback">Three.js est chargé, mais la scène WebGL n'a pas pu être créée.</div>`;
  }
}

function renderD3Network() {
  const svg = $("#d3Network");
  if (!window.d3) {
    svg.innerHTML = `<text x="24" y="40">D3.js n'est pas chargé.</text>`;
    return;
  }
  const mode = $("#d3NetworkMode").value;
  const nodes = mode === "media"
    ? media.slice(0, 16).map((item) => ({ id: item.title, group: item.type, size: 5 + item.links.length }))
    : mode === "people"
      ? mathematicians.slice(0, 18).map((item) => ({ id: item.name, group: item.domains[0], size: 8 }))
      : domains.slice(0, 14).map((item) => ({ id: item.name, group: item.family, size: 10 }));
  const links = nodes.flatMap((node, index) => [
    index > 0 ? { source: nodes[index - 1].id, target: node.id } : null,
    index > 2 && index % 3 === 0 ? { source: nodes[index - 3].id, target: node.id } : null,
  ]).filter(Boolean);
  const root = window.d3.select(svg);
  root.selectAll("*").remove();
  const width = 620;
  const height = 360;
  const color = window.d3.scaleOrdinal(["#0f766e", "#9a3412", "#1d4ed8", "#b7791f", "#334155"]);
  const simulation = window.d3.forceSimulation(nodes)
    .force("link", window.d3.forceLink(links).id((d) => d.id).distance(86))
    .force("charge", window.d3.forceManyBody().strength(-210))
    .force("center", window.d3.forceCenter(width / 2, height / 2));
  const link = root.append("g").attr("stroke", "#cbd5e1").attr("stroke-width", 2)
    .selectAll("line").data(links).join("line");
  const node = root.append("g").selectAll("g").data(nodes).join("g").call(
    window.d3.drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      })
  );
  node.append("circle").attr("r", (d) => d.size).attr("fill", (d) => color(d.group)).attr("stroke", "#ffffff").attr("stroke-width", 2);
  node.append("title").text((d) => `${d.id} · ${d.group}`);
  node.append("text").text((d) => d.id.length > 18 ? `${d.id.slice(0, 16)}…` : d.id).attr("x", 12).attr("y", 4).attr("font-size", 11).attr("font-weight", 800);
  simulation.on("tick", () => {
    link.attr("x1", (d) => d.source.x).attr("y1", (d) => d.source.y).attr("x2", (d) => d.target.x).attr("y2", (d) => d.target.y);
    node.attr("transform", (d) => `translate(${Math.max(18, Math.min(width - 18, d.x))},${Math.max(18, Math.min(height - 18, d.y))})`);
  });
}

function normalizeMathExpression(expr) {
  const names = "sin|cos|tan|asin|acos|atan|exp|log|sqrt|abs|pow|min|max|floor|ceil|round|PI|E";
  return expr
    .replace(/\^/g, "**")
    .replace(new RegExp(`(^|[^\\w.])(${names})\\b`, "g"), "$1Math.$2");
}

function createMathFunction(expr, variables = []) {
  const safe = normalizeMathExpression(expr);
  return new Function(...variables, `"use strict"; return ${safe};`);
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "non défini";
  return Math.abs(value) >= 100000 || Math.abs(value) < 0.0001 && value !== 0
    ? value.toExponential(5)
    : value.toFixed(6).replace(/\.?0+$/, "");
}

function calculateScientific() {
  try {
    const fn = createMathFunction($("#scientificInput").value);
    $("#scientificResult").textContent = formatNumber(Number(fn()));
  } catch {
    $("#scientificResult").textContent = "Expression invalide.";
  }
}

function parseMatrix(value) {
  const rows = value.trim().split(";").map((row) => row.trim().split(/[\s,]+/).filter(Boolean).map(Number));
  if (!rows.length || rows.some((row) => !row.length || row.some((cell) => !Number.isFinite(cell)))) throw new Error("Matrice invalide");
  if (new Set(rows.map((row) => row.length)).size !== 1) throw new Error("Dimensions incohérentes");
  return rows;
}

function matrixProduct(a, b) {
  if (a[0].length !== b.length) throw new Error("Dimensions incompatibles");
  return a.map((row) => b[0].map((_, col) => row.reduce((sum, value, index) => sum + value * b[index][col], 0)));
}

function matrixDet2(m) {
  if (m.length !== 2 || m[0].length !== 2) return null;
  return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}

function matrixInverse2(m) {
  const det = matrixDet2(m);
  if (det === null || Math.abs(det) < 1e-12) return null;
  return [[m[1][1] / det, -m[0][1] / det], [-m[1][0] / det, m[0][0] / det]];
}

function renderMatrix(matrix) {
  return matrix.map((row) => `[${row.map(formatNumber).join("  ")}]`).join(" ");
}

function calculateMatrix() {
  try {
    const a = parseMatrix($("#matrixA").value);
    const b = parseMatrix($("#matrixB").value);
    const product = matrixProduct(a, b);
    const detA = matrixDet2(a);
    const inverseA = matrixInverse2(a);
    $("#matrixResult").innerHTML = `
      <span>A × B = ${renderMatrix(product)}</span>
      <span>det(A) = ${detA === null ? "hors 2x2" : formatNumber(detA)}</span>
      <span>A⁻¹ = ${inverseA ? renderMatrix(inverseA) : "non disponible"}</span>
    `;
  } catch (error) {
    $("#matrixResult").textContent = error.message;
  }
}

function symbolicDerivative(expr) {
  const compact = expr.replace(/\s+/g, "");
  if (compact === "x") return "1";
  if (/^-?\d+(\.\d+)?$/.test(compact)) return "0";
  const power = compact.match(/^([+-]?\d*\.?\d*)\*?x\^([+-]?\d+)$/);
  if (power) {
    const coefficient = power[1] === "" || power[1] === "+" ? 1 : power[1] === "-" ? -1 : Number(power[1]);
    const exponent = Number(power[2]);
    return `${formatNumber(coefficient * exponent)}x^${exponent - 1}`;
  }
  const linear = compact.match(/^([+-]?\d*\.?\d*)\*?x$/);
  if (linear) return formatNumber(linear[1] === "" || linear[1] === "+" ? 1 : linear[1] === "-" ? -1 : Number(linear[1]));
  if (compact === "sin(x)") return "cos(x)";
  if (compact === "cos(x)") return "-sin(x)";
  if (compact === "exp(x)") return "exp(x)";
  return "forme symbolique non reconnue";
}

function simpsonIntegral(fn, a, b, steps = 240) {
  const n = steps % 2 === 0 ? steps : steps + 1;
  const h = (b - a) / n;
  let sum = fn(a) + fn(b);
  for (let i = 1; i < n; i += 1) sum += fn(a + i * h) * (i % 2 ? 4 : 2);
  return (sum * h) / 3;
}

function calculateCalculus() {
  try {
    const expr = $("#calculusExpression").value;
    const x = Number($("#calculusPoint").value);
    const fn = createMathFunction(expr, ["x"]);
    const h = 1e-4;
    const derivative = (fn(x + h) - fn(x - h)) / (2 * h);
    const integral = simpsonIntegral(fn, 0, x);
    $("#calculusResult").innerHTML = `
      <span>f(${formatNumber(x)}) = ${formatNumber(fn(x))}</span>
      <span>f'(${formatNumber(x)}) ≈ ${formatNumber(derivative)}</span>
      <span>∫₀^${formatNumber(x)} f(x) dx ≈ ${formatNumber(integral)}</span>
      <span>Dérivée symbolique simple : ${symbolicDerivative(expr)}</span>
    `;
  } catch {
    $("#calculusResult").textContent = "Expression invalide.";
  }
}

function solveQuadratic() {
  const a = Number($("#equationA").value);
  const b = Number($("#equationB").value);
  const c = Number($("#equationC").value);
  if (![a, b, c].every(Number.isFinite)) {
    $("#equationResult").textContent = "Coefficients invalides.";
    return;
  }
  if (Math.abs(a) < 1e-12) {
    $("#equationResult").textContent = Math.abs(b) < 1e-12 ? "Équation dégénérée." : `x = ${formatNumber(-c / b)}`;
    return;
  }
  const delta = b * b - 4 * a * c;
  if (delta < 0) {
    const real = -b / (2 * a);
    const imag = Math.sqrt(-delta) / (2 * a);
    $("#equationResult").textContent = `Δ = ${formatNumber(delta)} · x = ${formatNumber(real)} ± ${formatNumber(imag)}i`;
  } else {
    const root = Math.sqrt(delta);
    $("#equationResult").textContent = `Δ = ${formatNumber(delta)} · x₁ = ${formatNumber((-b - root) / (2 * a))}, x₂ = ${formatNumber((-b + root) / (2 * a))}`;
  }
}

function generateSequence() {
  try {
    const fn = createMathFunction($("#sequenceExpression").value, ["n"]);
    const count = Math.max(1, Math.min(30, Number($("#sequenceCount").value) || 8));
    const values = Array.from({ length: count }, (_, index) => formatNumber(Number(fn(index))));
    $("#sequenceResult").textContent = values.join(", ");
  } catch {
    $("#sequenceResult").textContent = "Expression de suite invalide.";
  }
}

function calculateStats() {
  const values = $("#statsInput").value.split(/[\s,;]+/).filter(Boolean).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!values.length) {
    $("#statsResult").textContent = "Aucune donnée valide.";
    return;
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const median = values.length % 2 ? values[(values.length - 1) / 2] : (values[values.length / 2 - 1] + values[values.length / 2]) / 2;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  $("#statsResult").innerHTML = `
    <span>n = ${values.length}</span>
    <span>moyenne = ${formatNumber(mean)}</span>
    <span>médiane = ${formatNumber(median)}</span>
    <span>variance = ${formatNumber(variance)}</span>
    <span>écart-type = ${formatNumber(Math.sqrt(variance))}</span>
    <span>min/max = ${formatNumber(values[0])} / ${formatNumber(values.at(-1))}</span>
  `;
}

function combination(n, k) {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= Math.min(k, n - k); i += 1) result = (result * (n - i + 1)) / i;
  return result;
}

function calculateProbability() {
  const n = Math.trunc(Number($("#probabilityN").value));
  const k = Math.trunc(Number($("#probabilityK").value));
  const p = Number($("#probabilityP").value);
  if (n < 0 || k < 0 || k > n || p < 0 || p > 1) {
    $("#probabilityResult").textContent = "Paramètres invalides.";
    return;
  }
  const exact = combination(n, k) * p ** k * (1 - p) ** (n - k);
  const cumulative = Array.from({ length: k + 1 }, (_, index) => combination(n, index) * p ** index * (1 - p) ** (n - index)).reduce((sum, value) => sum + value, 0);
  $("#probabilityResult").innerHTML = `
    <span>P(X = ${k}) = ${formatNumber(exact)}</span>
    <span>P(X ≤ ${k}) = ${formatNumber(cumulative)}</span>
    <span>E(X) = ${formatNumber(n * p)}</span>
    <span>Var(X) = ${formatNumber(n * p * (1 - p))}</span>
  `;
}

const unitTable = {
  deg: { label: "degré", family: "angle", factor: Math.PI / 180 },
  rad: { label: "radian", family: "angle", factor: 1 },
  m: { label: "mètre", family: "length", factor: 1 },
  km: { label: "kilomètre", family: "length", factor: 1000 },
  cm: { label: "centimètre", family: "length", factor: 0.01 },
  inch: { label: "pouce", family: "length", factor: 0.0254 },
  kg: { label: "kilogramme", family: "mass", factor: 1 },
  g: { label: "gramme", family: "mass", factor: 0.001 },
  lb: { label: "livre", family: "mass", factor: 0.45359237 },
};

function convertUnit() {
  const value = Number($("#converterValue").value);
  const from = unitTable[$("#converterFrom").value];
  const to = unitTable[$("#converterTo").value];
  if (!Number.isFinite(value) || !from || !to || from.family !== to.family) {
    $("#converterResult").textContent = "Unités incompatibles.";
    return;
  }
  const converted = (value * from.factor) / to.factor;
  $("#converterResult").textContent = `${formatNumber(value)} ${from.label} = ${formatNumber(converted)} ${to.label}`;
}

function renderLabTools() {
  calculateScientific();
  calculateMatrix();
  calculateCalculus();
  solveQuadratic();
  generateSequence();
  calculateStats();
  calculateProbability();
  convertUnit();
}

function renderGraph() {
  const svg = $("#knowledgeGraph");
  const activeTypeKey = Object.entries(networkTypeLabels).find(([, label]) => label === activeNetworkType)?.[0] || "Tous";
  const visibleNodes = knowledgeNetwork.nodes.filter((node) => activeTypeKey === "Tous" || node.type === "domain" || node.type === activeTypeKey);
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = knowledgeNetwork.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  $("#networkTypeTabs").innerHTML = networkTypes.map((type) => `<button class="${type === activeNetworkType ? "active" : ""}" type="button">${type}</button>`).join("");
  $("#networkStats").innerHTML = `
    <strong>${visibleNodes.length}</strong><span>nœuds</span>
    <strong>${visibleEdges.length}</strong><span>liens</span>
    <strong>${visibleNodes.filter((node) => node.type === "domain").length}</strong><span>domaines</span>
    <strong>${new Set(visibleNodes.map((node) => node.type)).size}</strong><span>types</span>
  `;
  const nodeById = new Map(knowledgeNetwork.nodes.map((node) => [node.id, node]));
  const edgeMarkup = visibleEdges.map((edge) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    return `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" />`;
  }).join("");
  const nodeMarkup = visibleNodes.map((node) => `
    <g class="node node-${node.type} ${node.id === activeNetworkNode ? "active" : ""}" tabindex="0" data-node-id="${node.id}" transform="translate(${node.x} ${node.y})">
      <circle r="${node.type === "domain" ? 43 : 31}"></circle>
      <text text-anchor="middle" dominant-baseline="middle">${node.label.length > 16 ? `${node.label.slice(0, 14)}…` : node.label}</text>
      <title>${node.label} · ${networkTypeLabels[node.type]}</title>
    </g>
  `).join("");
  svg.innerHTML = `<g class="edges">${edgeMarkup}</g><g>${nodeMarkup}</g>`;
  svg.querySelectorAll(".node").forEach((node) => {
    node.addEventListener("click", () => {
      activeNetworkNode = node.dataset.nodeId;
      renderGraph();
    });
    node.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      activeNetworkNode = node.dataset.nodeId;
      renderGraph();
    });
  });
  $("#networkTypeTabs").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeNetworkType = button.textContent;
      renderGraph();
    });
  });
  renderNetworkDetail();
}

function renderNetworkDetail() {
  const node = knowledgeNetwork.nodes.find((item) => item.id === activeNetworkNode) || knowledgeNetwork.nodes[0];
  if (!node) {
    $("#networkDetail").innerHTML = card("Réseau vide", "Aucune donnée exploitable pour construire le réseau.", "Réseau");
    return;
  }
  const neighbors = node.neighbors
    .map((id) => knowledgeNetwork.nodes.find((item) => item.id === id))
    .filter(Boolean)
    .slice(0, 10);
  $("#networkDetail").innerHTML = `
    <div class="network-detail-header">
      <span>${networkTypeLabels[node.type]}</span>
      <small>${node.meta || "Réseau de connaissances"}</small>
    </div>
    <h3>${node.label}</h3>
    <p>${node.summary || "Nœud relié aux contenus documentaires de Mathemator."}</p>
    <div class="network-neighbors">
      ${neighbors.map((neighbor) => `<button type="button" data-node-id="${neighbor.id}">${neighbor.label}</button>`).join("")}
    </div>
  `;
  $("#networkDetail").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeNetworkNode = button.dataset.nodeId;
      renderGraph();
    });
  });
}

function registerPwa() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/service-worker.js");
  let deferredPrompt;
  const button = $("#installButton");
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    button.hidden = false;
  });
  button.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    button.hidden = true;
  });
}

renderDaily();
renderHomeMedia();
renderSearch();
renderMathematicians();
renderTimeline();
renderMap();
renderDomains();
renderReferences();
renderObjects();
renderLearning();
renderLibrary();
renderProblems();
renderGraph();
renderModes();
renderModules();
renderFavorites();
setScreen(location.hash?.replace("#", "") || "home", { silent: true });
drawHero();
drawMandelbrot();
drawSurface();
drawCurveVisualization();
drawVectorVisualization();
drawNetworkVisualization();
animateNetworkStage();
drawPlot();
renderLatexEditor();
renderGeometry();
renderThreeScene();
renderD3Network();
renderLabTools();
registerPwa();

$("#quoteSearch").addEventListener("input", renderQuotes);
$("#quoteAuthorFilter").addEventListener("change", (event) => {
  activeQuoteAuthor = event.target.value;
  renderQuotes();
});
$("#quoteThemeFilter").addEventListener("change", (event) => {
  activeQuoteTheme = event.target.value;
  renderQuotes();
});
$("#quotePeriodFilter").addEventListener("change", (event) => {
  activeQuotePeriod = event.target.value;
  renderQuotes();
});
$("#bookSearch").addEventListener("input", renderBooks);
$("#bookAuthorFilter").addEventListener("change", (event) => {
  activeBookAuthor = event.target.value;
  renderBooks();
});
$("#bookCategoryFilter").addEventListener("change", (event) => {
  activeBookCategory = event.target.value;
  renderBooks();
});
$("#bookLevelFilter").addEventListener("change", (event) => {
  activeBookLevel = event.target.value;
  renderBooks();
});
$("#glossarySearch").addEventListener("input", renderGlossary);
$("#glossaryInitialFilter").addEventListener("change", (event) => {
  activeGlossaryInitial = event.target.value;
  renderGlossary();
});
$("#glossaryLinkFilter").addEventListener("change", (event) => {
  activeGlossaryLink = event.target.value;
  renderGlossary();
});
$("#openMediaLibraryButton").addEventListener("click", () => {
  activeLibrary = "Médiathèque";
  activeMediaType = "Tous";
  renderLibrary();
  setScreen("cards");
  $("#ressources").scrollIntoView({ behavior: "smooth", block: "start" });
});
$("#mediaPrevButton").addEventListener("click", () => {
  homeMediaOffset = (homeMediaOffset - 8 + media.length) % media.length;
  renderHomeMedia();
});
$("#mediaNextButton").addEventListener("click", () => {
  homeMediaOffset = (homeMediaOffset + 8) % media.length;
  renderHomeMedia();
});
$("#mediaShuffleButton").addEventListener("click", () => {
  homeMediaOffset = Math.floor(Math.random() * media.length);
  renderHomeMedia();
});
$("#mediaSearch").addEventListener("input", renderMedia);
$("#mediaTypeFilter").addEventListener("change", (event) => {
  activeMediaType = event.target.value;
  renderMedia();
});
$("#mediaDomainFilter").addEventListener("change", (event) => {
  activeMediaDomain = event.target.value;
  renderMedia();
});
$("#mediaSourceFilter").addEventListener("change", (event) => {
  activeMediaSource = event.target.value;
  renderMedia();
});
$("#mandelbrotButton").addEventListener("click", drawMandelbrot);
$("#surfaceSlider").addEventListener("input", (event) => drawSurface(Number(event.target.value)));
$("#curveMode").addEventListener("change", (event) => drawCurveVisualization(event.target.value));
$("#matrixSlider").addEventListener("input", (event) => drawVectorVisualization(Number(event.target.value)));
$("#networkMode").addEventListener("change", (event) => drawNetworkVisualization(event.target.value));
$("#plotButton").addEventListener("click", drawPlot);
$("#latexRenderButton").addEventListener("click", renderLatexEditor);
$("#latexEditor").addEventListener("input", renderLatexEditor);
$("#geometryPreset").addEventListener("change", renderGeometry);
$("#threeShape").addEventListener("change", renderThreeScene);
$("#d3NetworkMode").addEventListener("change", renderD3Network);
$("#scientificButton").addEventListener("click", calculateScientific);
$("#matrixButton").addEventListener("click", calculateMatrix);
$("#calculusButton").addEventListener("click", calculateCalculus);
$("#equationButton").addEventListener("click", solveQuadratic);
$("#sequenceButton").addEventListener("click", generateSequence);
$("#statsButton").addEventListener("click", calculateStats);
$("#probabilityButton").addEventListener("click", calculateProbability);
$("#converterButton").addEventListener("click", convertUnit);
$("#hintButton").addEventListener("click", () => {
  hintVisible = !hintVisible;
  renderExercise();
});
$("#quizModeSelect").addEventListener("change", (event) => {
  activeQuizMode = event.target.value;
  currentQuiz = 0;
  quizScore = 0;
  quizStreak = 0;
  renderQuiz();
});
$("#nextQuestionButton").addEventListener("click", () => {
  currentQuiz += 1;
  renderQuiz();
});
$("#resetProgressButton").addEventListener("click", () => {
  store.set("mathemator:progress", { ...defaultProgress(), minutes: 0 });
  store.set("mathemator:favorites", []);
  renderProgress();
  renderSearch();
  renderFavorites();
});
$("#clearFavoritesButton").addEventListener("click", () => {
  store.set("mathemator:favorites", []);
  activeFavoriteType = "Tous";
  renderFavorites();
  renderProgress();
  renderSearch();
});
$("#detailCloseButton").addEventListener("click", () => {
  $("#detailPanel").hidden = true;
});
document.querySelectorAll("[data-nav]").forEach((button) => {
  button.addEventListener("click", () => setScreen(button.dataset.nav));
});
$("#menuButton").addEventListener("click", () => {
  setMenuOpen(!document.body.classList.contains("menu-open"));
});
$("#menuCloseButton").addEventListener("click", closeMenu);
$("#menuOverlay").addEventListener("click", closeMenu);
document.querySelectorAll("[data-menu-screen]").forEach((button) => {
  button.addEventListener("click", () => navigateFromMenu(button.dataset.menuScreen, button.dataset.menuTarget));
});
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-favorite]");
  if (!button) return;
  event.preventDefault();
  toggleFavorite(button.dataset.favorite);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("menu-open")) closeMenu();
});
addEventListener("hashchange", () => {
  setScreen(location.hash.replace("#", "") || "home", { silent: true });
});
