# Master v3 physics audit

Audited the existing implementation before making changes, against the complete user-supplied `pyrozero_master_codex_specification.md`, sections 2, 3 and 5, and the accompanying November 14, 2026 expansion directive.

## Audit findings and implementation

| Requirement | Before this audit | Final implementation |
| --- | --- | --- |
| Six exact LOC/spread coefficient sets | Present; some coefficient types were optional | All six sets preserved exactly; required `MaterialPhysicsParams` fields are explicitly typed |
| Temperature, ion current, Chattock gravity, Gr, buoyancy, Re and Da | Present | Preserved and checked against the supplied executable |
| Two-branch LOC, reference LOC and NOMS | Present | Preserved, including the executable's temperature-independent 1g reference velocity |
| Thick/thin spread, duration, burn length and status | Present | Preserved without calibration changes |
| Morphology, CSI and color thresholds | Present | Preserved |
| `oxygenPartialPressurePsia` | Missing | Added exactly as `round2(pressureKPa * 0.1450377 * oxygenPct / 100)` |
| `CANONICAL_MISSIONS` / `MissionProfileTarget` | Missing | Added exact canonical values and object-shaped weights; existing UI presets retained |
| Canonical `PsiInvestigationSummary[]` ranking signature | Missing | Added as an overload; existing snake-case dataset and adjustable-slider API retained |
| Nested ranking `subScores` | Missing | Added alongside existing flat score fields |
| Complete usable predictions | Present | Every material has live predictions; no unresolved or missing-closure flags |

The canonical ranking overload uses supplied object weights directly, as the master executable does. The existing UI overload preserves its established auto-normalization of slider weights. Both use Gaussian envelope distances, the high-oxygen bonus, the partial-gravity scaling bonus, and the exact fuel-phase scores. Equal rounded-score ties retain input order, as in the master executable.

## Independent executable comparison

Extracted the master file's entire TypeScript block and executed it as an independent reference. Compared all supplied numeric, color, status and curve outputs against the app over **3,456** combinations: six materials × four gravities × four pressures × four oxygen percentages × three ventilation speeds × three electric fields. Every compared output matched exactly, including two-decimal oxygen partial pressures and 51-point LOC curves. The four canonical MCDA mission results also matched exactly for a mixed solid/gas/emulator reference matrix.

The only intentionally different supplied output is the recommendation wording. The app identifies PASS/FAIL as a **virtual model result**, retains the burn-length, debris-risk and MUA/firebreak details, and does not assert physical NASA certification or open-cabin approval. Tests are in `tests/physics-supplement.test.ts`, `tests/supplemental-conformance.test.ts`, and `tests/master-physics.test.ts`; full build verification is tracked by the task's QA agent.

## Source conflicts preserved explicitly

1. **Oxygen domain:** section 2 prose describes 10–100% oxygen; the section 5 input comment and section 6 UI specify 13–85%. The reference code silently clamps mole fraction to 0.10–1.00, while its ignition condition still compares the raw percentage. The app retains the explicit **13–85% validated input domain**, accepts both pressure spelling conventions, defaults an omitted electric field to zero, and rejects invalid inputs instead of silently altering them. No claim of validated predictions at pure oxygen is made.
2. **EVA partial pressure:** the master table lists an 85% oxygen proxy at 29.6 kPa beside a 4.30 psia oxygen partial pressure. Its executable gives **3.65 psia** for that proxy. About **4.30 psia** applies to a separate 100% oxygen / 4.3 psia reference, not the 85% proxy. The live engine returns the executable value.
3. **SIBAL calibration claim:** the unchanged supplied coefficient 0.452 and supplied equations produce an unrounded **2.9155391737523693 mm/s**, returned as **2.916 mm/s**, at 0g / 100 kPa / 21% oxygen / 20 cm/s. The report observation is **2.03 mm/s**. This is a **43.62%** discrepancy, retained and tested rather than hidden by retuning. Calculated LOC is 18.01%, predicted burn 26.2 cm, status FAIL.
4. **Nomex and lunar PMMA:** Nomex at 0g / 54.1 kPa / 31.9% oxygen / 20 cm/s returns LOC **34.82%**, zero spread, PASS. Lunar PMMA at 0.165g / 56.5 kPa / 34% oxygen / 10 cm/s returns LOC **17.19%**, spread **1.573 mm/s**, burn **30 cm**, FAIL. These match the supplied executable.
5. **Approximate mission table velocities:** the table's rounded lunar velocity of 12.8 cm/s differs from the executable's oxygen-temperature-corrected active velocity of **13.30 cm/s**. Canonical MCDA deliberately uses its separate temperature-independent mission-flow proxy. These definitions remain distinct.
6. **Unphysical extrapolated LOC:** the supplied Beta/PBI correlation can exceed 100% oxygen at low pressure. The engine preserves the exact mathematical output and labels this extrapolation; it does not turn it into an experimental safety claim.
7. **Test 4 scope:** the supplied executable implements a bulk-material Test 1-inspired screen, not an electrical-wire Test 4 model. The separate physical-test limitation remains explicit. Completing the executable does not fabricate wire-qualification evidence.

## Scientific source checks

- NASA's [2017 Test 1 sample-length investigation](https://ntrs.nasa.gov/citations/20170004702) confirms that the actual physical test assesses self-extinguishment within 15 cm and flaming material transfer. It does not establish that this project's fixed-duration surrogate certifies material use.
- The official [JSC 29353D scope](https://standards.nasa.gov/standard/JSC/JSC-29353) concerns configuration analysis in crew breathing environments and excludes propulsion and high-pressure oxygen systems. Apollo 13's cryogenic oxygen tank must not be treated as a validated habitat-screen scenario.
- NASA's [oxygen concentration versus partial-pressure study](https://ntrs.nasa.gov/citations/20160001047) reports that equivalent oxygen partial pressure alone does not establish equivalent material flammability. The partial-pressure telemetry is a comparison quantity, not a safety equivalence.
- NASA's [Moon-to-Mars exploration-atmosphere presentation](https://ntrs.nasa.gov/citations/20240003211) discusses the 8.2 psia / 34% oxygen exploration case. The [FM2 description](https://ntrs.nasa.gov/citations/20240015307) describes the lunar-gravity laboratory and its target atmospheres; it does not independently validate this project's numerical surrogate coefficients.

All coefficients remain attributed to the user's master research specification. Source support for broad mechanisms, mission atmospheres or physical-test requirements is distinct from independent validation of every project correlation.
