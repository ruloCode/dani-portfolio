// Hero 3D — campo de partículas en onda (three.js). Violeta/ácido sobre tinta.
import * as THREE from "three";

const canvas = document.getElementById("hero-canvas");
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
camera.position.set(0, 2.2, 7.5);
camera.lookAt(0, 0, 0);

// Malla de partículas: plano de puntos desplazado por ruido en el vertex shader
const COLS = 160;
const ROWS = 90;
const W = 22;
const H = 12;
const count = COLS * ROWS;
const positions = new Float32Array(count * 3);
const seeds = new Float32Array(count);
let i = 0;
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    positions[i * 3] = (x / (COLS - 1) - 0.5) * W;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = (y / (ROWS - 1) - 0.5) * H;
    seeds[i] = Math.random();
    i++;
  }
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

// Fondo CLARO: blending normal (el aditivo desaparece sobre blanco),
// violeta profundo en las crestas y chispas doradas escasas.
const uniforms = {
  uTime: { value: 0 },
  uMouse: { value: new THREE.Vector2(0, 0) },
  uViolet: { value: new THREE.Color("#4c1d95") },
  uLila: { value: new THREE.Color("#a78bfa") },
  uAcid: { value: new THREE.Color("#ca8a04") },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.NormalBlending,
  vertexShader: /* glsl */ `
    uniform float uTime;
    uniform vec2 uMouse;
    attribute float aSeed;
    varying float vGlow;
    varying float vSeed;

    // simplex-ish barato con senos superpuestos
    float wave(vec2 p, float t) {
      return sin(p.x * 0.55 + t) * 0.55
           + sin(p.y * 0.85 + t * 0.7) * 0.35
           + sin((p.x + p.y) * 0.4 - t * 0.5) * 0.45
           + sin(length(p) * 0.9 - t * 1.1) * 0.35;
    }

    void main() {
      vec3 pos = position;
      float t = uTime * 0.6;
      float h = wave(pos.xz, t);

      // el mouse levanta una cresta local
      vec2 m = uMouse * vec2(11.0, 6.0);
      float d = length(pos.xz - m);
      float lift = exp(-d * d * 0.14) * 1.6;

      pos.y = h * 0.7 + lift;

      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mv;

      float size = (1.3 + aSeed * 1.4) * (1.0 + lift * 0.9);
      gl_PointSize = size * (34.0 / -mv.z);

      vGlow = smoothstep(-0.9, 1.6, pos.y);
      vSeed = aSeed;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uViolet;
    uniform vec3 uLila;
    uniform vec3 uAcid;
    varying float vGlow;
    varying float vSeed;

    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float r = length(uv);
      if (r > 0.5) discard;
      float alpha = smoothstep(0.5, 0.05, r);

      // sobre claro: valles lila suaves, crestas violeta profundo
      vec3 col = mix(uLila, uViolet, vGlow);
      // chispas doradas escasas en las crestas
      if (vSeed > 0.965) col = mix(col, uAcid, vGlow);

      gl_FragColor = vec4(col, alpha * (0.26 + vGlow * 0.62));
    }
  `,
});

const points = new THREE.Points(geometry, material);
points.rotation.x = -0.12;
scene.add(points);

// Mouse → parallax + cresta. En táctiles no hay mouse: la cresta deriva sola.
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const target = new THREE.Vector2(0, 0);
window.addEventListener("pointermove", (e) => {
  target.x = (e.clientX / window.innerWidth) * 2 - 1;
  target.y = -((e.clientY / window.innerHeight) * 2 - 1);
});

function resize() {
  const { clientWidth: w, clientHeight: h } = canvas;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resize();
window.addEventListener("resize", resize);

// Pausar cuando el hero no está en viewport o el tab está oculto (estados separados)
let inView = true;
let tabVisible = !document.hidden;
new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: 0.02 })
  .observe(canvas);
document.addEventListener("visibilitychange", () => { tabVisible = !document.hidden; });

const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  if (!inView || !tabVisible) return;
  const t = clock.getElapsedTime();
  // La onda SIEMPRE avanza — es la identidad del sitio. Con reduced-motion
  // (que muchos Android activan solos con ahorro de batería) solo se ralentiza.
  // En táctiles corre un poco más rápida para que se sienta viva sin mouse.
  const speed = (prefersReduced ? 0.45 : 1) * (finePointer ? 1 : 1.25);
  uniforms.uTime.value = t * speed;
  // deriva autónoma en táctiles: cresta paseando en Lissajous + parallax vivo
  if (!finePointer) {
    target.x = Math.sin(t * 0.34) * 0.7;
    target.y = Math.sin(t * 0.21 + 1.6) * 0.55;
  }
  uniforms.uMouse.value.lerp(target, 0.06);
  camera.position.x += (target.x * 0.7 - camera.position.x) * 0.03;
  camera.position.y += (2.2 + target.y * 0.4 - camera.position.y) * 0.03;
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
}
tick();
