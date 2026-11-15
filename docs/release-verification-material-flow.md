# Explicit material selection and full beta review

The initial environment is Artemis lunar, with no material selected. A visible, labelled native selector sits above material-dependent results on desktop and mobile. No flame, oxygen-limit, burn-screen or material-dependent telemetry is calculated until a material is chosen. Exports also represent the unselected state explicitly.

Mission presets preserve an explicit material choice. Atmosphere customization remains a separate disclosure. Historical scenarios hide competing mission presets and the Custom Envelope reset, start with an unconfirmed material, and expose one Exit scenario action. The original environment, material, confirmation state and ranking priorities are restored on exit, including after switching between incidents.

Incident-record fuel context is separate from a simulated specimen. Apollo 1 offers a nylon/Velcro catalogue analogue; Apollo 13 identifies the PTFE record while explaining that the bulk specimen does not model a cryogenic tank; Mir explicitly has no matching catalogue fuel. Oxygen and pressure caps are visible. An inactive flame now explains the selected material and the modeled limit or zero spread rate.

This applies Jakob Nielsen’s visibility, recognition, error-prevention and user-control heuristics: [NN/g primary guidance](https://www.nngroup.com/articles/ten-usability-heuristics/). Familiar controls and a single reversible exit preserve the existing visual system.

## Advisor findings and corrections

The browser opts into explicit material scope. Evidence questions without a chosen or named material return evidence without an invented PMMA calculation. Materials named in the question take precedence, and completed answers show their material/condition context. Legacy programmatic API clients retain their existing default behavior unless they opt into `requireExplicitMaterial`.

Live testing identified an explanation that confused NOMS with ambient oxygen minus LOC, plus an invalid citation to a section heading. Grounding now gives these margins distinct definitions, exact values, propagation-threshold flags and burn/debris verdict reasons. It also includes the relevant investigation findings, rather than only their citation metadata. Calculations use a distinct `[MODEL]` reference that links to the material table without pretending to be a NASA publication.

Completed DeepSeek responses are checked for permitted citation IDs, numerical-token membership and prohibited qualification claims before the UI marks them ready. Streaming feedback and Stop remain available; rejected or interrupted responses clear the unfinished answer and provide recovery. These checks do not constitute semantic proof or independent scientific validation. The provider deadline is 60 seconds; transient upstream failures were observed during testing and are not represented as successful answers.

## Verification evidence

- **138 unit tests in 12 files pass**, including exact supplied-equation conformance, SIBAL 0.3147 → 2.030 mm/s, reducer restoration, API scope and grounding checks.
- A sweep covers **4,608** material/gravity/pressure/oxygen/flow/electric-field combinations for finite results and consistent oxygen/burn limits.
- `material-beta-results.json`: explicit/empty states, six materials, mission persistence, scenario switching/restoration, SIBAL UI benchmark, evidence-only/named-material answers, and 48 module/theme/viewport checks.
- `scenario-review-results.json`: all three incidents on desktop/mobile in both themes, with fresh material selections and clear source boundaries.
- `browser-results-v8.json`: current 32-check navigation/header/telemetry regression run; the existing script retains its historical filename.
- `final-experience-results.json`, `ui-notes-results.json`, `lab-spacing-results.json`: onboarding, responsive controls, disclosures, graph containment and scientific-label spacing.
- `beta-buttons-results.json`: real empty/selected exports, filters, library search, modal dismissal, internal navigation, incident sliders, source expansion and all 67 graph-node choices.
- `advisor-flow-results.json`: saved-key fixture persistence, loading, duplicate-send prevention, retry, cancellation, truncated responses, scrolling and the real reference endpoint.
- `spinoff-3d-results.json`: actual WebGL, linked controls, particle transitions, pause, reduced motion, camera drag/reset, context-loss fallback and remount in both themes.
- `live-provider-review.json`: three completed live provider responses, reviewed against computed results and supplied evidence; final samples contain no unknown citation IDs.
- `live-ai-browser-results.json`: actual generated response in the mobile browser, 2.030 mm/s displayed, and working calculation links. The test key was not stored in browser local storage.
- `credential-audit-results.json`: source/artifact scan for the supplied test credential; no credential is deployed or saved as a hosting environment variable.
- Production build, TypeScript and ESLint pass. Mechanical design check reports no findings.

## Link and evidence limits

Internal navigation and link formats were checked. NASA PSI redirects to NASA’s BPS data hub. Sample DOI identities were confirmed using Crossref (ACME E-FIELD, `10.1016/j.combustflame.2022.112443`) and DataCite (Spacecraft Fire Safety Experiment-I, `10.60555/0t15-1z43`). Publisher access restrictions prevented complete automated content inspection. The supplied catalogue and numerical research claims remain subject to their existing evidence-status annotations; this beta review does not independently validate all NASA research claims or establish material qualification.
