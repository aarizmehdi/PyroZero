# Pillar filters, model notes and evidence-map controls

- Mobile safety filters use one grouped control: a full-width All pillars button above prevention, detection and suppression on a shared row.
- The Lab's long model paragraph is a disclosure with a short estimate/testing reminder. Assumptions use a list; scenario warnings retain their full text in a separate list.
- Evidence-map modes use equal-width buttons with separate node counts. Their width accounts for the panel's side margins. The graph and node picker use natural height, and node-detail text wraps within its panel.

`ui-notes-results.json` records 14 light/dark viewport combinations (320, 360, 390, 425, 768, 1024 and 1440 px). Checks cover filter selection/reset, model-note disclosure, all 67 ontology nodes, active-query switching, node selection, zoom, control containment and page overflow. Browser exceptions: none.

Production build, TypeScript and ESLint pass. Mechanical design check: no findings. Physics, catalogue, tour and 3D scenes are unchanged.
