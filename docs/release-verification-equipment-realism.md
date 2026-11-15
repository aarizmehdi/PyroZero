# Equipment and scientific-plot refinement

The fine-water-mist and particle-discrimination workbench scenes now use detailed equipment geometry: a lathed stainless nozzle, machined grooves, brass coupling, ribbed hose and mount; and a glass flow cell surrounded by cylindrical optics on a perforated breadboard. Brushed roughness, environment reflections, metal bezels, lenses and smaller particles replace the previous box assemblies. These are illustrative models, not reconstructions of flight hardware.

The existing cylinder scene retains its geometry, materials, lighting and linked capacity control. All scenes retain pause, reset, drag, reduced-motion handling, viewport suspension and WebGL fallback. Geometry, materials, generated textures and renderer resources are disposed on unmount.

The burn specimen's width bracket and 6.5 cm label have separate clearance, with additional space before the prescription. The flammability boundary has no “Live surrogate” badge. Its four gravity labels use a padded HTML legend, changing to two columns on phones. The mobile chart remains internally scrollable without page overflow.

Physics equations, material coefficients (including SIBAL 0.3147), API behavior and research data are unchanged.

Validation artifacts:

- `lab-spacing-results.json`: 12 light/dark viewport combinations (1440, 1354, 1100, 1024, 390 and 425 px), measuring specimen label clearance, prescription spacing, legend padding and page overflow.
- `spinoff-3d-results.json`: actual WebGL scenes and linked controls, interpolated media changes, pause, reduced motion, context-loss fallback and remount, plus the same 12 theme/viewport combinations.
- `browser-results-v8.json`: current regression run across all four modules, both themes and desktop/mobile sizes (the existing checker retains its historical artifact name).
- Production build, ESLint, TypeScript and all 121 unit tests pass.

Visual review includes the workbench hardware and Lab panels on desktop and mobile. Headless WebGL uses SwiftShader; reduced motion is enabled for static layout captures after verifying animated interpolation.
