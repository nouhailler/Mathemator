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
let activeChipFilter = "Tous";
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

const searchIndex = [
  ...entries.map((item) => ({
    id: `entry:${item.title}`,
    type: item.type,
    title: item.title,
    meta: item.meta,
    text: item.text,
    tags: item.tags,
    period: "",
    nationality: "",
    difficulty: "",
    payload: item,
  })),
  ...mathematicians.map((item) => ({
    id: `person:${item.id}`,
    type: "Mathématicien",
    title: item.name,
    meta: `${item.period} · ${item.nationality} · ${item.domains.join(", ")}`,
    text: item.biography,
    tags: [...item.domains, item.nationality, item.period],
    period: item.period,
    nationality: item.nationality,
    difficulty: "",
    payload: item,
  })),
  ...theorems.map((item) => ({
    id: `theorem:${item.name}`,
    type: "Théorème",
    title: item.name,
    meta: `${item.discoverer} · ${item.applications}`,
    text: item.intuition,
    tags: [item.discoverer, item.history, ...item.variants],
    period: "",
    nationality: "",
    difficulty: "",
    payload: item,
  })),
  ...formulas.map((item) => ({
    id: `formula:${item.name}`,
    type: "Formule",
    title: item.name,
    meta: item.category,
    text: item.explanation,
    tags: [item.category, ...item.uses],
    period: "",
    nationality: "",
    difficulty: "",
    payload: item,
  })),
  ...domains.map((item) => ({
    id: `domain:${item.name}`,
    type: "Domaine",
    title: item.name,
    meta: `${item.family} · ${item.people}`,
    text: item.intro,
    tags: [item.family, ...item.concepts, ...item.theorems, ...(item.methods || []), ...(item.subdomains || []), ...(item.related || []), item.applications],
    period: "",
    nationality: "",
    difficulty: "",
    payload: item,
  })),
  ...objects.map((item) => ({
    id: `object:${item.name}`,
    type: "Objet",
    title: item.name,
    meta: `${item.category || "Objet"} · ${item.dimension || ""} · ${item.applications}`,
    text: item.description,
    tags: [item.category, item.dimension, ...item.properties, ...(item.related || []), item.history, item.interactive, item.formula],
    period: "",
    nationality: "",
    difficulty: "",
    payload: item,
  })),
  ...exercises.map((item, index) => ({
    id: `exercise:${index}`,
    type: "Exercice",
    title: item.prompt,
    meta: `${item.domain} · ${item.level} · ${item.difficulty} · ${item.time}`,
    text: item.solution,
    tags: [item.domain, item.level, item.difficulty],
    period: "",
    nationality: "",
    difficulty: item.difficulty,
    payload: item,
  })),
  ...problems.map((item) => ({
    id: `problem:${item.name}`,
    type: "Problème",
    title: item.name,
    meta: item.status,
    text: item.text,
    tags: [item.history, item.current, item.advances, item.impact],
    period: "",
    nationality: "",
    difficulty: "",
    payload: item,
  })),
  ...books.map((item) => ({
    id: `book:${item.title}`,
    type: "Livre",
    title: item.title,
    meta: `${item.author} · ${item.category} · ${item.level}`,
    text: item.description,
    tags: [item.author, item.category, item.level],
    period: "",
    nationality: "",
    difficulty: item.level,
    payload: item,
  })),
  ...glossary.map((item) => ({
    id: `glossary:${item.term}`,
    type: "Glossaire",
    title: item.term,
    meta: item.links.join(", "),
    text: item.definition,
    tags: item.links,
    period: "",
    nationality: "",
    difficulty: "",
    payload: item,
  })),
].map((item) => ({ ...item, searchText: normalize(asSearchText(item)) }));

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
  if (!query) return 1;
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return 1;
  let score = 0;
  const title = normalize(entry.title);
  const meta = normalize(entry.meta);
  for (const term of terms) {
    if (title === term) score += 12;
    if (title.includes(term)) score += 7;
    if (meta.includes(term)) score += 4;
    if (entry.searchText.includes(term)) score += 2;
  }
  return score;
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

