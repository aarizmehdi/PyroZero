# PyroZero — seven-slide NASA judging deck

**Zentrix Labs · v2.6 · Flame in Freefall**

[Live 16:9 deck](https://pyrozero.vercel.app/pyrozero-pitch-deck.html) · [PDF](https://pyrozero.vercel.app/pyrozero-pitch-deck.pdf) · [Demo](https://pyrozero.vercel.app) · [GitHub](https://github.com/aarizmehdi/PyroZero)

Exactly seven slides, including the cover. The HTML uses the original logo, product captures, self-hosted fonts, mobile reading layout, and seven-page print CSS.

## Slide 1 — PyroZero

Microgravity evidence. Exploration insight. Turning decades of combustion research into inspectable fire-safety trade studies for Moon and Mars habitats. pyrozero.vercel.app ↗ github.com/aarizmehdi/PyroZero ↗ PyroZero v2.6 · Engineered by Zentrix Labs, R&D division of Zentrix Edge 2026 NASA International Space Apps Challenge · Independent research prototype

**Presenter notes:** Open with the research question: does a material behave the same way when gravity, ventilation, and oxygen change? PyroZero makes the evidence and assumptions inspectable. This is not operational flight approval.

**Sources:** Original project identity and live URLs.

---

## Slide 2 — The lunar fire trap

The lunar fire trap Earth-test behavior can change in a reduced-gravity, oxygen-enriched environment. 34 % O₂ At 8.2 psia / 56.5 kPa. About 62% higher oxygen fraction than 21% air. 0.165 g Enough buoyant flow to replenish oxygen, with less convective heat loss. 70 % Of subsystems assessed in one NASA ECLSS study require material replacement. The research bottleneck Terabytes of PSI research must be matched to fuel, atmosphere, flow, and scale. Partial-gravity coverage remains sparse; simulated-lunar LUCI evidence already exists. NASA NTRS 20260003925; 20240015307; NASA PSI update (July 2025); LUCI flight summary. Some cool-flame regimes in the supplied records are near 800 K; flame appearance alone is not a safety test.

**Presenter notes:** The 70% finding is limited to assessed ECLSS subsystems. The brief’s 12 TB figure is not independently established; NASA reported about 30 TB across the wider PSI archive in July 2025. Do not claim zero lunar-gravity experiments: LUCI has simulated-lunar results. Atmospheric oxygen fraction and oxygen partial pressure are different quantities.

**Sources:** [ntrs.nasa.gov](https://ntrs.nasa.gov/citations/20260003925), [ntrs.nasa.gov](https://ntrs.nasa.gov/citations/20240015307), [science.data.nasa.gov](https://science.data.nasa.gov/features-events/physical-sciences-informatics-updates), [www.nasa.gov](https://www.nasa.gov/stmd-flight-opportunities/flight-summaries/lunar-gravity-simulation-via-suborbital-rocket/)

---

## Slide 3 — Four modules. One inspectable workflow.

Four modules. One inspectable workflow. 01 Mission Explorer Rank 15 research groups with explicit priorities. 02 Partial-g Lab Compare six materials using supplied equations. 03 Forensics & Spinoffs Connect incident records and engineering lessons. 04 GraphRAG Copilot Ask questions and inspect cited explanations. Retrieve Two-hop evidence graph → Compute Deterministic physics and ranking → Explain DeepSeek streaming + completion checks Numerical tables come from code. Citation and numerical checks constrain generated prose; they do not guarantee correctness.

**Presenter notes:** Show that the copilot never asks the LLM to supply the material table. Retrieval, deterministic computation, and optional explanation have separate roles. The ranking uses supplied AHP-style priority vectors and Gaussian MCDA; it is not a NASA-approved score. The graph is in-memory and the catalogue is curated, not a full raw-data ingestion.

**Sources:** [github.com](https://github.com/aarizmehdi/PyroZero/tree/main/src/lib)

---

## Slide 4 — Bridging the partial-gravity gap

Bridging the partial-gravity gap Change a condition. Inspect the modeled boundary. See where evidence is still missing. Uₘ = √(V² forced + V² buoyant ) Track Gr, Re eff , Da and an E-FIELD ion-drag equivalent g eff . NOMS = max(0, LOC₁g − LOC mission ) 1.54 oxygen percentage points Modeled lunar PMMA example: 0.165g, 56.5 kPa, 34% O₂, 10 cm/s, zero field. The supplied quench and blowoff closures form a check-mark LOC boundary. A transparent surrogate helps prioritize questions. Qualification still requires representative physical tests. Inputs, constants, and outputs: src/lib/pyrozero-engine.ts and docs/submission-benchmarks.json. E-FIELD analogy is a supplied engineering closure, not measured replacement gravity.

**Presenter notes:** NOMS is the difference between modeled LOC values, not ambient O2 minus LOC. It varies with material and conditions; the brief’s 1.4–2.7 range is not universal. Electric body-force mapping is an equivalent-flow comparison. The model does not reconstruct all direction, geometry, or chemistry effects of a real partial-gravity experiment.

**Sources:** [github.com](https://github.com/aarizmehdi/PyroZero/blob/main/src/lib/pyrozero-engine.ts), [ntrs.nasa.gov](https://ntrs.nasa.gov/citations/20240015307)

---

## Slide 5 — A reproducible product walkthrough

A reproducible product walkthrough Choose a mission and material, inspect the screen, then ask why. Material and complete input Model output What it establishes Cast PMMA 0.165g · 56.5 kPa · 34% O₂ · 10 cm/s FAIL 1.573 mm/s · 30.0 cm burn Scenario calculation; not material-use approval. Nomex HT90 0g · 54.1 kPa · 31.9% O₂ · 20 cm/s PASS 0.000 mm/s · LOC 34.82% Consistent with the supplied Saffire-VI observation. SIBAL fabric 0g · 100 kPa · 21% O₂ · 20 cm/s 2.030 mm/s 18.3 cm burn · model FAIL One-point calibration with spreadCoeff = 0.3147. Copilot “Compare PMMA and Nomex on the Moon.” Read computed values, source links, and an optional generated explanation. All examples use zero electric field. Results generated from the current engine; calibration and agreement with a supplied observation are not independent experimental validation.

**Presenter notes:** Suggested live demo: Explorer lunar profile; choose PMMA in the visible selector; inspect the Lab; ask a named-material question in the Copilot; open a citation and its calculation link. SIBAL calibration locks one reported point only. Nomex is below the modeled LOC at this input, which explains the inactive flame. PASS is a virtual screen label.

**Sources:** [github.com](https://github.com/aarizmehdi/PyroZero/blob/main/docs/submission-benchmarks.json), [pyrozero.vercel.app](https://pyrozero.vercel.app)

---

## Slide 6 — Space lessons, Earth applications

Space lessons, Earth applications Apollo 1 · Apollo 13 · Mir Trace discrete report anchors, fuel context, containment, ignition, and detection lessons. Artemis II appears separately as an annotated smoke-alarm case. It is not treated as a confirmed spacecraft fire. Fine water mist Supplied D₁₀ = 28 μm and D₃₂ = 46 μm references. Explore surface area and droplet diameter. Potential: compact suppression systems. 650 nm particle optics Polarization and multiple scattering angles help explain dust, smoke, and mist discrimination. Potential: demanding industrial environments. 4,500 psi composite SCBA Compare stored air with legacy cylinders; distinguish PBI turnout fabrics from Beta cloth. Potential: firefighter protection research. Demonstrations and potential applications—not CFD, certified detectors, fire-extinguisher approval, or SCBA service-duration guarantees. Li-ion/data-center and mine use require dedicated testing.

**Presenter notes:** Avoid claiming all technologies were directly caused by each accident. The workbench compares engineering principles and source context. Water-mist moments do not uniquely define a droplet distribution. Optical depolarization examples are not a calibrated classifier. Ideal free-air estimates do not determine actual breathing duration. New terrestrial products and commercialization are future research, not completed deployments.

**Sources:** [github.com](https://github.com/aarizmehdi/PyroZero/blob/main/src/data/psi_combustion_knowledge_base.json), [github.com](https://github.com/aarizmehdi/PyroZero/blob/main/src/data/evidence-provenance.json)

---

## Slide 7 — Verified software. A clear next step.

Verified software. A clear next step. 145 automated tests including expiry boundaries 4,608 bounded model combinations checked for consistency 4 × 2 workspaces and themes with desktop/mobile QA Available now Public GitHub source, Vercel deployment, 15-group catalogue, transparent equations, and optional DeepSeek answers. Next: evidence coverage Separate and update FM2/LUCI records; ingest published data with unit, geometry, and uncertainty checks. Next: independent validation Compare against withheld experiments and obtain combustion-specialist review before operational use. Explore the evidence. Inspect the assumptions. pyrozero.vercel.app ↗ Zentrix Labs · Research prototype. Potential audiences include agency and commercial habitat teams; no NASA, SpaceX, or Blue Origin customer relationship is claimed.

**Presenter notes:** Software verification means equation conformance, bounds, API behavior, and UI function—not independent physical validation. This release adds 7 expiry tests to the prior 138. Shared demo access has a fixed server deadline, after which visitors can use their own DeepSeek key. Future hosted service scaling needs authentication, quotas, observability, and independent scientific review; do not present it as an existing enterprise SaaS capability.

**Sources:** [github.com](https://github.com/aarizmehdi/PyroZero/blob/main/docs/release-verification-material-flow.md), [github.com](https://github.com/aarizmehdi/PyroZero/blob/main/tests/shared-access.test.ts)

## Rebuild

Edit `docs/pitch-deck-content.json`, run `node scripts/build-pitch-deck.mjs`, then regenerate the PDF with the browser verification script against a running server. Primary-source qualifications are recorded in `SUBMISSION_SOURCE_NOTES.md`.
