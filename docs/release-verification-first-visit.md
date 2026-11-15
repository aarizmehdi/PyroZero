# First-visit tour and final responsive refinements

New visitors see an optional welcome on page 1. A six-step tour visits all four modules and the Earth workbench. Skip, close, Escape and Finish remember dismissal under `pyrozero-tour-v1` in browser local storage. Tools → Tour replays it. No account or tracking cookie is required. The welcome manages keyboard focus; subsequent steps leave the workspace available and highlight the relevant region. Motion follows the reduced-motion preference.

The evidence matrix starts with three results. Search filters all 15 investigations; Show all and Show first 3 control the displayed rows. Mobile prevention, detection and suppression filters share a row. Ranking priorities replace the unexplained AHP title, with an introduction explaining the fit score. The 1g risk callout has stronger hierarchy and no decorative star.

Mobile atmosphere and material controls start closed. Four mission presets remain visible; customization is an explicit disclosure. Desktop controls start open. LOC and cabin oxygen readings sit above the chart, preventing annotation collisions. Each gravity comparison now includes its own LOC and mixed-convection values.

The nozzle has a supporting platform; both equipment views have more framing clearance. Smoke has a stronger cloud appearance. The visible drag/illustration caption is removed while reset, pause, accessible canvas labels and concise explanatory copy remain. Cylinder rendering is preserved.

Reference answers have a neutral amber explanation notice. Independent source-check notes use a compact disclosure, preserving their full text. The evidence map precedes source cards in mobile reading order. Historical scenario buttons use a shorter mobile label, and GMT/GET definitions have a separate time-reference note.

Verification:

- Production build and TypeScript pass; ESLint passes without warnings.
- All 121 unit tests pass. Physics and SIBAL calibration are unchanged.
- `final-experience-results.json`: onboarding behavior plus 48 module/theme/viewport checks at 1440, 1354, 1100, 1024, 390 and 425 px.
- `advisor-flow-results.json`: real reference API, provider fixtures, request lifecycle, persistence, cancellation and mobile overflow.
- `lab-spacing-results.json`: 12 light/dark viewport checks for specimen clearance, gravity-label padding and overflow.
- `spinoff-3d-results.json`: actual WebGL initialization, linked controls, interpolation, pause, reduced motion, context-loss fallback, remount and 12 theme/viewport checks.
- Impeccable mechanical design check: no findings.

UI/tour layout checks use WebGL fallback; the dedicated equipment suite separately verifies actual Three.js rendering with SwiftShader. Both routes remain usable.
