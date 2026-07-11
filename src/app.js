const dailyItems = [
  {
    label: "Mathématicienne du jour",
    title: "Emmy Noether",
    text: "Ses théorèmes relient symétries et lois de conservation, avec un impact durable en algèbre abstraite et en physique théorique.",
  },
  {
    label: "Formule du jour",
    title: "Identité d'Euler",
    text: "e^(iπ) + 1 = 0 relie analyse, géométrie, algèbre et trigonométrie en une seule égalité.",
  },
  {
    label: "Théorème du jour",
    title: "Noether, isomorphismes",
    text: "Les relations entre quotients, sous-structures et morphismes donnent une grammaire centrale aux structures algébriques.",
  },
  {
    label: "Anecdote historique",
    title: "Le pont de Königsberg",
    text: "Euler transforme une promenade impossible en naissance de la théorie des graphes.",
  },
  {
    label: "Anniversaires",
    title: "Repères du 11 juillet",
    text: "La page d'accueil peut être branchée sur une base calendairisée pour afficher naissances, publications et prix.",
  },
  {
    label: "Découverte aléatoire",
    title: "Bouteille de Klein",
    text: "Surface non orientable sans bord, impossible à plonger dans l'espace 3D sans auto-intersection.",
  },
];

const entries = [
  {
    type: "Mathématicien",
    title: "Leonhard Euler",
    meta: "XVIIIe siècle · Analyse · Graphes · Suisse",
    text: "Fonctions, séries, théorie des graphes, mécanique analytique et notation moderne.",
    tags: ["analyse", "graphes", "formules"],
  },
  {
    type: "Mathématicienne",
    title: "Emmy Noether",
    meta: "XXe siècle · Algèbre · Allemagne",
    text: "Anneaux, idéaux, invariants et symétries. Figure centrale de l'algèbre moderne.",
    tags: ["algèbre", "physique", "théorèmes"],
  },
  {
    type: "Théorème",
    title: "Théorème spectral",
    meta: "Algèbre linéaire · Analyse fonctionnelle",
    text: "Décomposition des opérateurs auto-adjoints et lecture géométrique des transformations.",
    tags: ["matrices", "opérateurs", "analyse"],
  },
  {
    type: "Objet",
    title: "Ensemble de Mandelbrot",
    meta: "Fractales · Dynamique complexe",
    text: "Carte globale de la stabilité de z -> z² + c, riche en autosimilarités.",
    tags: ["fractales", "visualisation", "complexe"],
  },
  {
    type: "Domaine",
    title: "Théorie des catégories",
    meta: "Structures · Foncteurs · Transformations naturelles",
    text: "Langage transversal pour comparer les constructions et les passages de structure.",
    tags: ["logique", "algèbre", "fondations"],
  },
  {
    type: "Problème célèbre",
    title: "Hypothèse de Riemann",
    meta: "Nombres premiers · Analyse complexe",
    text: "La distribution fine des nombres premiers passe par les zéros de la fonction zêta.",
    tags: ["nombres", "millénaire", "complexe"],
  },
];

const timelineItems = [
  ["Antiquité", "Euclide formalise les Éléments, Archimède développe aire, volume et méthodes d'approximation."],
  ["Moyen Âge", "Al-Khwârizmî structure l'algèbre, les savants arabes et indiens enrichissent calcul et astronomie."],
  ["Renaissance", "Cardano, Viète et Descartes déplacent l'algèbre vers une écriture symbolique moderne."],
  ["XVIIe siècle", "Newton, Leibniz, Fermat et Pascal accélèrent analyse, probabilités et géométrie."],
  ["XVIIIe siècle", "Euler, Lagrange et Laplace donnent une puissance systématique à l'analyse."],
  ["XIXe siècle", "Gauss, Galois, Riemann et Cantor redéfinissent structures, nombres et infini."],
  ["XXe siècle", "Noether, Hilbert, Grothendieck, Turing et von Neumann transforment les fondations."],
  ["XXIe siècle", "Preuves assistées, IA, topologie des données, cryptographie et nouveaux ponts interdisciplinaires."],
];

const modules = [
  "Mathématiciens", "Domaines", "Théorèmes", "Formules", "Objets", "Carte du monde",
  "Exercices", "Quiz", "Problèmes célèbres", "Citations", "Livres", "Glossaire",
  "Mode enseignant", "Mode étudiant", "Favoris", "Progression",
];

