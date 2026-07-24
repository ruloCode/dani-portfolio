/* Portafolio de Daniela Ramírez O — render, animaciones y modal.
   Datos: data/projects.json (scrape de Behance) + overlay curado (clientes/años/destacados). */

const CATEGORIES = [
  { key: "todo", label: "Todo" },
  { key: "motion", label: "Motion & Animación" },
  { key: "video", label: "Video" },
  { key: "branding", label: "Branding & Logos" },
  { key: "social", label: "Social Media" },
  { key: "web", label: "Web & UI" },
  { key: "ilustracion", label: "Ilustración" },
];

// Overlay curado: cliente y año por id de proyecto de Behance
const META = {
  "83224139": { client: "RCN Televisión", year: 2019 },
  "82991077": { client: "RCN Televisión", year: 2019 },
  "83293863": { client: "RCN Televisión", year: 2019 },
  "83238151": { client: "RCN Televisión", year: 2019 },
  "84808639": { client: "Juan Valdez", year: 2019 },
  "85726427": { client: "Peiky", year: 2019 },
  "83377419": { client: "BuenaPeople", year: 2019 },
  "97797783": { client: "BuenaPeople", year: 2020 },
  "121079243": { client: "Bric", year: 2021 },
  "121092891": { client: "Bric", year: 2021 },
  "121088785": { client: "I Believe", year: 2021 },
  "121097105": { client: "One Page", year: 2021 },
  "121093139": { client: "App / Play Store", year: 2021 },
  "121094315": { client: "Social", year: 2021 },
  "123509573": { client: "Social", year: 2021 },
  "128364247": { client: "Producción", year: 2021 },
  "146697739": { client: "Publicidad", year: 2022 },
  "161324121": { client: "Publicidad", year: 2022 },
  "171523611": { client: "Happy Huevos", year: 2023 },
  "172101019": { client: "Juan Pablo Barber", year: 2023 },
  "172102249": { client: "Campaña", year: 2023 },
  "172103879": { client: "RG Abogadas", year: 2023 },
  "172104509": { client: "Class Limitless", year: 2023 },
  "172177563": { client: "Inmobiliaria", year: 2023 },
  "196347529": { client: "Contenido", year: 2024 },
  "196347905": { client: "Contenido", year: 2024 },
  "196349955": { client: "Contenido", year: 2024 },
  "196350285": { client: "Contenido", year: 2024 },
  "212246521": { client: "Reel", year: 2024 },
  "212247141": { client: "Reel", year: 2024 },
  "212248419": { client: "WordPress", year: 2024 },
  "212250711": { client: "Key Visual", year: 2024 },
  "225523757": { client: "Identidad", year: 2025 },
  "231905159": { client: "ABI", year: 2025 },
  "82689601": { client: "Concepto", year: 2019 },
  "82924707": { client: "Ilustración", year: 2019 },
  "83375803": { client: "UI", year: 2019 },
  "83620107": { client: "Flyers", year: 2019 },
  "95724549": { client: "CV", year: 2020 },
  "97278719": { client: "Ilustración", year: 2020 },
  "71091987": { client: "Isotipo", year: 2018 },
};

// Casos destacados (orden de aparición) con blurb propio
const FEATURED = [
  { id: "83224139", blurb: "Promo animada emitida en televisión nacional — motion graphics para el aire de RCN." },
  { id: "121088785", blurb: "Manual de marca completo: sistema visual, usos y aplicaciones de principio a fin." },
  { id: "84808639", blurb: "Infografía para la marca de café más reconocida de Colombia." },
  { id: "172102249", blurb: "Campaña integral: concepto, piezas y despliegue en todos los formatos." },
  { id: "85726427", blurb: "Publicidad para app — piezas que convierten descargas." },
  { id: "121094315", blurb: "Parrilla social con sistema: 20+ piezas con una sola voz visual." },
];

function categorize(p) {
  const t = `${p.title} ${(p.fields || []).join(" ")}`.toLowerCase();
  if (/(logo|brand|isotype|media.?kit|manual|identity)/.test(t)) return "branding";
  if (/(animation|motion|animated)/.test(t)) return "motion";
  if (/(video|promo|trendiando|recording|reel)/.test(t)) return "video";
  if (/(social|campaign|advertising|flyer|infographic|peiky)/.test(t)) return "social";
  if (/(website|landing|wordpress|ui|page|play store|key visual|cv)/.test(t)) return "web";
  if (/(ilustra|illustration|vector)/.test(t)) return "ilustracion";
  return "social";
}

