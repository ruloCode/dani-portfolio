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
  animateCounters();
  startDecoPhysics();
  startGeoShow();
  startAiReel();
  startMotion();

  // fallback del disparo de la caída sin GSAP/ScrollTrigger (CDN caído)
  if (!window.gsap || !window.ScrollTrigger) {
    const about = document.getElementById("sobre-mi");
    if (about) {
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { startGeoFall(); io.disconnect(); }
      }, { threshold: 0.1 });
      io.observe(about);
    }
  }
}

/* Show de color en la sección de geometría: cada ~4s muta la paleta (crossfade
   CSS) y, alternadamente, recompone las figuras rotando una fila de piezas
   entre ellas (FLIP). Expertise en color, en vivo. Pausa fuera de viewport. */
const PALETTES = [
  { name: "Marca", colors: ["#7c3aed", "#a78bfa", "#f5d90a", "#191430"] },
  { name: "Kinder", colors: ["#2fa98c", "#e5a9d4", "#d9a942", "#a65c54"] },
  { name: "Retro pop", colors: ["#ef476f", "#ffd166", "#06d6a0", "#073b4c"] },
  { name: "Bauhaus", colors: ["#d90429", "#ffc300", "#3a86ff", "#001219"] },
  { name: "Vaporwave", colors: ["#ff71ce", "#01cdfe", "#fffb96", "#2d1b69"] },
];

function startGeoShow() {
  const geo = document.querySelector(".geo");
  if (!geo) return;

  let idx = 0;
  let cycle = 0;
  let inView = false;
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: 0.2 })
    .observe(geo);

  function applyPalette(p) {
    p.colors.forEach((c, i) => geo.style.setProperty(`--p${i + 1}`, c));
  }
  applyPalette(PALETTES[0]);

  function figures() {
    return [...geo.querySelectorAll(".geo-fig")].filter((f) => f.offsetParent !== null);
  }

  // rota la fila `pick` (0 = cabezas, -1 = piernas): las piezas VIAJAN con giro
  // y aterrizan con rebote elástico (squash & stretch) — física de caricatura
  function recompose() {
    if (!window.gsap || !window.Flip) return;
    const figs = figures();
    if (figs.length < 2) return;
    const pick = cycle % 4 === 1 ? 0 : -1;
    const parts = figs.map((f) => {
      const g = f.querySelectorAll(":scope > .g");
      return pick === 0 ? g[0] : g[g.length - 1];
    });
    if (parts.some((p) => !p)) return;

    geo.classList.add("geo-morphing");
    const state = Flip.getState(parts);
    parts.forEach((part, i) => {
      const dest = figs[(i + 1) % figs.length];
      if (pick === 0) dest.insertBefore(part, dest.firstElementChild);
      else dest.appendChild(part);
    });
    Flip.from(state, {
      duration: 1.15, ease: "power3.inOut", absolute: true, spin: 1, stagger: 0.06,
      onComplete: () => {
        gsap.fromTo(parts,
          { scaleY: 0.78, scaleX: 1.18, transformOrigin: "50% 100%" },
          {
            scaleY: 1, scaleX: 1, duration: 0.65, ease: "elastic.out(1, 0.42)",
            stagger: 0.04,
            onComplete: () => {
              gsap.set(parts, { clearProps: "transform" });
              geo.classList.remove("geo-morphing");
            },
          });
      },
    });
  }

  setInterval(() => {
    if (!inView || document.hidden) return;
    cycle++;
    idx = (idx + 1) % PALETTES.length;
    applyPalette(PALETTES[idx]);
    if (cycle % 2 === 1 && !geoFallen) recompose();
  }, 4000);
}

/* FINAL DE FÍSICA: al llegar el scroll a "Sobre mí", las piezas se sueltan y
   CAEN con gravedad (Matter.js) — rebotan, se apilan en el piso de la sección,
   se arrastran con el mouse y reciben impulso del scroll. La paleta sigue
   mutando sobre la pila. */
let geoFallen = false;

