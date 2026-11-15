# PyroZero independent physics audit

Audit date: 2026-11-14. Scope: the initial orchestration directive, supplemental research payload, final user-supplied executable closures, deterministic engine, and selected official NASA historical sources. This is a software and scientific-consistency review; it does not represent NASA employment, approval, or material qualification.

## Finding and interpretation

The final executable specification supplies the six material coefficient sets, thick/thin spread equations, burn durations, and morphology correlations. These complete the earlier payload's Damköhler parameterization, four AHP weight vectors, Gaussian MCDA functions, mission fan speeds, and thermophysical properties. The implementation reproduces the supplied equations and rounding. Exact reproduction of a supplied report and independent validation of its scientific claims are different verification gates.

All six LOC, spread, burn, and morphology computations are available. Their coefficients originate in the user-supplied executable and have not all been independently established as NASA correlations. PASS/WARNING/FAIL labels are virtual model outputs; they cannot establish NASA material qualification. The engine separately preserves reported measurements and computes the supplied closures without adjusting them to force agreement with those measurements.

## Equation and units review

| Quantity | Required implementation | Audit finding |
| --- | --- | --- |
| Temperature | `TfAir * (1 + 0.185 * ln(oxygenPct / 21))` | Oxygen percentage ratio is equivalent to the mole-fraction ratio. The equation is a supplied surrogate, not a resolved chemical-equilibrium flame-temperature solver. |
| Reference pressure | `101.325 kPa` | Supplemental physical reference supersedes the initial `101.3` reference. Nominal ISS mission pressure remains `101.3 kPa`. |
| Current density | Quadratic below `1 kV/cm`, supplied quadratic continuation above it | Continuous at saturation. Above saturation the supplied formula increases; “post-saturation” does not mean constant current. `1 kV/cm = 100,000 V/m`, but the empirical current law takes the dimensionless field ratio, so an additional SI conversion there would be erroneous. |
| Equivalent gravity | `gAmbient + j / (K0*rho0*(1-Tinf/Tf)*g0)` | Returns multiples of Earth gravity. `j/K0` has units of force per volume; division by density yields acceleration, then division by `g0` yields a dimensionless gravity fraction. Pressure cancellation follows the supplied common pressure scaling of mobility and density. |
| Grashof number | `gEffective*g0*(Tf-Tinf)*Lc^3/(Tinf*nu0^2)*(P/P0)^2` | The leading acceleration is in `m/s²`; omitting `g0` when the input is a gravity fraction would be a unit error. |
| Buoyant velocity | Supplied `25 * sqrt(gEffective*(Tf-Tinf)/(2365-Tinf))*(P/P0)^(1/3)` | Output is `cm/s`. The `25` coefficient embeds a calibration and the unit conversion. It is not a universal buoyancy law. |
| Mixed velocity | `hypot(vForced, vBuoyant)` | Both inputs must be in `cm/s`. Treating the square-root law as universally valid for arbitrarily aligned flows would exceed the supplied surrogate's scope. |
| Reynolds numbers | `(velocityCms/100)*0.05/1.57e-5*(P/P0)` | `cm/s` must be divided by 100 before use with metre-based length and viscosity. Applies separately to forced and mixed velocities. |
| Flow time | `1.2/(vEff + 1.5/(P/P0))` | Reacting length is `1.2 cm`, so seconds follow with velocities in `cm/s`. This reacting length differs from the `5 cm` length used by Gr/Re. Finite diffusion avoids division by zero in quiescent microgravity. |
| Chemical time | `0.008*(P0/P)^0.8*(21/oxygenPct)^1.5*exp(12000/Tf-12000/2365)` | Seconds. The `12000` activation-temperature constant has units of kelvin. This supersedes the first engine's separately assumed Arrhenius closure. |
| Damköhler number | `flowTimeS / chemicalTimeS` | Dimensionless. Finite positive times are required throughout the supported input envelope. |
| LOC and NOMS | Supplied two-branch equation; NOMS is `max(0, LOC1gReference-LOCactive)` | LOC values and NOMS are percentage points of oxygen, not fractional mole units. A LOC above 100% represents no propagation within physically realizable oxygen fractions under the surrogate. |

The supplemental viscosity paragraph includes a film-temperature correction, while its explicit Gr and Reynolds equations use `nu0` and pressure scaling. The code follows the explicitly parameterized equations; it must not claim to apply the omitted film-temperature correction.

The supplemental centrifuge identity has a sign error: for a radial vector perpendicular to the rotation axis, `-ω × (ω × r) = +ω²r` points outward. The stated `-ω²r` is the inward centripetal acceleration. PyroZero's scalar ambient-gravity model does not use this vector identity.