const INDEX_PAGE = 10; // filas visibles por tanda en el archivo
const state = { projects: [], filter: "todo", visible: INDEX_PAGE };
let lenis = null; // instancia de smooth scroll; se pausa con el modal abierto
const $ = (sel) => document.querySelector(sel);

async function init() {
  // Lo que no depende de datos corre SIEMPRE, aunque el fetch falle
  $("#year").textContent = new Date().getFullYear();
  bindModal();
  bindCursor();
  startClock();

  try {
    const res = await fetch("data/projects.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    state.projects = data.projects
      .map((p) => ({
        ...p,
        category: categorize(p),
        client: META[p.id]?.client || "",
        year: META[p.id]?.year || "",
      }))
      .filter((p) => p.images.length || p.videos.length || p.embeds.length)
      .sort((a, b) => (b.year || 0) - (a.year || 0));

    $("#footer-count").textContent = `${state.projects.length} proyectos · Behance`;
    renderSocial(data.profile);
    renderFeatured();
    renderFilters();
    renderIndex();
    bindIndexPreview();
  } catch (err) {
    console.error("No se pudo cargar data/projects.json:", err);
  }

  // el tilt incluye cards renderizadas arriba; motion revela el hero pase lo que pase
  bindTilt();
  startMotion();
}

function renderSocial(profile) {
  const wrap = $("#social-links");
  const own = (profile?.social || []).filter(
    (u) => !u.includes("instagram.com/behance") && !u.includes("linkedin.com/company")
  );
  const links = [["https://www.behance.net/dannyromo615c", "Behance ↗"]];
  for (const u of own) {
    links.push([u, u.includes("linkedin") ? "LinkedIn ↗" : "Instagram ↗"]);
  }
  wrap.innerHTML = "";
  for (const [href, label] of links) {
    const a = document.createElement("a");
    a.href = href; a.target = "_blank"; a.rel = "noopener";
    a.textContent = label; a.dataset.hover = "";
    wrap.appendChild(a);
  }
}

/* ---------- Trabajo seleccionado ---------- */
function renderFeatured() {
  const wrap = $("#featured");
  for (const f of FEATURED) {
    const p = state.projects.find((x) => x.id === f.id);
    if (!p || !p.images.length) continue;

    const el = document.createElement("article");
    el.className = "case";
    el.dataset.hover = "";
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `Ver proyecto: ${p.title}`);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(p); }
    });

    const media = document.createElement("div");
    media.className = "case-media";
    media.dataset.tilt = "";
    const img = document.createElement("img");
    img.src = p.images[0];
    img.alt = p.title;
    img.loading = "lazy";
    media.appendChild(img);
    if (p.embeds.length || p.videos.length) {
      const tag = document.createElement("span");
      tag.className = "case-media-tag";
      tag.textContent = "▶ motion";
      media.appendChild(tag);
    }

    const info = document.createElement("div");
    info.className = "case-info";
    info.innerHTML = `
      <p class="case-client mono">${p.client}${p.year ? ` — ${p.year}` : ""}</p>
      <h3 class="case-title">${p.title}</h3>
      <p class="case-desc">${f.blurb}</p>
      <span class="case-cta">Ver proyecto →</span>`;

    el.append(media, info);
    el.addEventListener("click", () => openModal(p));
    wrap.appendChild(el);
  }
}

/* ---------- Archivo (índice) ---------- */
function renderFilters() {
  const wrap = $("#filters");
  const present = new Set(state.projects.map((p) => p.category));
  for (const cat of CATEGORIES) {
    if (cat.key !== "todo" && !present.has(cat.key)) continue;
    const btn = document.createElement("button");
    btn.textContent = cat.label;
    btn.dataset.hover = "";
    btn.className = cat.key === state.filter ? "active" : "";
    btn.setAttribute("aria-pressed", String(cat.key === state.filter));
    btn.addEventListener("click", () => {
      state.filter = cat.key;
      state.visible = INDEX_PAGE; // cambiar de filtro reinicia la paginación
      wrap.querySelectorAll("button").forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      renderIndex();
    });
    wrap.appendChild(btn);
  }
}