const graphNodes = [
  ["Euler", 120, 120], ["Graphes", 300, 90], ["Analyse", 340, 230], ["Noether", 560, 130],
  ["Algèbre", 720, 110], ["Riemann", 570, 340], ["Zêta", 740, 350], ["Fractales", 230, 390],
  ["Mandelbrot", 105, 330], ["Catégories", 430, 420],
];
const graphEdges = [[0, 1], [0, 2], [3, 4], [4, 9], [5, 6], [2, 5], [7, 8], [2, 7], [4, 2], [9, 3]];

const $ = (selector) => document.querySelector(selector);

function renderDaily() {
  $("#dailyGrid").innerHTML = dailyItems
    .map((item) => `
      <article class="daily-card">
        <span>${item.label}</span>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
      </article>
    `)
    .join("");
}

function renderSearch() {
  const filters = ["Tous", "Algèbre", "Analyse", "Fractales", "Graphes", "Nombres"];
  $("#filterChips").innerHTML = filters.map((filter, index) => `<button class="${index === 0 ? "active" : ""}" type="button">${filter}</button>`).join("");
  const input = $("#searchInput");
  const list = $("#resultList");
  const draw = () => {
    const query = input.value.trim().toLowerCase();
    const visible = entries.filter((entry) => `${entry.title} ${entry.meta} ${entry.text} ${entry.tags.join(" ")}`.toLowerCase().includes(query));
    list.innerHTML = visible.map((entry) => `
      <article class="result-card">
        <div>
          <span>${entry.type}</span>
          <h3>${entry.title}</h3>
          <p>${entry.meta}</p>
        </div>
        <p>${entry.text}</p>
      </article>
    `).join("");
  };
  input.addEventListener("input", draw);
  draw();
}

function renderTimeline() {
  $("#timeline").innerHTML = timelineItems.map(([period, text]) => `
    <article>
      <time>${period}</time>
      <p>${text}</p>
    </article>
  `).join("");
}

function renderModules() {
  $("#moduleGrid").innerHTML = modules.map((module, index) => `
    <article>
      <strong>${String(index + 1).padStart(2, "0")}</strong>
      <span>${module}</span>
    </article>
  `).join("");
}

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
    gradient.addColorStop(0.48, "#203a43");
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
    ctx.fillStyle = "rgba(255,255,255,.8)";
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
  const w = canvas.width;
  const h = canvas.height;
  const img = ctx.createImageData(w, h);
  const zoom = 1 + Math.random() * 0.35;
  const ox = -0.62 + (Math.random() - 0.5) * 0.18;
  const oy = (Math.random() - 0.5) * 0.12;
  for (let px = 0; px < w; px += 1) {
    for (let py = 0; py < h; py += 1) {
      let x0 = (px / w - 0.5) * 3.35 / zoom + ox;
      let y0 = (py / h - 0.5) * 2.25 / zoom + oy;
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
  const w = canvas.width;
  const h = canvas.height;
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
  for (let u = -3; u <= 3; u += 0.18) {
    ctx.beginPath();
    for (let v = -3; v <= 3; v += 0.18) {
      const z = Math.sin(u * u + v * v) * 0.7;
      const [x, y] = project(u, v, z);
      v === -3 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(15,118,110,.34)";
    ctx.stroke();
  }
  for (let v = -3; v <= 3; v += 0.18) {
    ctx.beginPath();
    for (let u = -3; u <= 3; u += 0.18) {
      const z = Math.sin(u * u + v * v) * 0.7;
      const [x, y] = project(u, v, z);
      u === -3 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(124,45,18,.22)";
    ctx.stroke();
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
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#d8dee6";
  ctx.lineWidth = 1;
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
}

function renderGraph() {
  const svg = $("#knowledgeGraph");
  const edgeMarkup = graphEdges.map(([a, b]) => {
    const [,, x1, y1] = [null, null, graphNodes[a][1], graphNodes[a][2]];
    const [,, x2, y2] = [null, null, graphNodes[b][1], graphNodes[b][2]];
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  }).join("");
  const nodeMarkup = graphNodes.map(([label, x, y], index) => `
    <g class="node" tabindex="0" style="--i:${index}" transform="translate(${x} ${y})">
      <circle r="${label.length > 8 ? 48 : 40}"></circle>
      <text text-anchor="middle" dominant-baseline="middle">${label}</text>
    </g>
  `).join("");
  svg.innerHTML = `<g class="edges">${edgeMarkup}</g><g>${nodeMarkup}</g>`;
}

function registerPwa() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js");
  }
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
renderTimeline();
renderModules();
drawHero();
drawMandelbrot();
drawSurface();
drawPlot();
renderGraph();
registerPwa();

$("#mandelbrotButton").addEventListener("click", drawMandelbrot);
$("#surfaceSlider").addEventListener("input", (event) => drawSurface(Number(event.target.value)));
$("#plotButton").addEventListener("click", drawPlot);
