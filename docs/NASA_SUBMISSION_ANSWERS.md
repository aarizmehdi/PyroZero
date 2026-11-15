# NASA Space Apps submission answers

Team: **Zentrix Labs** · Project: **PyroZero v2.6** · Challenge: **Flame in Freefall**

Demo: https://pyrozero.vercel.app · Repository: https://github.com/aarizmehdi/PyroZero · Deck: https://pyrozero.vercel.app/pyrozero-pitch-deck.html

The four sections below match the fields requested in the brief. The signed-in portal may ask for additional team, location, consent, or media fields; those are not invented here.

## 1. High-Level Project Summary

PyroZero helps engineers and students explore how spacecraft fire behavior changes with gravity, oxygen, pressure, airflow, and material choice. Built by Zentrix Labs for Flame in Freefall, it connects NASA combustion research with transparent engineering calculations and an accessible four-module workspace. The Mission Explorer ranks fifteen investigation groups against mission priorities. The Partial-g Lab compares six materials using explicit assumptions, oxygen-limit curves, flame spread, and virtual burn screens. Fire Forensics links historical incidents to source records and interactive Earth technology comparisons. The Hybrid GraphRAG Copilot retrieves evidence, executes deterministic calculations, and optionally streams a cited DeepSeek explanation. Users can inspect sources and model limits instead of accepting unexplained scores. Desktop and mobile interfaces support both themes, explicit material selection, and reversible historical scenarios. PyroZero is a research prototype: its calibrated benchmarks and software checks support reproducibility, while physical testing and independent validation remain necessary before any operational spacecraft material decision.

## 2. Project Details / How It Works

### Impact

PyroZero shortens the path from a spacecraft fire question to inspectable evidence. It helps users compare mission environments, recognize material-specific risk, and identify where an engineering estimate needs experimental follow-up. Its terrestrial workbench illustrates possible applications of water mist, optical particle discrimination, and protective equipment; product suitability requires separate testing.

### Creativity

Four linked modules join source discovery, weighted mission ranking, partial-gravity surrogate calculations, incident analysis, and a two-hop knowledge graph. An E-FIELD equivalent-gravity comparison makes an unusual connection between electric body forces and buoyant-flow scaling. The interface exposes the assumptions behind that comparison rather than treating it as a measured gravity substitution.

### Validity

The numerical engine executes supplied equations outside the LLM. The original release passed 138 automated tests and a 4,608-state bounded sweep; the submission release adds shared-access expiry tests. A SIBAL coefficient of 0.3147 reproduces the supplied 2.030 mm/s reference point at 0g, 100 kPa, 21% oxygen, and 20 cm/s. This is calibration, not independent model validation. Software checks constrain citations and numerical tokens but cannot guarantee that generated prose is scientifically correct. Evidence annotations distinguish supplied claims, source records, and computed estimates. Historical scenarios are bounded analogues, not accident reconstructions or qualification tests.

### Relevance

The project addresses the challenge's need to summarize, rank, and explain NASA combustion research for exploration environments. Its lunar, Martian, ISS-transit, and high-oxygen proxy profiles expose the roles of oxygen, pressure, flow, fuel, and scale. NASA's ECLSS study reports material-replacement needs in 70% of the subsystems it assessed at 8.2 psia / 34–40% oxygen. The interface helps explore such questions without claiming to certify replacement materials.

### Presentation

A consistent four-tab workspace combines searchable evidence, readable scientific labels, interactive 3D demonstrations, a guided tour, and a cited advisor. Desktop/mobile and Light/Dark checks cover navigation, loading and empty states, cancellation, scenario restoration, exports, graph controls, and model labels. A seven-slide printable deck presents the problem, architecture, calculations, walkthrough, Earth relevance, and roadmap.

### Technical workflow

1. Select a mission and an explicit material, or ask an evidence-only question.
2. Match mission conditions against 15 curated investigation groups using supplied AHP-style weights and Gaussian MCDA sub-scores.
3. Execute transport, LOC, spread, morphology, and burn-screen equations in TypeScript.
4. Extract entities and conditions from a query and traverse the in-memory evidence graph over two hops.
5. Return deterministic results and retrieved sources; optionally stream DeepSeek synthesis with citation and numeric completion checks.
6. Inspect sources and model limits. Unfinished or rejected DeepSeek answers expose recovery; the no-key reference mode remains explicitly labelled.

## 3. Space Agency Data & Resources Used

### Scope of use

This is a curated catalogue of investigation groups, publications, supplied parameters, and provenance annotations. It is not a bulk ingestion or reanalysis of every raw file in PSI. Some rows cite a publication or a general portal instead of a dataset DOI. The table preserves the identifiers actually used in the codebase, without representing all identifiers as independently verified dataset deposits.

