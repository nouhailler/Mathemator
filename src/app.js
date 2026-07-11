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
let hintVisible = false;

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

function latex(value) {
  return `<span class="latex" data-latex="${value.replaceAll('"', "&quot;")}">${value}</span>`;
}

function renderMath() {
  if (!window.katex) return;
  document.querySelectorAll("[data-latex]").forEach((node) => {
    window.katex.render(node.dataset.latex, node, { throwOnError: false, displayMode: false });
  });
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
  let activeFilter = "Tous";
  const input = $("#searchInput");
  const chips = $("#filterChips");
  const list = $("#resultList");
  const searchable = [
    ...entries,
    ...mathematicians.map((item) => ({
      type: "Fiche mathématicien",
      title: item.name,
      meta: `${item.period} · ${item.nationality} · ${item.domains.join(", ")}`,
      text: item.biography,
      tags: [...item.domains, item.nationality, item.period],
      payload: item,
    })),
    ...theorems.map((item) => ({
      type: "Théorème",
      title: item.name,
      meta: `${item.discoverer} · ${item.applications}`,
      text: item.intuition,
      tags: [item.discoverer, item.history, ...item.variants],
      payload: item,
    })),
    ...formulas.map((item) => ({
      type: "Formule",
      title: item.name,
      meta: item.category,
      text: item.explanation,
      tags: [item.category, ...item.uses],
      payload: item,
    })),
  ];
  const draw = () => {
    const query = input.value.trim().toLowerCase();
    const filter = activeFilter.toLowerCase();
    const visible = searchable.filter((entry) => {
      const haystack = asSearchText(entry);
      return haystack.includes(query) && (activeFilter === "Tous" || haystack.includes(filter));
    });
    chips.innerHTML = filters.map((filter) => `<button class="${filter === activeFilter ? "active" : ""}" type="button">${filter}</button>`).join("");
    list.innerHTML = visible.map(({ type, title, meta, text }) => card(title, text, `${type} · ${meta}`, favoriteButton(title))).join("");
    chips.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.textContent;
        draw();
      });
    });
    bindFavorites();
  };
  input.addEventListener("input", draw);
  draw();
}

function favoriteButton(id) {
  const favorites = store.get("mathemator:favorites", []);
  const active = favorites.includes(id);
  return `<button class="mini-button favorite-button ${active ? "active" : ""}" type="button" data-favorite="${id}">${active ? "Favori" : "Ajouter aux favoris"}</button>`;
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
    });
  });
}

