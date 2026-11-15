# PyroZero v3 data and GraphRAG audit

Audit recorded before implementation on 2026-11-14 against the user-supplied master specification in `C:/Users/Aariz/Downloads/pyrozero_master_codex_specification.md`, Section 4.

| Requirement | Existing state | Required implementation |
| --- | --- | --- |
| Canonical catalogue | Supplemental 2.6.0; 12 groups | Preserve Section 4 JSON exactly: 3.0.0; 15 groups |
| Added investigations | S-Flame, DAFT and lunar planned group absent | Add `ACME-S-FLAME`, `PSI-DAFT`, `PSI-FM2-LUCI` |
| FM2 and LUCI identity | Absent | Master contains one combined `PSI-FM2-LUCI` record; preserve exactly 15 groups and support `PSI-FM2` and `PSI-LUCI` as query aliases |
| Materials / incidents / spinoffs | 6 / 3 / 3 present | Preserve all Section 4 values, exact discrete event anchors and complete technical specifications |
| Knowledge cards | None | Add all 18 supplied cards and searchable graph evidence |
| Safety pillars / status / sensors | Absent | Expose canonical `safety_pillars`, `status`, `has_psi_data`, `sensors`, `gravity_coverage`, `sub_hardware` |
| Citation links | DOI-only construction | Accept both DOI identifiers and supplied HTTPS source URLs; never construct `doi.org/https://...` or a null DOI link |
| Graph retrieval | 12 groups, no cards | Retrieve every group and all 18 cards through six node types and seven relationship types |
| Provenance | Separate independent evidence annotations available | Retain separation: supplied `verified: true` is a source assertion, not proof of independent verification |
| Testing | Previous counts and shape assumptions | Add exact v3 payload checks, planned-status/aliases, card retrieval, citation URL and graph-integrity coverage |

The current deterministic engine executes the supplied closures; no new coefficients are introduced by this data task. Current UI already treats NASA qualification as requiring physical testing. Data expansion will retain that distinction even where supplied card or material text contains stronger claims.

## Verification boundaries

Primary-source verification is recorded in the separate `evidence-provenance.json` artifact and surfaced by the adapter. The master payload remains unchanged, including source assertions and claims requiring qualification. In particular the 2026 ECLSS/FDS cards, the Artemis II alarm attribution, planned FM2/LUCI status and source-link availability require direct source checks. Canonical incident records remain event anchors; earlier educational continuous reconstructions are not recovered telemetry.

## Implementation and source audit results

- Section 4 payload copied exactly; normalized-LF SHA-256: `c7e7b826dba44b4a65d61d149c98566dc5456f2af57755c7299d656c5044f026`.
- Adapter exposes all new metadata, normalizes DOI/source-URL handling and preserves all 18 supplied cards while recording independent verification separately.
- All 18 cards participate in bounded lexical retrieval and two-hop traversal as reference records within the existing six node-type / seven relationship-type UI contract. Direct card identifiers and subject aliases retrieve stable citations. Planned FM2/LUCI links are labeled planned target evidence, not measured lunar-surface telemetry.
- NASA NTRS [20260003925](https://ntrs.nasa.gov/citations/20260003925) confirms the 2026 ECLSS finding about 70% of the assessed subsystems requiring material replacement; this is not a claim about every spacecraft subsystem.
- NASA's [20260001600 API record](https://ntrs.nasa.gov/api/citations/20260001600) returned HTTP 200 and confirms the curated July 2026 paper *Spacecraft Fire Safety Predictions using Verified Saffire Model*, ICES-2026-092. Its FDS validation does not independently validate PyroZero's surrogate.
- The [NASA FM2 poster](https://ntrs.nasa.gov/api/citations/20240015307/downloads/Glenn_2024_ZayacPoster.pdf) supports development status, the two test atmospheres and preliminary lunar-gravity analog evidence.
- The [AWS registry](https://registry.opendata.aws/nasa-psi/) confirms the public PSI resource but names DSI/OASIS in the resource description; a complete combustion archive mirror is not established.
- [NASA's DAFT press-kit account](https://www.nasa.gov/wp-content/uploads/2024/04/exp11-presskit.pdf) describes 2004 hardware in support of SAME. The supplied card's literal hardware-reuse chronology needs qualification.
- [NASA Spinoff](https://spinoff.nasa.gov/Spinoff2020/ip_5.html) confirms ISS fine-water-mist replacement of CO2 extinguishers; the broader Halon wording remains a supplied claim.
- [AIAA's direct crew-debrief reporting](https://aerospaceamerica.aiaa.org/artemis-ii-astronauts-praise-orion-capsule-reflect-on-mission-impact/) supports the Artemis II alarm event. Its cause is not established.

Data and graph verification: 53 tests passed across `tests/data-v3.test.ts` and `tests/knowledge-graph.test.ts`. The initial shared typecheck reported only concurrently edited API-test/Worker files; central QA owns the final production-wide checks.