### All 15 catalogue groups and their references

| Catalogue ID | Investigation group | Catalogue reference | Associated publication/reference |
| --- | --- | --- | --- |
| PSI-159 | ACME-CFI-G | [10.60555/cyt1-kh64](https://doi.org/10.60555/cyt1-kh64) | [10.1016/j.proci.2022.07.015](https://doi.org/10.1016/j.proci.2022.07.015) |
| ACME-E-FIELD | ACME-E-FIELD | [10.1016/j.combustflame.2022.112443](https://doi.org/10.1016/j.combustflame.2022.112443) | [10.1016/j.combustflame.2022.112443](https://doi.org/10.1016/j.combustflame.2022.112443) |
| ACME-BRE | ACME-BRE | [10.1016/j.combustflame.2018.02.003](https://doi.org/10.1016/j.combustflame.2018.02.003) | [10.1016/j.combustflame.2018.02.003](https://doi.org/10.1016/j.combustflame.2018.02.003) |
| PSI-10 | ACME-FLAME-DESIGN | [10.3390/fire6080285](https://doi.org/10.3390/fire6080285) | [10.3390/fire6080285](https://doi.org/10.3390/fire6080285) |
| ACME-S-FLAME | ACME-S-FLAME | [https://ntrs.nasa.gov/citations/20220007191](https://ntrs.nasa.gov/citations/20220007191) | [https://ntrs.nasa.gov/citations/20220007191](https://ntrs.nasa.gov/citations/20220007191) |
| PSI-60 | ACME-CLD-SPICE | [10.60555/mzjm-yv57](https://doi.org/10.60555/mzjm-yv57) | [10.1080/00102202.2022.2041621](https://doi.org/10.1080/00102202.2022.2041621) |
| PSI-25 | BASS-II | [10.60555/4qc4-de67](https://doi.org/10.60555/4qc4-de67) | [10.1016/j.combustflame.2017.03.001](https://doi.org/10.1016/j.combustflame.2017.03.001) |
| PSI-98 | SAFFIRE-I-III | [10.60555/0t15-1z43](https://doi.org/10.60555/0t15-1z43) | [10.1016/j.combustflame.2018.10.012](https://doi.org/10.1016/j.combustflame.2018.10.012) |
| SAFFIRE-IV-VI | SAFFIRE-IV-VI | [10.2514/6.2021-0548](https://doi.org/10.2514/6.2021-0548) | [https://ntrs.nasa.gov/api/citations/20240007488/downloads/Saffire%20ICES%202024%20Saffire%20presentation072124small.pdf](https://ntrs.nasa.gov/api/citations/20240007488/downloads/Saffire%20ICES%202024%20Saffire%20presentation072124small.pdf) |
| SOFIE-RTDFS-NCA | SOFIE-RTDFS-NCA | [10.1016/j.proci.2016.06.025](https://doi.org/10.1016/j.proci.2016.06.025) | [10.1016/j.proci.2016.06.025](https://doi.org/10.1016/j.proci.2016.06.025) |
| SOFIE-SMURF-MIST-GEL | SOFIE-SMURF-MIST-GEL | [10.1016/j.firesaf.2024.104267](https://doi.org/10.1016/j.firesaf.2024.104267) | [10.1016/j.firesaf.2024.104267](https://doi.org/10.1016/j.firesaf.2024.104267) |
| PSI-69 | FLEX-FLEX2 | [10.60555/gz0q-b577](https://doi.org/10.60555/gz0q-b577) | [10.1016/j.combustflame.2015.01.012](https://doi.org/10.1016/j.combustflame.2015.01.012) |
| PSI-102 | SAME-SAMER | [10.60555/gd4k-8h62](https://doi.org/10.60555/gd4k-8h62) | [10.1016/j.firesaf.2018.04.004](https://doi.org/10.1016/j.firesaf.2018.04.004) |
| PSI-DAFT | DAFT / DAFT-2 | [https://psi.nasa.gov](https://psi.nasa.gov) | [https://psi.nasa.gov](https://psi.nasa.gov) |
| PSI-FM2-LUCI | FM2 & LUCI (Planned Lunar) | [https://ntrs.nasa.gov/api/citations/20240015307/downloads/Glenn_2024_ZayacPoster.pdf](https://ntrs.nasa.gov/api/citations/20240015307/downloads/Glenn_2024_ZayacPoster.pdf) | [https://ntrs.nasa.gov/api/citations/20240015307/downloads/Glenn_2024_ZayacPoster.pdf](https://ntrs.nasa.gov/api/citations/20240015307/downloads/Glenn_2024_ZayacPoster.pdf) |

The combined BASS, Saffire, FLEX, and ACME rows cover multiple experiments; FM2 and LUCI occupy one combined row. DAFT has a general PSI link rather than a confirmed dataset DOI. The supplied snapshot marks 14 groups completed and FM2/LUCI planned. NASA's later LUCI publication describes simulated-lunar experiments, so the snapshot must not be read as the current status of both projects.

### NASA reports, standards, and context

- [NASA PSI / Biological and Physical Sciences data](https://science.nasa.gov/biological-physical/data/) and [PSI entry point](https://psi.nasa.gov): catalogue access and research context.
- [NASA PSI repository update, July 2025](https://science.data.nasa.gov/features-events/physical-sciences-informatics-updates): archive scale; about 30 TB across physical sciences at that date. The brief's 12 TB combustion subset is unverified.
- [NTRS 20260003925](https://ntrs.nasa.gov/citations/20260003925), *Impacts of Reduced Pressure Atmospheres on ECLSS Architectures*: exploration-atmosphere material challenges; results are scoped to the assessed subsystems.
- [NTRS 20260001600](https://ntrs.nasa.gov/citations/20260001600): retained supplied Saffire/FDS reference. Its title and contents were not independently retrieved during this submission check; do not cite it as validation of PyroZero.
- [NTRS 20240015307](https://ntrs.nasa.gov/citations/20240015307), *Flammability of Materials on the Moon*: FM2 motivation, planned environments, and simulated-lunar observations.
- **NP-2015-10-034-JSC**, *A Researcher's Guide to International Space Station Combustion Science*: research guide named in the supplied source catalogue. The identifier is retained; full-text checking was not completed in this pass.
- [NASA-STD-6001B with Change 2](https://standards.nasa.gov/sites/default/files/standards/NASA/B-w/CHANGE-2/2/NASA-STD-6001B-w-Change-2_Admin-Change.pdf): flammability/offgassing/compatibility context. PyroZero's virtual screen does not perform this physical test or grant approval.
- [JSC 29353D](https://standards.nasa.gov/node/1404), *Flammability Configuration Analysis for Spacecraft Applications*: configuration-analysis guidance. It does not extend the cabin specimen surrogate to propulsion or high-pressure oxygen systems.
- [NASA LUCI flight summary](https://www.nasa.gov/stmd-flight-opportunities/flight-summaries/lunar-gravity-simulation-via-suborbital-rocket/) and [NTRS 20250010653](https://ntrs.nasa.gov/citations/20250010653): newer partial-gravity context beyond the bundled snapshot.

DOIs and supplied numerical records are retained with qualifications in `src/data/evidence-provenance.json`. DOI identity, experimental validity, and suitability for a new mission are separate questions. See [submission source notes](SUBMISSION_SOURCE_NOTES.md).

## 4. Tools, Coding Languages, Hardware & AI Used

- **TypeScript / JavaScript:** deterministic physics, ranking, data adapters, retrieval, streaming, and browser QA scripts.
- **Next.js 16 App Router + React 19:** application UI and server-side `POST /api/copilot` endpoint.
- **Tailwind CSS 4 toolchain + application CSS:** typography, responsive layouts, themes, and component styling.
- **Three.js:** inspectable technology-transfer demonstrations with linked controls, particle transitions, pause, reduced-motion behavior, and fallback states.
- **Vitest:** equation conformance, material/scenario state, API behavior, grounding, and expiry-boundary checks.
- **DeepSeek API:** optional generated explanations via the `deepseek-chat` alias. The deployed alias is configurable and is not a guaranteed pinned DeepSeek V3 release. No model training or fine-tuning is claimed.
- **In-memory Hybrid GraphRAG:** entity/unit extraction, two-hop traversal, curated source retrieval, deterministic computation, and optional provider synthesis. No external vector database is required.
- **OpenAI Codex:** coding assistance, implementation, debugging, documentation, browser automation, and test orchestration. AI-assisted claims are checked against the source and model boundaries documented here.
- **GitHub + Vercel:** public source and native Next.js deployment; the earlier Sites Worker remains an alternative host target.
- **Headless Chrome/Edge:** responsive interaction checks, WebGL checks, screenshots, and printable-deck verification.
- **Hardware:** ordinary development/browser hardware; no physical combustion apparatus, spacecraft hardware, detector prototype, or new sensor measurements were produced by this project.

A server-only DeepSeek key supports a fixed seven-day shared demo window. The server stops using that shared key at the published deadline; visitors can then supply their own DeepSeek keys. Keys are excluded from Git. The physics workspace and labelled reference answers remain available without a provider key.
