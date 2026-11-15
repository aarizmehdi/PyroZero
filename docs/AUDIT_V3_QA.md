# PyroZero v3 QA audit

Audit basis: the November 14, 2026 continuous-execution request and `pyrozero_master_codex_specification.md`. The latest request supersedes the earlier dark-first interface direction: the default is now a daylight scientific workspace. The application remains a research surrogate. A virtual PASS does not establish NASA qualification or certification.

## Initial gaps and implementation ownership

| Area | Initial gap | Implementation / verification |
| --- | --- | --- |
| Evidence | Earlier catalogue held 12 groups and no master knowledge-card collection | Data agent expanded to 15 groups, six materials, three incidents, three spinoffs and 18 knowledge cards; master-payload conformance tests cover preservation and graph integration. |
| Physics | Previous executable supplement differed from the new master reference pressure, constants and transport closures | Physics agent implemented the master and added independent master-formula tests. Existing SIBAL benchmark discrepancies must remain explicit rather than being hidden by calibration. |
| Interface | Dark-first Zentrix header and earlier module vocabulary | UI agent owns the PyroZero-first light/dark design, daylight plots, safety filters, partial-pressure comparisons, card explorer and final browser validation. |
| Server | Copilot execution was browser-local | Root implemented a true App Router POST endpoint plus the shared server handler used by the deployed Worker. Deterministic operation requires no provider key. |
| Optional narrative | Provider responses introduce additional failure and trust boundaries | Stub-fetch tests cover outages, invalid narrative/citations, numerical assertions, framing, cancellation, deadlines and provider failover. No paid provider is called by these tests. |

## Backend findings

1. A request aborted before its signal listener is installed must never initiate an optional provider request. A response-reader disconnect must abort the active upstream operation and prevent provider failover.
2. SSE CRLF separators may straddle arbitrary network chunks. Normalization must operate on the accumulated pending buffer; UTF-8 decoding must retain incremental decoder state.
3. Raw user-query numbers are not scientific authority. Numerical-token validation must derive its allowlist from computed results and retrieved evidence, excluding the query and duplicate copies of that query.
4. Citation identifiers are restricted to the retrieved citation set; unknown IDs, unapproved URLs, invented numbers and direct certification claims must fall back to deterministic synthesis. Equivalent wording such as “certified by NASA” also requires rejection.
5. Unknown-length request bodies must be capped while reading. The final handler cancels the incoming reader as soon as its 32 KiB budget is exceeded, rather than buffering an arbitrary body and checking afterward.

All five findings were fixed in the shared handler and independently regression-tested. The cancellation test verifies that disconnecting the response reader aborts the active provider and prevents a second-provider request. The size-budget test verifies cancellation before the remaining oversized request stream is consumed.

These are bounded application controls, not a proof that generated prose is semantically correct. Membership of an identifier does not prove that every sentence is supported by that source, and token-level numerical checks cannot verify units or causal interpretation. Deterministic tables, record provenance and the cited evidence remain authoritative. The optional narrative is secondary explanation.

## Verification record

- Independent edge-case suite: `tests/copilot-edge-cases.test.ts` (stubbed fetch only).
- Existing route suite: `tests/copilot-api.test.ts` verifies the actual App Router implementation, 3-stage deterministic pipeline, malformed requests and supported provider streaming.
- Data/master, physics, GraphRAG, UI/build and dependency checks are reported by the owning agents and root after their final edits. This audit does not infer a pass from a test merely being written.
- Targeted final command: `npm test -- tests/copilot-api.test.ts tests/copilot-edge-cases.test.ts`. Observed November 14, 2026 at 18:34 Asia/Karachi: **2 files passed, 22 tests passed**, Vitest 5.1.0, 2.25 seconds. No external provider requests were made.
- The runner emits a non-blocking warning about ESM syntax in `vitest.config.ts` when a future Vite native configuration loader becomes the default; the current configuration loads and all targeted tests pass.
- Root reported a successful online dependency installation and **zero audit vulnerabilities** after upgrading the test toolchain; this audit did not rerun the network audit or install packages.
- Final full-suite totals, lint, TypeScript, production build, browser validation and redeployment evidence remain owned by root and must be recorded from the final observed run.

## Scope boundaries

Historical curves are labeled reconstructions or supplied event anchors rather than recovered telemetry. Planned investigations must remain visibly planned. The master’s 18 supplied “verified” cards still need record-level provenance distinctions where a claim was not independently checked. Status badges must say virtual PASS/FAIL rather than NASA-certified. Test 4 wire-insulation qualification and actual material approval cannot be established by the bulk-material surrogate.