function renderIndex() {
  const wrap = $("#index");
  wrap.innerHTML = "";
  const preview = $("#index-preview");
  const previewImg = preview.querySelector("img");
  const all = state.projects.filter(
    (p) => state.filter === "todo" || p.category === state.filter
  );
  const list = all.slice(0, state.visible);

  list.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "index-row";
    row.setAttribute("role", "button");
    row.setAttribute("aria-label", `Ver proyecto: ${p.title}`);
    row.tabIndex = 0;
    row.dataset.hover = "";
    row.innerHTML = `
      <span class="index-num">${String(i + 1).padStart(2, "0")}</span>
      <span class="index-title">${p.title}</span>
      <span class="index-client">${p.client}${p.year ? ` · ${p.year}` : ""}</span>
      <span class="index-cat">${CATEGORIES.find((c) => c.key === p.category)?.label || ""}</span>`;

    row.addEventListener("mouseenter", () => {
      if (!p.images.length) return;
      previewImg.src = p.images[0];
      preview.classList.add("on");
    });
    row.addEventListener("mouseleave", () => preview.classList.remove("on"));
    row.addEventListener("click", () => openModal(p));
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(p); }
    });
    wrap.appendChild(row);
  });

  // "Mostrar más" si quedan proyectos por listar
  const remaining = all.length - list.length;
  if (remaining > 0) {
    const moreWrap = document.createElement("div");
    moreWrap.className = "index-more";
    const more = document.createElement("button");
    more.className = "index-more-btn";
    more.dataset.hover = "";
    more.textContent = `Mostrar más ✦ ${remaining} restantes`;
    more.addEventListener("click", () => {
      state.visible += INDEX_PAGE;
      renderIndex();
    });
    moreWrap.appendChild(more);
    wrap.appendChild(moreWrap);
  }

  if (window.ScrollTrigger) ScrollTrigger.refresh();
}

// el preview sigue al cursor (bind único, fuera de renderIndex)
function bindIndexPreview() {
  const preview = $("#index-preview");
  document.addEventListener("mousemove", (e) => {
    if (!preview.classList.contains("on")) return;
    const x = Math.min(e.clientX + 26, window.innerWidth - 320);
    const y = Math.min(e.clientY - 100, window.innerHeight - 240);
    preview.style.left = `${x}px`;
    preview.style.top = `${Math.max(80, y)}px`;
  });
}

