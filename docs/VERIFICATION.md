# PyroZero v2.6 / master schema v3 — release verification

Verified on 2026-11-14. The user requested one continuous audit, implementation, verification and redeployment run. Separate before-state audits precede the corresponding implementation changes.

## Final checks

| Check | Observed result |
| --- | --- |
| Canonical master JSON | Exact Section 4 payload: 15 investigation groups, 6 materials, 3 incidents, 3 spinoffs, 18 cards |
| Payload hash | SHA-256 `c7e7b826dba44b4a65d61d149c98566dc5456f2af57755c7299d656c5044f026` after newline normalization |
| TypeScript | `npm run typecheck` passed; Next.js production type stage passed |
| ESLint | Zero errors and zero warnings |
| Unit/integration suite | **114 passed**, seven files, under Vitest 5.1 |
| Numerical domain | **3,456 combinations** finite and bounded; independent master-executable comparison matched supplied numeric/color/status/curve outputs |
| Optional-provider API QA | **22 tests passed** using stub fetches; no paid provider calls |
| Production Next.js | Build passed with prerendered `/` and genuine dynamic `ƒ /api/copilot` |
| Existing private Sites hosting | Server-capable Worker ESM packages the same API handler and prerendered Next.js UI/assets |
| HTTP transport checks | Next.js and production Worker both returned HTTP 200 SSE, 15 rankings, 2 material results, 20 citations and 3 stages for the comparison query |
| Browser coverage | All four modules checked at 1440, 1024, 768, 390 and 320 pixels; no document overflow or NaN output |
| Dependency audit | Online `npm audit --json`: **0 vulnerabilities**, including zero high/critical |

Browser interactions verify default light mode, persistent dark/light preference, PyroZero header/Zentrix footer hierarchy, mission switching, exact pO2 telemetry, prevention/detection/suppression filtering, planned campaign selection, normalized weights, all 18 searchable cards, live scientific plots, server-streamed two-material and knowledge-card queries, invalid-request errors, graph node inspection, reported incident anchors, Artemis II case context, three spinoff controls and the walkthrough modal. `browser-results-v3.json` records the production Worker run; screenshots use the `v3-` prefix.

## Audits and corrected gaps

- [Data and retrieval](AUDIT_V3_DATA.md): catalogue expanded from 12 to 15 groups, 18 source-backed cards integrated into graph retrieval/citations, DOI-versus-source-URL handling corrected, planned results distinguished from completed records.
- [Physics](AUDIT_V3_PHYSICS.md): pO2 added, canonical mission API and camel-case MCDA overload added, supplied constants and closures reproduced without retuning.
- [Interface](AUDIT_V3_UI.md): daylight theme and PyroZero-first brand, centered module navigation, footer attribution, metadata filters, card library, Artemis II case, live SSE client and responsive scientific plots. Crowded phone graph labels replaced with focused inspection and a full accessible node selector. LOC plots scroll inside their panel on narrow screens.
- [Backend](AUDIT_V3_BACKEND.md): browser-only retrieval replaced by a genuine App Router POST route and production Worker counterpart using one shared server pipeline; optional server-only provider keys and deterministic fallback.
- [Independent QA](AUDIT_V3_QA.md): pre-aborted requests, reader cancellation, provider deadlines/failover, CRLF/UTF8 split framing, user-query number injection, false certification assertions and unknown-length oversized-body cancellation covered by regressions.

Inter and JetBrains Mono WOFF2 assets are served locally; the corresponding OFL licenses ship with them. Browser testing uses a separate Chrome/Edge process against the app's real HTTP endpoints. Generated browser profiles and build artifacts are excluded from source/lint checks. An initial final-browser rerun used an incorrect CSS selector for a correctly associated graph-node label; the harness was corrected to target its select element and rerun.

The previous release's generic marketing-layout gate and results remain archived as historical artifacts. This iteration follows the user's explicit scientific application layout and light-first design; its release checks assess actual command-center behavior and responsive containment rather than requiring a marketing hero or a section per screen. No design checker was altered to suppress findings.

## Scientific interpretation and preserved conflicts

| Case | Exact master executable result | Comparison |
| --- | --- | --- |
| SIBAL, 0g / 100 kPa / 21% O2 / 20 cm/s | LOC 18.01%, spread **2.916 mm/s**, burn 26.2 cm | Differs from supplied experimental observation **2.03 mm/s**; unchanged coefficients and discrepancy are locked by tests |
| Nomex, 0g / 54.1 kPa / 31.9% O2 / 20 cm/s | LOC **34.82%**, spread **0**, burn 0, virtual PASS | Matches requested non-ignition outcome |
| PMMA, 0.165g / 56.5 kPa / 34% O2 / 10 cm/s | LOC 17.19%, spread 1.573 mm/s, burn 30 cm, virtual FAIL | Matches requested outcome |
| EVA proxy, 29.6 kPa / 85% O2 | **3.65 psia pO2** | The separate pure-oxygen reference is about 4.30 psia; it is not the 85% proxy |

Software fidelity is separate from experimental validation. All live material predictions are available. Physical NASA-STD-6001 Test 4 wire qualification is not invented from bulk-material equations. PASS/FAIL labels remain virtual screens, not NASA certification or approval. Report claims retain their canonical `verified` flags while independent evidence assessments and qualifications are stored separately. The validated input/UI envelope stays at 13–85% O2 despite conflicting 10–100% prose in the master. Historical views show discrete supplied event anchors; no second-by-second measurements are fabricated. Apollo 13 tank pressures remain outside the cabin surrogate.

## Deployment

The upgrade preserves project `appgprj_6af8175b69e08191b5a71c25405c09c9` and its owner-private audience. The source manifest now selects Worker hosting; no external account, public audience or paid provider key is required to judge the deterministic application. Production source and artifact are synchronized through the Sites workflow. Live publication status is confirmed by the native deployment result; the checked-in `scripts/verify-live.mjs` can additionally exercise the published page and API using a session-supplied owner credential without logging or persisting it.