function startGeoFall() {
  if (geoFallen || !window.Matter) return;
  const geo = document.querySelector(".geo");
  const track = geo?.querySelector(".geo-track");
  if (!track) return;
  // si hay un morph FLIP en vuelo, esperar a que aterrice
  if (geo.classList.contains("geo-morphing")) {
    setTimeout(startGeoFall, 1500);
    return;
  }
  geoFallen = true;
  geo.classList.add("geo-falling");
  if (window.gsap) gsap.killTweensOf(".geo-fig");

  const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint } = Matter;
  const tRect = track.getBoundingClientRect();
  const parts = [...track.querySelectorAll(".g")].filter((el) => el.offsetParent !== null);
  const items = parts.map((el) => {
    const r = el.getBoundingClientRect();
    return { el, x: r.left - tRect.left, y: r.top - tRect.top, w: r.width, h: r.height };
  });

  // reparentar las piezas al track como absolutas (misma posición visual)
  for (const it of items) {
    track.appendChild(it.el);
    Object.assign(it.el.style, {
      position: "absolute", left: "0px", top: "0px", margin: "0",
      width: `${it.w}px`, height: `${it.h}px`,
      transformOrigin: "50% 50%",
      transform: `translate(${it.x}px, ${it.y}px)`,
    });
  }
  track.querySelectorAll(".geo-fig").forEach((f) => { f.style.display = "none"; });

  // El PISO es la línea superior de la card de "Sobre mí", a todo lo ancho:
  // las piezas caen, rebotan sobre ese borde y JAMÁS lo cruzan
  const aboutCard = document.querySelector(".about-card");
  const cRect = aboutCard.getBoundingClientRect();
  // la card puede estar a mitad de su entrada GSAP (y: 50→0): medir su
  // posición FINAL descontando el translate vigente
  const cardTy = window.gsap ? Number(gsap.getProperty(aboutCard, "y")) || 0 : 0;
  const W = track.clientWidth;
  // -10: colchón para los desbordes visuales (barras de la X, bracitos)
  const floorY = cRect.top - cardTy - tRect.top - 10;

  const engine = Engine.create();
  engine.gravity.y = 1.35;
  const wallOpts = { isStatic: true, restitution: 0.35 };
  const statics = [
    Bodies.rectangle(W / 2, floorY + 60, W + 400, 120, wallOpts),      // piso: borde de la card
    Bodies.rectangle(W / 2, -130, W + 400, 120, wallOpts),             // techo (para la flotación)
    Bodies.rectangle(-58, floorY / 2, 120, floorY + 600, wallOpts),    // izquierda
    Bodies.rectangle(W + 58, floorY / 2, 120, floorY + 600, wallOpts), // derecha
  ];
  const bodies = items.map((it) => {
    const cx = it.x + it.w / 2;
    const cy = it.y + it.h / 2;
    const opts = { restitution: 0.45, friction: 0.55, frictionAir: 0.012 };
    const round = /g-circle|g-donut/.test(it.el.className);
    const b = round
      ? Bodies.circle(cx, cy, Math.max(it.w, it.h) / 2, opts)
      : Bodies.rectangle(cx, cy, it.w, it.h, opts);
    Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.14);
    Body.setVelocity(b, { x: (Math.random() - 0.5) * 3, y: -(1 + Math.random() * 2) });
    it.body = b;
    it.homeX = cx; it.homeY = cy; // posición inicial (estructura)
    return b;
  });
  Composite.add(engine.world, [...statics, ...bodies]);

  /* Estados: fall (gravedad) → return (vuelven a su estructura si nadie
     interactúa) → float (gravedad cero: llenan y recorren todo el espacio). */
  let mode = "fall";
  const setMode = (m) => { mode = m; geo.dataset.phys = m; };
  geo.dataset.phys = "fall";
  let lastDrag = performance.now();
  const fallTime = performance.now();

  // drag por raycast en TODO el documento (Matter.Mouse solo oiría el track):
  // agarra solo si el punto toca una pieza — no roba clics de "Sobre mí"
  let drag = null;
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const toLocal = (e) => {
      const r = track.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    document.addEventListener("mousedown", (e) => {
      if (mode === "return") return; // en vuelo a casa no se agarra
      const pt = toLocal(e);
      const hit = Matter.Query.point(bodies, pt)[0];
      if (!hit) return;
      e.preventDefault();
      drag = { body: hit, lastPt: pt, v: { x: 0, y: 0 } };
      lastDrag = performance.now();
      document.body.style.cursor = "grabbing";
    });
    document.addEventListener("mousemove", (e) => {
      if (!drag) return;
      const pt = toLocal(e);
      drag.v = { x: pt.x - drag.lastPt.x, y: pt.y - drag.lastPt.y };
      Body.setPosition(drag.body, pt);
      Body.setVelocity(drag.body, { x: 0, y: 0 });
      drag.lastPt = pt;
      lastDrag = performance.now();
    });
    document.addEventListener("mouseup", () => {
      if (!drag) return;
      Body.setVelocity(drag.body, { x: drag.v.x * 1.4, y: drag.v.y * 1.4 }); // lanzamiento
      drag = null;
      lastDrag = performance.now();
      document.body.style.cursor = "";
    });
    track.classList.add("is-physics");
  }

  // el scroll patea las piezas — reaccionan al ritmo del usuario
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    const dy = window.scrollY - lastY;
    lastY = window.scrollY;
    const kick = Math.max(-9, Math.min(9, dy)) * (mode === "float" ? 0.008 : 0.02);
    for (const b of bodies) {
      Body.setVelocity(b, { x: b.velocity.x, y: b.velocity.y - kick });
    }
  }, { passive: true });

  function beginFloat() {
    setMode("float");
    engine.gravity.y = 0;
    for (const b of bodies) {
      b.restitution = 0.95;
      b.frictionAir = 0.0035;
      const a = Math.random() * Math.PI * 2;
      const s = 1.6 + Math.random() * 1.8;
      Body.setVelocity(b, { x: Math.cos(a) * s, y: Math.sin(a) * s });
      Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.06);
    }
  }

  let inView = true;
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { rootMargin: "160px" })
    .observe(geo);

  let last = performance.now();
  let holdUntil = 0;
  (function step(now) {
    requestAnimationFrame(step);
    if (document.hidden || !inView) { last = now; return; }
    const dt = Math.min(now - last, 33);
    last = now;

    if (mode === "fall") {
      // sin interacción por 7s (y tras asentarse) → regreso a la estructura
      if (now - fallTime > 5000 && now - lastDrag > 7000) setMode("return");
      Matter.Engine.update(engine, dt);
    } else if (mode === "return") {
      // lerp suave de cada pieza a su casa; el motor descansa
      let done = true;
      for (const it of items) {
        const b = it.body;
        const nx = b.position.x + (it.homeX - b.position.x) * 0.09;
        const ny = b.position.y + (it.homeY - b.position.y) * 0.09;
        const na = b.angle * 0.91;
        Body.setPosition(b, { x: nx, y: ny });
        Body.setAngle(b, na);
        Body.setVelocity(b, { x: 0, y: 0 });
        Body.setAngularVelocity(b, 0);
        if (Math.abs(nx - it.homeX) > 1.5 || Math.abs(ny - it.homeY) > 1.5 || Math.abs(na) > 0.02) done = false;
      }
      if (done && !holdUntil) holdUntil = now + 1100; // pausa en la estructura
      if (holdUntil && now > holdUntil) beginFloat();
    } else {
      // float: deriva perpetua; un empujoncito si alguna se queda quieta
      for (const b of bodies) {
        const sp = Math.hypot(b.velocity.x, b.velocity.y);
        if (sp < 0.35) {
          const a = Math.random() * Math.PI * 2;
          Body.setVelocity(b, { x: b.velocity.x + Math.cos(a) * 0.5, y: b.velocity.y + Math.sin(a) * 0.5 });
        }
      }
      Matter.Engine.update(engine, dt);
    }

    for (const it of items) {
      const b = it.body;
      it.el.style.transform =
        `translate(${(b.position.x - it.w / 2).toFixed(1)}px, ${(b.position.y - it.h / 2).toFixed(1)}px) rotate(${b.angle.toFixed(3)}rad)`;
    }
  })(performance.now());
}

