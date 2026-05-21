# 🚌 TransLog — Sistema de Gestión de Transporte Corporativo

> Demo interactivo completo · Sin backend · Sin instalación

[![Demo Live](https://img.shields.io/badge/Demo-Live-00e5b3?style=for-the-badge)](https://skullklon.github.io/translog)
[![GitHub](https://img.shields.io/badge/Repo-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/Skullklon/translog)

---

## 🚀 Ver demo en vivo

👉 **[skullklon.github.io/translog](https://skullklon.github.io/translog)**

---

## 📋 Funcionalidades del Demo

| Pantalla | Descripción |
|---|---|
| 📊 **Dashboard** | KPIs, gráfica por ruta, ranking, comparativa sucursales |
| 🗺️ **Viajes** | Historial con costo/persona, formulario para crear viajes |
| 📷 **Check-in** | OCR desde cámara con confidence scores + formulario QR |
| 🗺️ **Mapa & Rutas** | OpenStreetMap embebido + links a Google Maps por ruta |
| 👥 **Empleados** | Directorio completo, agregar/editar, asignar destino |
| 🧑‍✈️ **Conductores** | Gestión de flota, agregar/editar conductores y vehículos |
| 📍 **Destinos** | Puntos de entrega con coordenadas y zonas |
| 📋 **Reportes** | Costo por persona por ruta, filtros, exportar Excel |

---

## 💻 Correr localmente

**Sin instalar nada:**
```
Abre index.html directamente en tu navegador
```

**Con un servidor local (opcional):**
```bash
# Python 3
python -m http.server 8080

# Node
npx serve .
```

Luego abre `http://localhost:8080`

---

## 📁 Estructura

```
translog/
├── index.html          ← App completa (React via CDN, sin build)
├── README.md
└── .github/
    └── workflows/
        └── deploy.yml  ← Auto-deploy a GitHub Pages
```

---

## 🏗️ Stack del Prototipo

- **React 18** via CDN (sin npm, sin build step)
- **Plus Jakarta Sans + Fraunces + IBM Plex Mono** — tipografía profesional
- **OpenStreetMap** embebido para visualización de rutas
- **Datos mock** incluidos en el HTML
- **Zero dependencias** locales

## 🏗️ Stack de Producción (Backend Real)

- Next.js 14 + Supabase + Prisma
- Google Vision API (OCR)
- Vercel deployment

---

## 🌐 Deploy en GitHub Pages

Se despliega automáticamente con cada push a `main`.

> ⚠️ Si GitHub Actions está deshabilitado: ir a **Settings → Pages → Source → Deploy from a branch → main / root**

---

## 📄 Licencia

MIT — Libre para uso y modificación
