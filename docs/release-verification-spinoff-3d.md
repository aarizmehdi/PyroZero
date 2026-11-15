# NASA-to-Earth workbench — 15 November 2026

Three flat diagrams are replaced with lazy-loaded Three.js0.187 WebGL scenes: enlarged water-mist droplets/nozzle, multi-angle particle detector, and metal/composite breathing-air cylinders. Physically based materials, studio environment lighting and shadows support inspection; these are clearly labeled illustrative product models, not validated fluid/optical/pressure-vessel simulations.

Controls preserve existing calculations. Droplet diameter changes the spray appearance and6/d reading. Dust/smoke/mist transitions interpolate existing particle positions, material color/roughness/opacity and scattering-ray appearance. Cylinder water capacity changes model volume (cube-root linear scale) and both ideal free-air readings while pressure ratings remain fixed.

Models support drag inspection, reset and Pause. Pixel ratio is bounded, particles are instanced, animations bypass React state, offscreen/hidden views skip rendering, static cylinders render on change, shadows update on scene changes, and reduced-motion preferences are respected. Geometry/material/environment/render resources are disposed on unmount. Context loss produces a readable fallback with working controls/specifications.

Typography:15px descriptions,14px explanatory notes,13px spec labels and16px values. Long prose values span the specification grid. Three columns on wide desktop, two plus a split cylinder panel on laptops, and single-column mobile. Short headings retain full technology names in a disclosure.

Validation: production build, TypeScript, ESLint and121 tests pass. Headless Chrome used actual WebGL/SwiftShader to exercise linked controls, interpolated transitions, Pause, reduced motion, context loss and unmount/remount.12 light/dark width combinations (1440,1354,1100,1024,390,425) passed overflow and typography checks; rendered screenshots were inspected. Existing engine, data, scoring, API and SIBAL calibration are unchanged.