/* Física de la textura de fondo: cada shape deriva y REBOTA en los bordes de
   su sección, con rotación lenta. Profundidad: los lejanos (impares, borrosos)
   van a media velocidad. Pausa fuera de viewport y con el tab oculto. */
function startDecoPhysics() {
  const items = [];
  const visible = new Map();
  const io = new IntersectionObserver((es) => {
    for (const e of es) visible.set(e.target, e.isIntersecting);
  }, { rootMargin: "80px" });

  document.querySelectorAll(".deco").forEach((deco) => {
    io.observe(deco);
    [...deco.children].forEach((el, i) => {
      const far = i % 2 === 0; // nth-child(odd) en CSS = índice par aquí
      items.push({
        el, deco,
        x: 0, y: 0, r: Math.random() * 8 - 4,
        vx: (18 + Math.random() * 16) * (Math.random() < 0.5 ? -1 : 1) * (far ? 0.5 : 1),
        vy: (12 + Math.random() * 14) * (Math.random() < 0.5 ? -1 : 1) * (far ? 0.5 : 1),
        vr: (Math.random() * 10 - 5) * (far ? 0.5 : 1),
        baseL: 0, baseT: 0, w: 0, h: 0, W: 0, H: 0,
      });
    });
  });
  if (!items.length) return;

  function measure() {
    for (const it of items) {
      // limpiar transform para medir la posición base real
      it.el.style.transform = "";
      it.baseL = it.el.offsetLeft; it.baseT = it.el.offsetTop;
      it.w = it.el.offsetWidth; it.h = it.el.offsetHeight;
      it.W = it.deco.clientWidth; it.H = it.deco.clientHeight;
      it.x = Math.min(Math.max(it.x, -it.baseL), it.W - it.baseL - it.w);
      it.y = Math.min(Math.max(it.y, -it.baseT), it.H - it.baseT - it.h);
    }
  }
  measure();
  let resizeT = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(measure, 200);
  });

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (document.hidden) return;
    for (const it of items) {
      if (!visible.get(it.deco)) continue;
      it.x += it.vx * dt;
      it.y += it.vy * dt;
      it.r += it.vr * dt;
      // rebote en los bordes de la sección
      if (it.baseL + it.x <= 0 || it.baseL + it.x + it.w >= it.W) {
        it.vx *= -1;
        it.x = Math.min(Math.max(it.x, -it.baseL), it.W - it.baseL - it.w);
      }
      if (it.baseT + it.y <= 0 || it.baseT + it.y + it.h >= it.H) {
        it.vy *= -1;
        it.y = Math.min(Math.max(it.y, -it.baseT), it.H - it.baseT - it.h);
      }
      it.el.style.transform = `translate(${it.x.toFixed(1)}px, ${it.y.toFixed(1)}px) rotate(${it.r.toFixed(2)}deg)`;
    }
  }
  requestAnimationFrame(frame);
}