/* ---------- Modal ---------- */
function embedSrc(url) {
  const yt = url.match(/(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

function openModal(p) {
  const body = $("#modal-body");
  body.innerHTML = "";

  const cat = document.createElement("p");
  cat.className = "modal-cat mono";
  cat.textContent = [
    CATEGORIES.find((c) => c.key === p.category)?.label,
    p.client, p.year,
  ].filter(Boolean).join(" · ");

  const title = document.createElement("h2");
  title.className = "modal-title";
  title.id = "modal-title";
  title.textContent = p.title;
  body.append(cat, title);
  $("#modal").setAttribute("aria-labelledby", "modal-title");

  if (p.description) {
    const desc = document.createElement("p");
    desc.className = "modal-desc";
    desc.textContent = p.description;
    body.appendChild(desc);
  }

  if (p.tags.length) {
    const tags = document.createElement("div");
    tags.className = "modal-tags";
    for (const t of p.tags.slice(0, 10)) {
      const s = document.createElement("span");
      s.textContent = t;
      tags.appendChild(s);
    }
    body.appendChild(tags);
  }

  const media = document.createElement("div");
  media.className = "modal-media";

  for (const src of p.videos) {
    const v = document.createElement("video");
    v.src = src; v.controls = true; v.playsInline = true; v.preload = "metadata";
    media.appendChild(v);
  }
  for (const url of p.embeds) {
    const wrap = document.createElement("div");
    wrap.className = "embed";
    const f = document.createElement("iframe");
    f.src = embedSrc(url);
    f.allow = "autoplay; fullscreen; picture-in-picture";
    f.allowFullscreen = true;
    f.loading = "lazy";
    wrap.appendChild(f);
    media.appendChild(wrap);
  }
  for (const src of p.images) {
    const img = document.createElement("img");
    img.src = src; img.alt = p.title; img.loading = "lazy";
    media.appendChild(img);
  }
  body.appendChild(media);

  const link = document.createElement("a");
  link.className = "modal-behance";
  link.href = p.url; link.target = "_blank"; link.rel = "noopener";
  link.textContent = "Ver en Behance ↗";
  body.appendChild(link);

  const modal = $("#modal");
  modal.hidden = false;
  document.body.classList.add("modal-open");
  modal.querySelector(".modal-panel").scrollTop = 0;
  if (lenis) lenis.stop();

  // gestión de foco: guardar el disparador, enfocar el cierre, atrapar Tab
  lastFocus = document.activeElement;
  modal.querySelector(".modal-close").focus();
}

let lastFocus = null;

function bindModal() {
  const modal = $("#modal");
  modal.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") { closeModal(); return; }
    // trap de Tab dentro del panel
    if (e.key === "Tab") {
      const focusables = modal.querySelectorAll(
        "button, a[href], video, iframe, [tabindex]:not([tabindex='-1'])"
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      } else if (!modal.contains(document.activeElement)) {
        e.preventDefault(); first.focus();
      }
    }
  });
}

function closeModal() {
  $("#modal").hidden = true;
  document.body.classList.remove("modal-open");
  $("#modal-body").innerHTML = "";
  if (lenis) lenis.start();
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  lastFocus = null;
}

/* ---------- Cursor custom ---------- */
function bindCursor() {
  const ring = $("#cursor");
  const dot = $("#cursor-dot");
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  let rx = 0, ry = 0, tx = 0, ty = 0;
  document.addEventListener("mousemove", (e) => {
    tx = e.clientX; ty = e.clientY;
    dot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
    ring.classList.toggle("is-hover", !!e.target.closest("[data-hover], a, button, .case, .index-row"));
  });
  (function follow() {
    rx += (tx - rx) * 0.16;
    ry += (ty - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(follow);
  })();
}

/* ---------- Tilt 3D en cards ---------- */
function bindTilt() {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.querySelectorAll("[data-tilt]").forEach((el) => {
    let raf = null;
    el.addEventListener("mousemove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg)`;
        raf = null;
      });
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
    });
  });
}

/* ---------- Reloj Bogotá ---------- */
function startClock() {
  const el = $("#local-time");
  const fmt = new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota", hour12: false,
  });
  const tick = () => { el.textContent = `${fmt.format(new Date())} COT`; };
  tick();
  setInterval(tick, 30_000);
}

/* ---------- Título del hero: split por caracteres ---------- */
function splitHeroTitle() {
  const chars = [];
  document.querySelectorAll(".hero-title .line").forEach((line) => {
    const text = line.textContent;
    line.setAttribute("aria-hidden", "true");
    line.textContent = "";
    for (const ch of text) {
      const s = document.createElement("span");
      s.className = "char";
      s.textContent = ch;
      line.appendChild(s);
      chars.push(s);
    }
  });
  return chars;
}

/* ---------- Ciclo del hero: nombre ↔ servicios con efecto typewriter ---------- */
const SERVICE_WORDS = [
  "MOTION GRAPHICS", "BRANDING", "VIDEO", "SOCIAL MEDIA", "DISEÑO", "ILUSTRACIÓN",
];
const HOME_WORD = "RAMÍREZ";

function startTitleCycle(line) {
  if (!line) return;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const caret = document.createElement("span");
  caret.className = "type-caret";
  line.classList.add("cycling");

  // altura fija para que el hero no salte cuando la fuente encoge
  line.style.minHeight = `${line.getBoundingClientRect().height}px`;

  function fit() {
    line.style.fontSize = "";
    const max = line.parentElement.clientWidth;
    let size = parseFloat(getComputedStyle(line).fontSize);
    let guard = 40;
    while (line.scrollWidth > max && size > 18 && guard--) {
      size *= 0.93;
      line.style.fontSize = `${size}px`;
    }
  }

  function render(txt) {
    line.textContent = txt;
    line.appendChild(caret);
    fit();
  }

  async function typeWord(word, current) {
    for (let i = current.length; i >= 0; i--) {
      render(current.slice(0, i));
      await sleep(26);
    }
    await sleep(200);
    for (let i = 1; i <= word.length; i++) {
      render(word.slice(0, i));
      await sleep(58);
    }
  }

  (async () => {
    let current = HOME_WORD;
    // el ciclo corre mientras el hero esté a la vista (se pausa fuera)
    while (true) {
      for (const w of SERVICE_WORDS) {
        await typeWord(w, current);
        current = w;
        await sleep(1500);
      }
      await typeWord(HOME_WORD, current);
      current = HOME_WORD;
      await sleep(5000);
    }
  })();
}