function renderTimeline() {
  $("#timeline").innerHTML = timelineItems.map(({ period, text, people, discoveries, publications, events }) => `
    <article>
      <time>${period}</time>
      <div>
        <p>${text}</p>
        <small>${people.join(", ")} · ${discoveries.join(", ")} · ${publications.join(", ")} · ${events.join(", ")}</small>
      </div>
    </article>
  `).join("");
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
      ${favoriteButton(person.name)}
    </article>
  `).join("");
  bindFavorites();
  renderMath();
}

function renderMap() {
  const input = $("#mapFilter");
  const list = $("#mapList");
  const stats = $("#mapStats");
  const svg = $("#worldMap");
  const draw = () => {
    const query = input.value.trim().toLowerCase();
    const visible = places.filter((place) => asSearchText(place).includes(query));
    stats.innerHTML = `<strong>${visible.length}</strong><span>lieux affichés</span><strong>${new Set(visible.map((place) => place.country)).size}</strong><span>pays</span>`;
    svg.innerHTML = `
      <path class="land" d="M80 180 C170 90 260 120 330 165 C410 215 480 120 570 150 C675 185 780 130 840 220 C760 318 620 300 530 340 C430 386 345 300 250 335 C155 370 70 292 80 180Z"/>
      <path class="land muted-land" d="M125 255 C205 220 295 240 356 285 C280 330 190 345 125 255Z"/>
      ${visible.map(({ city, country, people, note, x, y, kind }) => `
        <g class="map-pin" tabindex="0" transform="translate(${x} ${y})">
          <circle r="11"></circle>
          <text x="16" y="5">${city}</text>
          <title>${kind} · ${city}, ${country} · ${people} · ${note}</title>
        </g>
      `).join("")}
    `;
    list.innerHTML = visible.map(({ city, country, people, note, kind }) => card(`${city}, ${country}`, note, `${kind} · ${people}`)).join("");
  };
  input.addEventListener("input", draw);
  draw();
}

function renderDomains() {
  $("#domainGrid").innerHTML = domains.map(({ name, intro, history, concepts, theorems: domainTheorems, applications, people }) => `
    <article class="domain-card">
      <h3>${name}</h3>
      <p>${intro}</p>
      <dl>
        <dt>Historique</dt><dd>${history}</dd>
        <dt>Concepts</dt><dd>${concepts.join(", ")}</dd>
        <dt>Théorèmes</dt><dd>${domainTheorems.join(", ")}</dd>
        <dt>Figures</dt><dd>${people}</dd>
        <dt>Applications</dt><dd>${applications}</dd>
      </dl>
    </article>
  `).join("");
}

function renderReferences() {
  const tabs = ["Théorèmes", "Formules"];
  $("#referenceTabs").innerHTML = tabs.map((tab) => `<button class="${tab === activeReference ? "active" : ""}" type="button">${tab}</button>`).join("");
  const data = activeReference === "Théorèmes" ? theorems : formulas;
  $("#referencePanel").innerHTML = data.map((item) => {
    if (activeReference === "Théorèmes") {
      return card(
        item.name,
        `${latex(item.latex)}<br>${item.intuition}<br><strong>Démonstration :</strong> ${item.proof}<br><strong>Généralisation :</strong> ${item.generalization}<br><em>${item.applications}</em>`,
        `${item.discoverer} · ${item.history}`
      );
    }
    return card(
      item.name,
      `${latex(item.latex)}<br>${item.explanation}<br><strong>Exemples :</strong> ${item.examples.join(", ")}<br><strong>Démonstration :</strong> ${item.proof}`,
      `Formule · ${item.category}`
    );
  }).join("");
  renderMath();
  $("#referenceTabs").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeReference = button.textContent;
      renderReferences();
    });
  });
}

function renderObjects() {
  $("#objectGrid").innerHTML = objects.map(({ name, description, history, properties, applications }, index) => `
    <article class="object-card">
      <div class="object-figure object-${index % 4}" aria-hidden="true"></div>
      <h3>${name}</h3>
      <p>${description}</p>
      <p><strong>Histoire :</strong> ${history}</p>
      <p><strong>Propriétés :</strong> ${properties.join(", ")}</p>
      <span>${applications}</span>
    </article>
  `).join("");
}

function renderLearning() {
  renderExercise();
  renderQuiz();
  renderProgress();
}

function renderExercise() {
  const exercise = exercises[currentExercise % exercises.length];
  $("#exerciseBox").innerHTML = `
    <span class="badge">${exercise.domain} · ${exercise.level} · ${exercise.difficulty} · ${exercise.time}</span>
    <h3>${exercise.prompt}</h3>
    ${hintVisible ? `<p><strong>Indice :</strong> ${exercise.hint}</p><p><strong>Solution :</strong> ${exercise.solution}</p><p><strong>Démonstration :</strong> ${exercise.proof}</p>` : "<p>Utilise l'indice pour afficher la correction détaillée.</p>"}
    <button class="mini-button" id="nextExerciseButton" type="button">Exercice suivant</button>
  `;
  $("#nextExerciseButton").addEventListener("click", () => {
    currentExercise += 1;
    hintVisible = false;
    bumpProgress("exercises");
    renderExercise();
    renderProgress();
  });
}

function renderQuiz() {
  const current = quiz[currentQuiz % quiz.length];
  $("#quizBox").innerHTML = `
    <span class="badge">${current.mode}</span>
    <h3>${current.question}</h3>
    <div class="answer-grid">
      ${current.options.map((option, index) => `<button type="button" data-answer="${index}">${option}</button>`).join("")}
    </div>
    <p id="quizFeedback" class="muted">Sélectionne une réponse.</p>
  `;
  $("#quizBox").querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      const ok = Number(button.dataset.answer) === current.correct;
      $("#quizFeedback").textContent = ok ? "Réponse correcte." : `Réponse attendue : ${current.options[current.correct]}.`;
      if (ok) bumpProgress("quiz");
      renderProgress();
    });
  });
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
  $("#problemList").innerHTML = problems.map(({ name, status, text, history, current, advances, impact }) => `
    <article class="problem-card">
      <span class="${status === "Ouvert" ? "status-open" : "status-solved"}">${status}</span>
      <h3>${name}</h3>
      <p>${text}</p>
      <p><strong>Historique :</strong> ${history}</p>
      <p><strong>État actuel :</strong> ${current}</p>
      <p><strong>Avancées :</strong> ${advances}</p>
      <strong>${impact}</strong>
    </article>
  `).join("");
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

function drawPlot() {
  const canvas = $("#plotCanvas");
  const ctx = canvas.getContext("2d");
  const expr = $("#functionInput").value;
  const safe = expr.replace(/\b(sin|cos|tan|exp|log|sqrt|abs|pow|PI|E)\b/g, "Math.$1");
  let fn;
  try {
    fn = new Function("x", `"use strict"; return ${safe};`);
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
drawHero();
drawMandelbrot();
drawSurface();
drawPlot();
registerPwa();

$("#mandelbrotButton").addEventListener("click", drawMandelbrot);
$("#surfaceSlider").addEventListener("input", (event) => drawSurface(Number(event.target.value)));
$("#plotButton").addEventListener("click", drawPlot);
$("#hintButton").addEventListener("click", () => {
  hintVisible = !hintVisible;
  renderExercise();
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
});