## Internal numerical discrepancies

1. **One kilovolt per centimetre is approximately, rather than exactly, 1g.** At `Tf = 2365 K`, the stated constants and `j = 1.70e-3 A/m²` yield approximately `0.985g` equivalent acceleration. Exact lunar/Mars current densities should be computed from the equation. The prose current benchmarks are rounded. The implementation should preserve the formula rather than alter coefficients to force a `1.000g` display.
2. **Nominal mixed-flow values are not independent inputs.** Lunar, Mars, and EVA values in the mission table are approximate summaries. Active simulator flow follows the temperature- and pressure-dependent formula for the selected material. The supplied executable intentionally defines a separate temperature-independent mission-flow proxy for MCDA; neither calculation is overwritten by the nominal table values.
3. **Droplet moments do not define an exact lognormal distribution.** Moment diameters satisfy `D32 = D30³ / D20²`; the reported `36` and `32 µm` give `45.5625 µm`, consistent with a rounded `46 µm`. If `D10=28` and `D20=32 µm` define an exact lognormal, they instead imply `D30≈36.57` and `D32≈47.77 µm`. Retain all four reported rounded values, but identify a displayed spectrum as an illustrative fit, not a recovered PDA measurement.
4. **Water/nitrogen mass ratio is not the stored mass ratio.** `1.2 lb / 6 lb = 0.20`, while the supplied gas-to-liquid ratio is `0.15`. These can describe distinct stored and discharged quantities, but the payload does not explain the distinction. Neither number should silently replace the other.
5. **Saffire CO₂ mass conflicts within the report.** The narrative states `128.1 g`; the verbatim JSON states `130.3 g`. Canonical JSON fidelity retains `130.3`; the disagreement remains unresolved evidence rather than a new inferred measurement.

## Final executable closures and benchmark comparison

The final closure table is implemented without interpolation between reported LOC observations. Its rows are `[thin, LOCtrough, Δquench, Vquench, Vopt, slope, Tfair, Tp, spreadCoefficient, drips]`:

| Material | Exact supplied row |
| --- | --- |
| PMMA | `[false,13.6,3.2,1.2,2.5,.16,2365,579,.0042,true]` |
| SIBAL | `[true,16.2,2.8,1.5,4,.11,2150,610,.452,false]` |
| Nomex | `[true,28.5,3.5,2,5,.14,2100,720,.195,false]` |
| Nylon Velcro | `[true,18.2,2.5,1.4,3.5,.12,2250,673,.58,true]` |
| PTFE | `[false,80,5,2,5,.25,2050,811,.0018,false]` |
| Beta/PBI | `[true,95,3,2,5,.20,1950,920,.0005,false]` |

Define `Θ=(Tf−Tp)/(Tp−298.15)` and `Φ=1−exp(−(O₂−LOCrounded)/2.5)`. Propagation is zero when oxygen does not exceed the LOC rounded to two decimals. Otherwise, thick spread is `C * Veff * (P/P0) * Θ² * Φ`. Thin spread is `C * sqrt(P/P0) * sqrt(max(.2,Veff)/20) * Θ^1.5 * exp(−Vq/max(.2,Veff)) * exp(−(Veff/Vblow)²) * Φ`, with `Vblow=28*max(.1,(XO₂−.13)/(.173−.13))^1.4`.

Spread is rounded to three decimals **before** burn-length calculation. Thin duration is 90 seconds; thick duration is 300 seconds. Burn length is capped at 30 cm and rounded to one decimal. Aspect ratio and soot index follow the final supplied empirical proxies, rounded to two decimals; they are schematic correlations rather than resolved CFD.

| Original benchmark conditions | Exact final computed result | Comparison |
| --- | --- | --- |
| SIBAL, `0g,100 kPa,21% O₂,20 cm/s` | `LOC18.01%,spread2.916 mm/s,burn26.2 cm` | Conflicts with the reported `2.03 mm/s` reference by approximately 43.6%. Coefficient `.452` remains unchanged. |
| Nomex, `0g,54.1 kPa,31.9% O₂,20 cm/s` | `LOC34.82%,spread0,burn0,PASS` | Consistent with the requested non-ignition check. |
| PMMA, `.165g,56.5 kPa,34% O₂,10 cm/s` | `LOC17.19%,spread1.573 mm/s,burn30 cm,FAIL` | Consistent with the requested propagation check. |

