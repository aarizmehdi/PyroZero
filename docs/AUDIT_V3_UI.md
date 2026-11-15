# PyroZero v3 interface audit and implementation plan

Audit date: 2026-11-14. The latest daylight-first user directive supersedes the master specification's earlier dark-first direction.

## Existing findings

- Header leads with Zentrix Labs, duplicates PyroZero branding, and includes an unnecessary fixed side rail plus a second row of module tabs.
- Default dark surfaces and hard-coded SVG fills, labels, and grids do not adapt to a daylight scientific workspace.
- Investigation counts are fixed at twelve. Safety-pillar, completion status, sensor tags, oxygen partial pressure, and the eighteen-card research library are absent.
- Copilot executes `queryKnowledgeGraph` in the client; it does not call the requested server pipeline or handle streaming responses, cancellation, or API failures.
- Existing mission presets, physics controls, LOC/flame/specimen plots, incident anchors, spinoff calculators, evidence export, and walkthrough work and should retain their scientific behavior.
- Status labels need to distinguish a virtual screen from physical NASA certification.

## Design plan

Software research workspace for engineers comparing spacecraft fire-safety evidence. Primary action: select a mission and inspect its evidence or material screen.

Palette: alabaster canvas `#F8FAFC`, white surface `#FFFFFF`, slate ink `#0F172A`, secondary slate `#475569`, NASA cobalt `#0B3D91`, thermal amber `#EA580C`, hairline border `#E2E8F0`. Dark mode uses the same semantic tokens with a slate canvas, brighter cobalt, and readable plot labels. Light mode is the first-visit default; explicit theme choice persists locally.

Typography: Inter/system sans for navigation and explanatory text; bundled monospace/system monospace with tabular numerals for measurements, equations, and identifiers. Labels use sentence case. Section headings describe the engineer's task.

Layout: one broad desktop header with PyroZero sphere/flame SVG at left, four segmented modules centered, mission selector and theme control at right. Module title, one-sentence purpose, and useful export/walkthrough controls lead a shared telemetry strip. Content aligns to a single centered workspace grid. Mobile navigation becomes a four-item grid below the brand row; content becomes one column with deliberate horizontal scrolling only inside scientific tables.

Distinctive content: the LOC curve is the central scientific visual, and mission evidence combines compact tested-envelope bars with transparent ranking weights. No decorative terminal logs or invented telemetry. Brand attribution appears exclusively in the exact requested footer.

## Implementation and verification gates

Use the actual expanded catalogue and adapter; do not duplicate physics coefficients in UI. Add safety-pillar filters, status/sensor metadata, an accessible research-card explorer, and explicit Artemis II detector context with source/evidence labels. Compute partial pressure directly from active pressure and oxygen fraction.

Route all copilot queries through `POST /api/copilot`. Read SSE events `result`, `token`, `done`, and `error`; support loading, cancellation, malformed-response errors, and deterministic server fallback. API keys remain server-only.

Scientific SVG colors use adaptive tokens, preserve actual curve and marker values, and keep semantic warning colors readable. Virtual PASS/FAIL/WARNING displays are model screens, not certifications.

Run lint, TypeScript, unit tests, production build, and desktop/mobile browser checks after implementation. The owner handles the API route and deployment; interface changes are checked against those live contracts.

## Browser-review corrections

The owner's first production/browser run passed build, 114 tests, and twenty viewport checks. Visual inspection identified crowded labels in the 67-node mobile graph. The graph now labels only the actively selected, hovered, or focused entity in a fixed, capped overlay; all nodes and directed edges remain visible. A grouped, accessible node selector below the plot supports inspecting every entity without relying on small touch targets. The selected entity's full label is available below the SVG and its evidence remains in the existing inspector.

On small screens, the LOC curve keeps a readable minimum plotting width and scrolls within its panel, with a visible instruction; the page itself remains responsive. Frontend SSE parsing now normalizes CRLF after appending each decoded chunk, covering line endings split across network chunks. These bounded fixes require the owner's final build/browser rerun before publication.
