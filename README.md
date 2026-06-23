# Aerodynamics Simulator — Drone & Aircraft Flow Lab

An interactive, browser-based aerodynamics visualizer and analysis tool. Drop in a 3D model, watch the air flow around it, and read off real-time aerodynamic coefficients and forces — no CFD solver, mesh setup, or install required.

**Live demo → [aerodynamics-simulator-45pws.ondigitalocean.app](https://aerodynamics-simulator-45pws.ondigitalocean.app/)**

## What it does

Upload an **STL / OBJ** model (or try a built-in demo — Cessna, quad-wing interceptor, drone, rocket) and explore its aerodynamics interactively:

- **Airflow streamlines** — 3D, top (Y) and side (Z) slices; lines wrap cleanly over and under the body and trail into the wake, coloured by local velocity.
- **Surface maps** — pressure coefficient (Cp) and relative skin-friction painted on the surface.
- **Drag view** — red streaks that peel off the high-drag areas (blunt fronts, separated wakes), so you can *see* where drag is produced and how it trails downstream.
- **Aerodynamic coefficients** — drag (Cd), lift (Cl, front/rear), lift-to-drag ratio, and true frontal area from an accurate silhouette rasterisation.
- **Forces** — drag, lift and dynamic pressure at a chosen airspeed (in km/h).
- **"How it compares"** — your Cd plotted against everyday shapes (teardrop → sphere → cube → runner).
- **Copy-paste analysis summary** for handing the results to an AI assistant.
- **Re-orient** the model in the wind, deflect flaps, export geometry, and switch units (the unit selector drives the physical scale).
- English / Ukrainian UI.

> The flow field is a fast engineering approximation (Newtonian impact pressure + skin-friction + base-wake terms over a voxel flow field), tuned for the incompressible subsonic range (up to ~M 0.3). Treat the numbers as qualitative/relative, not a full CFD solve.

## Tech stack

- **Frontend** — Nuxt 3 + Vue 3, Three.js for 3D rendering, Tailwind CSS
- **Backend** — NestJS API (file upload + aero data)
- **Runtime** — Bun
- **Hosting** — DigitalOcean App Platform (auto-deploy from `main`)

## Local development

```bash
# frontend (Nuxt) — from app/
cd app
bun install
bun run dev            # http://localhost:3000
bun run dev -- --port 4000   # or a custom port
```

Open `/designer` for the simulator. Load a demo via a query param, e.g. `/designer?model=interceptor` (`interceptor` · `drone` · `rocket`, default is the Cessna).