The SIBAL discrepancy is an unresolved disagreement between two supplied requirements, not a software coefficient adjustment opportunity. A passing exact-specification conformance test does not imply agreement with all experimental references. Historical qualification strings embedded in the dataset remain supplied claims, not certifications issued by the app.

The executable's 1g reference uses `Vb=25*(P/P0)^(1/3)` without the active model's temperature correction. NOMS therefore follows that exact reference even though the displayed Earth marker uses the temperature-corrected marker equation. The LOC plot brackets the actual reference LOC used by NOMS, rather than treating the Earth marker as an identical reference at every temperature.

Reported physical properties not used by these supplied empirical closures remain preserved without fabricated supplementary values. In particular, the thin-fabric areal masses are retained directly, with no need to invent fabric thicknesses or bulk densities.

## Mission ranking audit

The four supplied weight vectors are locked to `[.20,.15,.30,.20,.15]`, `[.35,.25,.15,.15,.10]`, `[.30,.25,.20,.15,.10]`, and `[.45,.25,.10,.15,.05]`. They sum to one. Sliders may renormalize explicit user changes. Ranking fuel affinity is phase-based under the supplemental definition: solid and pyrolysis aerosol `100`, condensed-phase gas emulator `85`, and gas/liquid droplet `65`. It is not a material-name match score.

Oxygen and pressure use squared interval distance in Gaussian exponents; oxygen receives a multiplicative `1.15` bonus when the tested upper bound reaches 30%, capped at 100. The final executable's ranking flow is `hypot(Vforced,25*sqrt(gAmbient)*(P/P0)^(1/3))`; it intentionally omits material temperature and electric-field effects present in the active simulator. Flow adds 20 for a positive-gravity scenario with a buoyancy-scaling investigation, capped at 100. Sub-scores and the composite score are rounded to one decimal, with the composite computed from unrounded sub-scores. Composite score expresses investigation relevance, not safety or statistical confidence.

## Historical evidence checks

**Apollo 1:** NASA's review report supports the first fire transmission at `23:31:04.7`, rupture near `23:31:19.4`, and telemetry loss at `23:31:22.4`. It also describes pressure-transducer saturation before rupture, making a completely measured second-by-second pressure curve unavailable. Ignition origin is a probable location rather than a uniquely established wire. [Apollo 204 Review Board](https://www.nasa.gov/missions/apollo/apollo-1/report-of-the-apollo-204-review-board/).

NASA's chronology reports a rupture pressure estimate of `29–37.7 psia` and an estimated average gas temperature exceeding `644 K`. Thus `644 K` must not be represented as an exact measured peak. [Apollo Spacecraft Chronology, volume IV](https://www.nasa.gov/wp-content/uploads/2023/03/sp-4009vol4.pdf).

**Apollo 13:** NASA places fan current application at `055:53:20` and almost complete telemetry loss at `055:54:53.555` for `1.8 s`. Those anchors are separated by `93.555 s`. A supplied `69 s` combustion duration cannot be substituted for the complete fan-to-rupture interval without a separately specified burn onset. [Apollo 13 mission chronology](https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_13a_Summary.htm). NASA also confirms that ground equipment supplied `65 V` to the detanking operation. [Apollo 13 review-board history](https://www.nasa.gov/history/50-years-ago-apollo-13-review-board-report/).

**Mir:** NASA's retrospective identifies the event as February 24, describes a flame lasting several minutes, and treats latex contamination as the most likely cause after investigation. It supports several hours of atmospheric cleanup. It does not establish an exact 14-minute burn or continuous temperature trace. [NASA Mir fire retrospective](https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/). A NASA incident digest instead lists February 23 and approximately 90 seconds, so reported date/duration conflicts must remain explicit. [NASA incident digest](https://ntrs.nasa.gov/api/citations/20100014847/downloads/20100014847.pdf?attachment=true).

Interpolated playback arrays are reconstructions between reported anchors, not historical telemetry. Apollo 13's supercritical oxygen pressure and pure oxygen also lie outside the simulator's `29.6–202.6 kPa`, `13–85% O₂` domain. A bounded proxy may be loaded with a visible notice; it cannot simulate the tank rupture physics.

## Verification gate

`tests/supplemental-conformance.test.ts` independently calculates the supplied dimensionless equations, current-gravity relation, mission weights, Gaussian scores, phase affinity, all six material closures, intermediate rounding, burn duration, and morphology. It locks the SIBAL supplied observation and computed value separately, exposing their disagreement. The broader project suite covers input bounds, graph/data coverage, build, lint, and type checking. Passing software checks establish implementation conformance, not independent NASA validation or experimental agreement of every coefficient.