/* ---------- Animaciones (GSAP + Lenis) ---------- */
function startMotion() {
  const title = $(".hero-title");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Camino estático: sin GSAP, sin ScrollTrigger o con reduced-motion —
  // todo visible, contadores con su valor final y cero animaciones.
  if (!window.gsap || !window.ScrollTrigger || reduced) {
    document.documentElement.classList.add("gsap-done");
    title.classList.add("ready");
    document.querySelectorAll(".stat-num").forEach((el) => {
      el.textContent = el.dataset.count;
    });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // Reveal AAA del nombre: máscara por línea + stagger por caracter
  {
    const chars = splitHeroTitle();
    gsap.set(chars, { yPercent: 118, rotate: 9, transformOrigin: "0% 100%" });
    title.classList.add("ready");
    gsap.to(chars, {
      yPercent: 0, rotate: 0,
      duration: 1.2, ease: "expo.out",
      stagger: { each: 0.045 }, delay: 0.25,
    });
    // micro-interacción: onda al pasar el mouse (chars vivos en ese momento)
    let waving = false;
    title.addEventListener("mouseenter", () => {
      if (waving) return;
      waving = true;
      gsap.to(title.querySelectorAll(".char"), {
        yPercent: -7, duration: 0.24, ease: "power2.out",
        stagger: { each: 0.018 }, yoyo: true, repeat: 1,
        onComplete: () => { waving = false; },
      });
    });
    // tras el reveal, la línea violeta cicla nombre ↔ servicios (typewriter)
    setTimeout(() => startTitleCycle(title.querySelector(".line.accent")), 4200);
  }

  // Smooth scroll
  if (window.Lenis && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    lenis = new Lenis({ lerp: 0.11 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const target = document.querySelector(a.getAttribute("href"));
        if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -60 }); }
      });
    });
  }

  // Hero: entrada escalonada
  gsap.to(".reveal-hero", {
    opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.14, delay: 0.15,
  });

  // Statement: líneas + contadores
  gsap.from(".statement-text", {
    scrollTrigger: { trigger: ".statement", start: "top 75%" },
    opacity: 0, y: 40, duration: 0.9, ease: "power3.out",
  });
  document.querySelectorAll(".stat-num").forEach((el) => {
    const end = Number(el.dataset.count);
    gsap.fromTo(el, { innerText: 0 }, {
      innerText: end, duration: 1.6, ease: "power2.out", snap: { innerText: 1 },
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  });

  // Casos: entrada + parallax de la imagen
  document.querySelectorAll(".case").forEach((el) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: "top 82%" },
      opacity: 0, y: 60, duration: 0.9, ease: "power3.out",
    });
    const img = el.querySelector(".case-media img");
    gsap.fromTo(img, { yPercent: -6 }, {
      yPercent: 6, ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
    });
  });

  // Índice y expertise: stagger
  gsap.from(".index-row", {
    scrollTrigger: { trigger: ".index", start: "top 85%" },
    opacity: 0, x: -30, duration: 0.5, ease: "power2.out", stagger: 0.04,
  });
  gsap.from(".exp-card", {
    scrollTrigger: { trigger: ".expertise-grid", start: "top 82%" },
    opacity: 0, y: 40, duration: 0.7, ease: "power3.out", stagger: 0.1,
  });
  gsap.from(".about-card", {
    scrollTrigger: { trigger: ".about", start: "top 80%" },
    opacity: 0, y: 50, duration: 0.9, ease: "power3.out",
  });
  gsap.from(".contact-title", {
    scrollTrigger: { trigger: ".contact", start: "top 78%" },
    opacity: 0, scale: 0.92, duration: 0.9, ease: "power3.out",
  });
}

init();