function renderSearch() {
  const filters = ["Tous", "Mathématicien", "Théorème", "Formule", "Algèbre", "Analyse", "Fractales", "Graphes", "Nombres", "Topologie"];
  const input = $("#searchInput");
  const chips = $("#filterChips");
  const list = $("#resultList");
  const typeFilter = $("#typeFilter");
  const periodFilter = $("#periodFilter");
  const nationalityFilter = $("#nationalityFilter");
  const difficultyFilter = $("#difficultyFilter");
  typeFilter.innerHTML = optionList([...new Set(searchIndex.map((entry) => entry.type))].sort());
  periodFilter.innerHTML = optionList([...new Set(searchIndex.map((entry) => entry.period).filter((value) => /siècle|Antiquité|Moyen|Renaissance/i.test(value)))].sort());
  nationalityFilter.innerHTML = optionList([...new Set(searchIndex.map((entry) => entry.nationality).filter(Boolean))].sort(), "Toutes");
  difficultyFilter.innerHTML = optionList([...new Set(searchIndex.map((entry) => entry.difficulty).filter(Boolean))].sort(), "Toutes");
  typeFilter.value = activeTypeFilter;
  periodFilter.value = activePeriodFilter;
  nationalityFilter.value = activeNationalityFilter;
  difficultyFilter.value = activeDifficultyFilter;
  const draw = () => {
    const query = input.value.trim();
    const chip = normalize(activeChipFilter);
    const visible = searchIndex
      .map((entry) => ({ ...entry, score: scoreEntry(entry, query) }))
      .filter((entry) => entry.score > 0)
      .filter((entry) => activeChipFilter === "Tous" || entry.searchText.includes(chip) || normalize(entry.type).includes(chip))
      .filter((entry) => activeTypeFilter === "Tous" || entry.type === activeTypeFilter)
      .filter((entry) => activePeriodFilter === "Tous" || entry.period === activePeriodFilter)
      .filter((entry) => activeNationalityFilter === "Tous" || entry.nationality === activeNationalityFilter)
      .filter((entry) => activeDifficultyFilter === "Tous" || entry.difficulty === activeDifficultyFilter)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "fr"))
      .slice(0, 40);
    chips.innerHTML = filters.map((filter) => `<button class="${filter === activeChipFilter ? "active" : ""}" type="button">${filter}</button>`).join("");
    list.innerHTML = visible.map(({ id, type, title, meta, text }) => card(
      title,
      text,
      `${type} · ${meta}`,
      `<div class="card-actions"><button class="mini-button" type="button" data-open="${id}">Ouvrir</button>${favoriteButton(id, title)}</div>`
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
    activeTypeFilter = typeFilter.value;
    draw();
  });
  periodFilter.addEventListener("change", () => {
    activePeriodFilter = periodFilter.value;
    draw();
  });
  nationalityFilter.addEventListener("change", () => {
    activeNationalityFilter = nationalityFilter.value;
    draw();
  });
  difficultyFilter.addEventListener("change", () => {
    activeDifficultyFilter = difficultyFilter.value;
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
    button.addEventListener("click", () => {
      const id = button.dataset.favorite;
      const favorites = store.get("mathemator:favorites", []);
      const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
      store.set("mathemator:favorites", next);
      renderSearch();
      renderProgress();
      renderFavorites();
    });
  });
}

function bindDetailButtons() {
  document.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => openDetail(button.dataset.open));
  });
}

function renderFavorites() {
  const favorites = store.get("mathemator:favorites", []);
  const list = $("#favoritesList");
  const items = favorites.map((id) => searchIndex.find((entry) => entry.id === id) || { id, type: "Favori", title: id, meta: "", text: "Élément enregistré." });
  list.innerHTML = items.length
    ? items.map(({ id, type, title, meta, text }) => card(
      title,
      text,
      `${type}${meta ? ` · ${meta}` : ""}`,
      `<div class="card-actions"><button class="mini-button" type="button" data-open="${id}">Ouvrir</button>${favoriteButton(id, title)}</div>`
    )).join("")
    : card("Aucun favori", "Ajoute des mathématiciens, théorèmes, formules, exercices ou objets depuis les fiches et les résultats.", "Collection");
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
      bumpProgress("exercises");
      renderProgress();
    });
    $("#nextExerciseButton")?.addEventListener("click", () => {
      const index = visible.findIndex((item) => item.id === activeExerciseId);
      activeExerciseId = visible[(index + 1) % visible.length]?.id || activeExerciseId;
      currentExercise += 1;
      hintVisible = false;
      draw();
    });
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
    bumpProgress("quiz");
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

function bumpProgress(key) {
  const progress = store.get("mathemator:progress", { exercises: 0, quiz: 0, minutes: 12 });
  progress[key] = (progress[key] || 0) + 1;
  progress.minutes = (progress.minutes || 0) + 3;
  store.set("mathemator:progress", progress);
}

function renderProgress() {
  const progress = store.get("mathemator:progress", { exercises: 0, quiz: 0, minutes: 12 });
  const favorites = store.get("mathemator:favorites", []);
  const mastery = Math.min(100, 18 + progress.exercises * 7 + progress.quiz * 5 + favorites.length * 4);
  $("#progressBox").innerHTML = `
    <div class="meter"><span style="width:${mastery}%"></span></div>
    <div class="stats-row">
      <strong>${progress.minutes}</strong><span>min</span>
      <strong>${progress.exercises}</strong><span>exercices</span>
      <strong>${progress.quiz}</strong><span>quiz</span>
      <strong>${favorites.length}</strong><span>favoris</span>
    </div>
    <p class="muted">Maîtrise estimée : ${mastery}%</p>
  `;
}

