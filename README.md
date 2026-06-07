# reno · vision

Configurador 3D de muebles con cotización instantánea. SPA cliente (sin backend) donde el usuario elige líneas, ambientes, materiales (melaminas), patas y dimensiones, ve el mueble renderizado en **3D** y en **realidad aumentada (AR)**, y obtiene un precio calculado al instante.

## ✨ Características

- **Configurador 3D en tiempo real** con [three.js](https://threejs.org/) — la geometría del mueble se genera proceduralmente a partir de los datos.
- **Vista AR** con [`<model-viewer>`](https://modelviewer.dev/) (WebXR / Scene Viewer en Android / Quick Look en iOS).
- **Cotizador instantáneo**: precio determinístico según módulo, ancho, línea, melamina y patas.
- **Estado en la URL**: la configuración es compartible mediante deep links.
- **Envío de cotización** por email vía [EmailJS](https://www.emailjs.com/) (sin servidor propio).
- **Descarga de documento** con el resumen de la configuración.

## 🛠️ Stack

- React 18 + Vite 5 (JSX)
- three.js para el render 3D y export GLB
- @google/model-viewer para AR
- EmailJS para el envío de cotizaciones

## 🚀 Desarrollo

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run build    # build de producción en dist/
npm run preview  # previsualizar el build
```

## 📁 Estructura

```
src/
  main.jsx          # bootstrap: monta React, registra model-viewer
  app.jsx           # router por estado + sincronización con la URL
  Home.jsx          # landing
  Materiales.jsx    # catálogo de melaminas
  BuildingSection.jsx  # corte SVG interactivo del edificio
  RoomView.jsx      # vista de ambiente
  Studio3D.jsx      # el configurador: visor 3D, geometría, AR, cotización
  data.jsx          # catálogo + lógica de precios (única fuente de verdad)
  sendQuote.js      # envío de cotización por EmailJS
public/assets/      # texturas de melaminas
```

## 📦 Despliegue

La app es 100% estática: `npm run build` genera `dist/`, que se puede servir desde cualquier hosting estático (Vercel, Netlify, GitHub Pages, etc.).

---

Hecho con ❤️ por Aquiles Díaz.
