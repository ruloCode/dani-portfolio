# Dani Ramírez — Portafolio

Portafolio de **Daniela Ramírez O**, diseñadora gráfica y motion designer en Bogotá.
Sitio estático generado a partir de su perfil de Behance ([dannyromo615c](https://www.behance.net/dannyromo615c)).

**🌐 En vivo:** https://dani-portfolio-virid.vercel.app
**Repo:** https://github.com/ruloCode/dani-portfolio

## Estructura

- `index.html` — one-page: hero 3D, marquee de clientes, trabajo seleccionado, archivo tipo índice con preview flotante, expertise, sobre mí y CTA de contacto.
- `data/projects.json` — manifest de proyectos (título, descripción, tags, assets locales, embeds).
- `assets/projects/<id>-<slug>/` — imágenes y videos (mp4 de los HLS nativos de Behance) de cada proyecto.
- `assets/profile/` — avatar y banner del perfil.
- `css/styles.css` · `js/app.js` · `js/hero3d.js` — estático, sin build step.

## Stack de efectos (vía CDN)

- **three.js** — hero con campo de partículas en onda (shader propio, parallax al mouse, auto-pausa fuera de viewport).
- **GSAP + ScrollTrigger** — reveals escalonados, parallax de imágenes en los casos, contadores.
- **Lenis** — smooth scroll.
- Cursor custom, tilt 3D en cards, preview flotante en el archivo, grain animado. Todo respeta `prefers-reduced-motion`.

## Correr local

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

Cualquier hosting estático sirve (Vercel, Netlify, GitHub Pages) — no hay build.

## Notas

- Los videos de motion graphics alojados en YouTube/Vimeo se muestran como embeds dentro del modal; las imágenes y los mp4 nativos de Behance están descargados en `assets/`.
- Los assets se scrapearon con Playwright (2026-07-24). Para refrescar el contenido, repetir el scrape y regenerar `data/projects.json`.