function renderLibrary() {
  const tabs = ["Citations", "Livres", "Glossaire"];
  $("#libraryTabs").innerHTML = tabs.map((tab) => `<button class="${tab === activeLibrary ? "active" : ""}" type="button">${tab}</button>`).join("");
  const data = activeLibrary === "Citations" ? quotes : activeLibrary === "Livres" ? books : glossary;
  $("#libraryPanel").innerHTML = data.map((item) => {
    if (activeLibrary === "Citations") return card(`« ${item.text} »`, `${item.theme} · ${item.period}`, item.author);
    if (activeLibrary === "Livres") return card(item.title, `${item.description}<br><strong>${item.category}</strong> · ${item.level}`, item.author);
    return card(item.term, `${item.definition}<br><strong>Renvois :</strong> ${item.links.join(", ")}`, "Définition");
  }).join("");
  $("#libraryTabs").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeLibrary = button.textContent;
      renderLibrary();
    });
  });
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
    </article>
  `;
}

function renderModes() {
  const tabs = Object.keys(modeContent);
  $("#modeTabs").innerHTML = tabs.map((tab) => `<button class="${tab === activeMode ? "active" : ""}" type="button">${tab}</button>`).join("");
  $("#modePanel").innerHTML = `
    <div class="workflow">
      ${modeContent[activeMode].map((item, index) => `<article><strong>${index + 1}</strong><span>${item}</span></article>`).join("")}
    </div>
  `;
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
    </article>
  `).join("");
}

const graphNodes = [
  ["Euler", 120, 120], ["Graphes", 300, 90], ["Analyse", 340, 230], ["Noether", 560, 130], ["Algèbre", 720, 110],
  ["Riemann", 570, 340], ["Zêta", 740, 350], ["Fractales", 230, 390], ["Mandelbrot", 105, 330], ["Catégories", 430, 420],
];
const graphEdges = [[0, 1], [0, 2], [3, 4], [4, 9], [5, 6], [2, 5], [7, 8], [2, 7], [4, 2], [9, 3]];

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
  const canvas = $("#plotCanvas");
  const ctx = canvas.getContext("2d");
  const expr = $("#functionInput").value;
  let fn;
  try {
    fn = createMathFunction(expr, ["x"]);
    fn(1);
  } catch {
    return;
  }
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#d8dee6";
  for (let i = 0; i <= 10; i += 1) {
    const x = (i / 10) * w;
    const y = (i / 10) * h;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.strokeStyle = "#1f2937";
  ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
  ctx.strokeStyle = "#0f766e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  let started = false;
  for (let px = 0; px < w; px += 1) {
    const x = (px / w) * 16 - 8;
    const yv = Number(fn(x));
    const py = h / 2 - yv * 34;
    if (Number.isFinite(yv) && py > -h && py < h * 2) {
      started ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      started = true;
    } else {
      started = false;
    }
  }
  ctx.stroke();
  ctx.lineWidth = 1;
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
  const edgeMarkup = graphEdges.map(([a, b]) => {
    const [, x1, y1] = graphNodes[a];
    const [, x2, y2] = graphNodes[b];
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  }).join("");
  const nodeMarkup = graphNodes.map(([label, x, y]) => `
    <g class="node" tabindex="0" transform="translate(${x} ${y})">
      <circle r="${label.length > 8 ? 48 : 40}"></circle>
      <text text-anchor="middle" dominant-baseline="middle">${label}</text>
    </g>
  `).join("");
  svg.innerHTML = `<g class="edges">${edgeMarkup}</g><g>${nodeMarkup}</g>`;
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
renderLabTools();
registerPwa();

$("#mandelbrotButton").addEventListener("click", drawMandelbrot);
$("#surfaceSlider").addEventListener("input", (event) => drawSurface(Number(event.target.value)));
$("#curveMode").addEventListener("change", (event) => drawCurveVisualization(event.target.value));
$("#matrixSlider").addEventListener("input", (event) => drawVectorVisualization(Number(event.target.value)));
$("#networkMode").addEventListener("change", (event) => drawNetworkVisualization(event.target.value));
$("#plotButton").addEventListener("click", drawPlot);
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
  store.set("mathemator:progress", { exercises: 0, quiz: 0, minutes: 0 });
  store.set("mathemator:favorites", []);
  renderProgress();
  renderSearch();
  renderFavorites();
});
$("#detailCloseButton").addEventListener("click", () => {
  $("#detailPanel").hidden = true;
});
document.querySelectorAll("[data-nav]").forEach((button) => {
  button.addEventListener("click", () => setScreen(button.dataset.nav));
});
addEventListener("hashchange", () => {
  setScreen(location.hash.replace("#", "") || "home", { silent: true });
});
