# Submission source and claim notes

Checked against the current codebase and accessible primary sources on 15 November 2026. These notes qualify the final submission materials, not the canonical supplied dataset itself.

| Brief wording | Submission treatment | Basis |
| --- | --- | --- |
| 12 TB PSI data bottleneck | Large archive / terabytes of research; 12 TB combustion subset unverified | [NASA July 2025 update](https://science.data.nasa.gov/features-events/physical-sciences-informatics-updates) reports about 30 TB across physical sciences, not a verified 12 TB combustion subset |
| >40% higher oxygen | 34% vs 21% = about 62% higher mole fraction; reduced total pressure shown separately | Arithmetic: `(34/21 - 1) × 100` |
| 70% material replacement crisis | 70% of the subsystems assessed in that study need material replacement | [NTRS 20260003925](https://ntrs.nasa.gov/citations/20260003925); not 70% of every spacecraft's materials |
| No lunar/Martian data | Sparse matching coverage; distinguish true surface gravity, simulated gravity, and mission-specific envelopes | [NASA LUCI summary](https://www.nasa.gov/stmd-flight-opportunities/flight-summaries/lunar-gravity-simulation-via-suborbital-rocket/), [NTRS 20250010653](https://ntrs.nasa.gov/citations/20250010653), [FM2 poster](https://ntrs.nasa.gov/citations/20240015307) |
| 12 completed + DAFT + FM2 + LUCI | 15 bundled investigation groups; FM2/LUCI share a row; 14 marked completed, 1 planned in the supplied snapshot | `src/data/psi_combustion_knowledge_base.json`; several rows consolidate campaigns, so row count is not raw dataset count |
| FM2 and LUCI upcoming lunar surface payloads | FM2 surface work and LUCI simulated-gravity research are separate contexts; ingestion is a roadmap goal | NASA LUCI and FM2 sources above; the supplied combined status is an older snapshot |
| NOMS = 1.4–2.7% O2 | Scenario-dependent oxygen percentage-point difference; disclose exact inputs | Engine cases in `submission-benchmarks.json`: lunar PMMA NOMS 1.54 pp; SIBAL benchmark 1.31 pp |
| Nomex PASS matches Saffire-VI | Model PASS is consistent with the supplied reported observation, not independent validation | 0g, 54.1 kPa, 31.9% O2, 20 cm/s gives zero spread and model LOC 34.82%; source chain remains qualified |
| SIBAL 2.030 mm/s validated | One-point calibration to supplied Saffire-II reference | `spreadCoeff=0.3147`, exact engine input/result in benchmark JSON; no claim of independent validation |
| Zero hallucinated numbers | Numerical outputs come from deterministic code; completion checks constrain prose | Numeric-token checks do not prove semantic correctness or prevent all unsupported claims |
| Automatic deterministic fallback after DeepSeek error | No-key reference mode is available; failed/invalid DeepSeek synthesis shows explicit recovery | `copilot-service.ts` intentionally returns `provider_error` for those failures |
| 114 tests / 3,456 states | Previous beta: 138 tests / 4,608 bounded combinations; current release adds 7 expiry tests | Re-run results recorded in submission verification report |
| DeepSeek V3 | Configurable `deepseek-chat` API alias; no pinned V3 claim | Server default and env configuration |
| Instant habitat safety decisions | Research trade studies and evidence navigation; no flight-use approval | Supplied model, virtual screen, and experimental-validation limits |
| Direct commercialization | Potential application areas requiring separate engineering validation | Water mist, optical particle discrimination, and SCBA/PBI demonstrations are not certified terrestrial products |
| Artemis II accident lesson | Separately annotated smoke-alarm case; no confirmed fire or attribution inferred | Existing catalogue and evidence assessment; not equivalent to Apollo/Mir fire events |
| Open-source README | Public-source repository; no new license granted without owner's license choice | No project LICENSE file is currently granted |

## Requested report identifiers

- [20260003925](https://ntrs.nasa.gov/citations/20260003925): title and study scope verified from the NASA record.
- [20240015307](https://ntrs.nasa.gov/citations/20240015307): FM2 title, atmosphere context, and SIBAL observation verified from the NASA record.
- [20260001600](https://ntrs.nasa.gov/citations/20260001600): retained from the supplied source list; page/API retrieval did not establish its contents in this pass. It is not used as proof that PyroZero is validated against FDS.
- `NP-2015-10-034-JSC`: named supplied research guide; full-text review not completed here.
- [NASA-STD-6001B Change 2](https://standards.nasa.gov/sites/default/files/standards/NASA/B-w/CHANGE-2/2/NASA-STD-6001B-w-Change-2_Admin-Change.pdf): physical flammability-test reference, not implemented qualification.
- [JSC 29353D](https://standards.nasa.gov/node/1404): NASA standards record verified; configuration guidance is for crew breathing environments, not propulsion/high-pressure oxygen systems.

Dataset/publication identifiers in the portal table reproduce the actual catalogue references. Some are publication DOIs, some dataset DOIs, and some general portal links. Existing provenance annotations still apply; inclusion is not independent scientific validation.

## Judging-field scope

Impact, Creativity, Validity, Relevance, and Presentation are the five requested headings. [Space Apps' 2026 Faisalabad page](https://www.spaceappschallenge.org/2026/local-events/faisalabad/) identifies those criteria. The actual authenticated submission form was not accessed; portal answers cover the four fields requested by the user, without fabricating team-member or consent fields.