/* Contadores del statement: incrementan al entrar en viewport — JS puro,
   funcionan igual con o sin GSAP y con reduced-motion. */
function animateCounters() {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting || e.target.dataset.done) continue;
      e.target.dataset.done = "1";
      const end = Number(e.target.dataset.count);
      const t0 = performance.now();
      const dur = 1600;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        e.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      io.unobserve(e.target);
    }
  }, { threshold: 0.6 });
  document.querySelectorAll(".stat-num").forEach((el) => io.observe(el));
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

/* ---------- IA: los loops solo corren en viewport; ABI con sonido opcional ---------- */
function startAiReel() {
  const cards = document.querySelectorAll(".ai-card");
  if (!cards.length) return;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target.querySelector("video");
      if (!v) continue;
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }
  }, { threshold: 0.35 });
  cards.forEach((c) => io.observe(c));

  const abi = document.querySelector(".ai-card-abi");
  const btn = abi?.querySelector(".ai-sound");
  const video = abi?.querySelector("video");
  if (btn && video) {
    btn.addEventListener("click", () => {
      video.muted = !video.muted;
      // con sonido la pieza arranca de cero: se escucha completa, no a mitad
      if (!video.muted) video.currentTime = 0;
      btn.setAttribute("aria-pressed", String(!video.muted));
      btn.textContent = video.muted ? "♪ Sonido" : "♪ Silenciar";
    });
  }
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
  "MOTION GRAPHICS", "BRANDING", "VIDEO", "IA GENERATIVA", "SOCIAL MEDIA", "DISEÑO", "ILUSTRACIÓN",
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

  const mobileFixed = matchMedia("(max-width: 620px)");

  function fit() {
    // en móvil el tamaño es FIJO por CSS (clamp por vw): cero reflow por tecla
    if (mobileFixed.matches) { line.style.fontSize = ""; return; }
    line.style.fontSize = "";
    let size = parseFloat(getComputedStyle(line).fontSize);
    let guard = 60;
    // OJO: comparar contra clientWidth con margen rompe el loop (en flex,
    // scrollWidth nunca baja de clientWidth y encogía hasta el piso).
    // Se detecta overflow real y el colchón subpixel va como paso FINAL.
    let shrunk = false;
    while (line.scrollWidth > line.clientWidth && size > 14 && guard--) {
      size *= 0.94;
      line.style.fontSize = `${size}px`;
      shrunk = true;
    }
    if (shrunk) line.style.fontSize = `${size * 0.97}px`;
  }
  window.addEventListener("resize", fit);

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

  // Camino estático SOLO si faltan GSAP/ScrollTrigger (CDN caído). Con
  // reduced-motion el sitio anima igual — este portafolio ES motion, decisión
  // de la dueña; los contadores van aparte (animateCounters).
  if (!window.gsap || !window.ScrollTrigger) {
    document.documentElement.classList.add("gsap-done");
    title.classList.add("ready");
    setTimeout(() => startTitleCycle(title.querySelector(".line.accent")), 3000);
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  if (window.Flip) gsap.registerPlugin(Flip);

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

  // El hero se disuelve al salir — todo interactúa con el scroll
  gsap.to(".hero-inner", {
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom 35%", scrub: true },
    yPercent: -10, opacity: 0.25, ease: "none",
  });

  // Títulos de sección: parallax scrub al entrar
  document.querySelectorAll(".section-title").forEach((el) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: "top 96%", end: "top 58%", scrub: true },
      y: 36, opacity: 0.25, ease: "none",
    });
  });

  // Statement (los contadores van por animateCounters, sin GSAP)
  gsap.from(".statement-text", {
    scrollTrigger: { trigger: ".statement", start: "top 75%" },
    opacity: 0, y: 40, duration: 0.9, ease: "power3.out",
  });

  // Textura de fondo: la parallax de scroll va en el CONTENEDOR — la física
  // de rebote es dueña del transform de cada shape (sin conflicto)
  document.querySelectorAll(".deco").forEach((d) => {
    gsap.to(d, {
      scrollTrigger: { trigger: d.parentElement, start: "top bottom", end: "bottom top", scrub: true },
      y: -46, ease: "none",
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
  // Figuras: entrada por escala (la y es del scrub — sin pelear por transform);
  // al terminar arranca la respiración idle (squash sutil desfasado — vivas)
  gsap.from(".geo-fig", {
    scrollTrigger: { trigger: ".geo", start: "top 82%" },
    opacity: 0, scale: 0.7, rotate: -5, transformOrigin: "50% 100%",
    duration: 0.8, ease: "back.out(1.7)", stagger: 0.12,
    onComplete: () => {
      document.querySelectorAll(".geo-fig").forEach((f, i) => {
        gsap.to(f, {
          scaleY: 1.025, scaleX: 0.992, transformOrigin: "50% 100%",
          duration: 1.9 + i * 0.35, yoyo: true, repeat: -1, ease: "sine.inOut",
          delay: i * 0.25,
        });
      });
    },
  });
  document.querySelectorAll(".geo-fig").forEach((el, i) => {
    gsap.to(el, {
      scrollTrigger: { trigger: ".geo", start: "top bottom", end: "bottom top", scrub: true },
      y: -(26 + (i % 3) * 16), ease: "none",
    });
  });
  // al asomarse "Sobre mí", las piezas caen con gravedad (una sola vez)
  ScrollTrigger.create({
    trigger: "#sobre-mi", start: "top 88%", once: true, onEnter: startGeoFall,
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
