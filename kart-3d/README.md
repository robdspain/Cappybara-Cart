## Graphics roadmap

This document tracks the graphics upgrades for the 3D kart game, aligned with the provided specs. We will iterate from simple, high‑impact steps to advanced features.

### Phase 0 — Baseline polish (done)
- Enable color management (sRGB), ACES filmic tone mapping, exposure tuning
- Soft shadow maps and configured shadow camera for sunlight
- Scene fog for depth cueing
- Ensure ground and track receive shadows; karts cast shadows

### Phase 1 — Low‑poly fidelity uplift (WIP)
- Replace primitive kart with low‑poly mesh; target 2k–5k tris
- Add basic materials per part: paint (metalness 0.1–0.2, roughness 0.4–0.6), rubber wheels (roughness 0.9), plastics (roughness 0.6–0.8)
- Add wheel rotation and simple suspension bob animation

### Phase 2 — Track materials and lighting
- Road material: subtle tiling asphalt normal map + AO (1K); curb and mud variants
- Light probe/ambient light with HemisphereLight tuned; add light helper for dev
- Baked lighting for static props (later), dynamic sun for time‑of‑day

### Phase 3 — FX and postprocessing
- Particle systems: drift smoke, boost trails, item explosions
- Post: bloom (selective), lightweight motion blur, vignette
- Color‑blind accessibility palettes for item glows and UI accents

### Phase 4 — Characters and environment
- Import animated character riders (idle, drive, victory)
- Crowd billboards with simple animation
- Track hazards with basic skeletal or object animation

### Performance targets
- 60 FPS on mid‑range mobile and desktop
- Use LODs for far props; limit overdraw; cap shadow map sizes; clamp pixel ratio ≤ 2

### Testing
- Cross‑device responsive canvas; verify Safari, Chrome, Firefox
- Visual test scenes for materials and light ranges

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
