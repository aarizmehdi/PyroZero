/**
 * PyroZero deterministic engineering surrogate, version 1.
 * Equations for Tf, ion drag, Gr, buoyant velocity and LOC are supplied by the
 * project brief and supplemental report; their coefficients are not established
 * NASA correlations. Supplemental Da, Gaussian MCDA and AHP weights are exact.
 * The later user-supplied executable specification provides all LOC, spread,
 * burn-duration and morphology closures; those values are reproduced exactly. Results are neither certification nor
 * a replacement for NASA-STD-6001B physical testing.
 */
export type MaterialId = 'MAT-PMMA-CAST' | 'MAT-SIBAL' | 'MAT-NOMEX-HT90' | 'MAT-VELCRO-NYLON' | 'MAT-PTFE-TEFLON' | 'MAT-BETA-PBI';
export type Weights = [number, number, number, number, number];
export interface SimulationInput {
  materialId: MaterialId;
  gravityG: number;
  pressureKpa: number;
  pressureKPa?: number;
  oxygenPct: number;
  forcedFlowCms: number;
  electricFieldKvCm: number;
}
export interface MaterialPhysicsParams {
  isThermallyThin: boolean;
  locTrough0Pct: number; deltaXQuenchPct: number; vQuenchCms: number;
  vOptCms: number; slopeBlowoffPctPerCms: number;
  tfAirK: number; tpK: number; spreadCoeff: number; dripsOrBubbles: boolean;
}
export interface MaterialParams extends MaterialPhysicsParams {
  name: string; shortName: string; thermalRegime: 'thick' | 'thin';
  densityKgm3?: number; heatCapacityJkgK?: number;
  conductivityWmK?: number; areaDensityKgm2?: number;
  evidence: string;
  reportedLimits: Record<string, number | string>;
}

export const PHYSICS_CONSTANTS = {
  g0: 9.80665, tInfinityK: 298.15, referencePressureKpa: 101.325,
  ionMobilityM2Vs: 1.7e-4, referenceDensityKgm3: 1.184,
  kinematicViscosityM2s: 1.57e-5, characteristicLengthM: 0.05,
  saturationFieldKvCm: 1, saturationCurrentAm2: 1.7e-3,
  specimenLengthCm: 30, passLengthCm: 15,
} as const;

export const MODEL_PROVENANCE = {
  status: 'User-supplied research report implemented verbatim where specified; not independently NASA validated',
  supplied: ['oxygen temperature shift', 'piecewise ion-current density', 'Chattock equivalent gravity', 'Grashof number', 'buoyant and mixed velocities', 'parameterized Damkohler flow/chemical times', 'Gaussian MCDA and partial-gravity bonus', 'all four AHP weight vectors', 'reported thermophysical properties', 'two-branch LOC formula', 'Beta/PBI coefficient set'],
  assumed: [],
  missing: [],
  benchmark: 'Predictions execute the later supplied material coefficients and spread closures without benchmark retuning. Supplied observations remain separate from computed outputs.',
  standards: [
    { title: 'NASA-STD-6001B', url: 'https://standards.nasa.gov/standard/NASA/NASA-STD-6001' },
    { title: 'JSC 29353D', url: 'https://standards.nasa.gov/standard/JSC/JSC-29353' },
    { title: 'Test 1 sample-length investigation', url: 'https://ntrs.nasa.gov/citations/20170004702' },
  ],
} as const;

/** Exact master Section 5 closure table with supplemental material observations. */
export const MATERIAL_PARAMS: Record<MaterialId, MaterialParams> = {
  "MAT-PMMA-CAST": {
    "name": "Cast Polymethyl Methacrylate (PMMA / Acrylic)",
    "shortName": "Cast PMMA",
    "thermalRegime": "thick",
    "isThermallyThin": false,
    "tfAirK": 2365,
    "tpK": 579,
    "evidence": "Exact user-supplied supplemental report properties; independent NASA validation is tracked separately.",
    "reportedLimits": {
      "loc_0g_concurrent_pct": 13.6,
      "loc_0g_opposed_pct": 17.0,
      "loc_lunar_016g_pct": 15.1,
      "loc_1g_upward_pct": 18.0,
      "noms_o2_pct": 1.4,
      "nasa_std_6001_test1_34o2_82psia": "FAIL (Burns >15 cm, bubbling melt)"
    },
    "densityKgm3": 1190,
    "heatCapacityJkgK": 1400,
    "conductivityWmK": 0.19,
    "locTrough0Pct": 13.6,
    "deltaXQuenchPct": 3.2,
    "vQuenchCms": 1.2,
    "vOptCms": 2.5,
    "slopeBlowoffPctPerCms": 0.16,
    "spreadCoeff": 0.0042,
    "dripsOrBubbles": true
  },
  "MAT-SIBAL": {
    "name": "SIBAL Composite Fabric (75% Cotton / 25% Fiberglass)",
    "shortName": "SIBAL fabric",
    "thermalRegime": "thin",
    "isThermallyThin": true,
    "tfAirK": 2150,
    "tpK": 610,
    "evidence": "Exact user-supplied supplemental report properties; independent NASA validation is tracked separately.",
    "reportedLimits": {
      "loc_0g_concurrent_pct": 16.2,
      "loc_lunar_016g_pct": 15.8,
      "loc_1g_upward_pct": 18.5,
      "noms_o2_pct": 2.7,
      "spread_rate_0g_20cms_mms": 2.03,
      "spread_rate_lunar_downward_mms": 0.86,
      "nasa_std_6001_test1_34o2_82psia": "FAIL (Full consumption + smolder survival)"
    },
    "areaDensityKgm2": 0.1805,
    "locTrough0Pct": 16.2,
    "deltaXQuenchPct": 2.8,
    "vQuenchCms": 1.5,
    "vOptCms": 4,
    "slopeBlowoffPctPerCms": 0.11,
    "spreadCoeff": 0.3147,
    "dripsOrBubbles": false
  },
  "MAT-NOMEX-HT90": {
    "name": "Nomex HT90-40 (Meta-Aramid Fire-Resistant Fabric)",
    "shortName": "Nomex HT90-40",
    "thermalRegime": "thin",
    "isThermallyThin": true,
    "tfAirK": 2100,
    "tpK": 720,
    "evidence": "Exact user-supplied supplemental report properties; independent NASA validation is tracked separately.",
    "reportedLimits": {
      "loc_0g_54kpa_pct": 32.5,
      "loc_lunar_56kpa_pct": 31.2,
      "loc_1g_101kpa_pct": 29.0,
      "noms_o2_pct": 1.8,
      "saffire_vi_31_9_o2_result": "PASS (Did not ignite at 31.9% O2, 54.1 kPa)",
      "nasa_std_6001_test1_34o2_82psia": "WARNING (Borderline at 34-37% O2 Lunar SEA; requires MUA verification)"
    },
    "areaDensityKgm2": 0.24,
    "locTrough0Pct": 28.5,
    "deltaXQuenchPct": 3.5,
    "vQuenchCms": 2,
    "vOptCms": 5,
    "slopeBlowoffPctPerCms": 0.14,
    "spreadCoeff": 0.195,
    "dripsOrBubbles": false
  },
  "MAT-VELCRO-NYLON": {
    "name": "Nylon Hook-and-Loop Fastener (Velcro)",
    "shortName": "Velcro nylon",
    "thermalRegime": "thin",
    "isThermallyThin": true,
    "tfAirK": 2250,
    "tpK": 673,
    "evidence": "Exact user-supplied supplemental report properties; independent NASA validation is tracked separately.",
    "reportedLimits": {
      "loc_0g_pct": 19.5,
      "loc_lunar_016g_pct": 18.8,
      "loc_1g_upward_pct": 20.5,
      "jsc_29353d_limit": "Safe against propagation up to 36% O2 at 8.2 psia ONLY when bonded to metallic substrate with >=15 cm fire break",
      "nasa_std_6001_test1_34o2_82psia": "FAIL (Unbacked strips burn >15 cm and drip)"
    },
    "densityKgm3": 1140,
    "locTrough0Pct": 18.2,
    "deltaXQuenchPct": 2.5,
    "vQuenchCms": 1.4,
    "vOptCms": 3.5,
    "slopeBlowoffPctPerCms": 0.12,
    "spreadCoeff": 0.58,
    "dripsOrBubbles": true
  },
  "MAT-PTFE-TEFLON": {
    "name": "Polytetrafluoroethylene (PTFE / Teflon Wire Insulation & Sheet)",
    "shortName": "PTFE Teflon",
    "thermalRegime": "thick",
    "isThermallyThin": false,
    "tfAirK": 2050,
    "tpK": 811,
    "evidence": "Exact user-supplied supplemental report properties; independent NASA validation is tracked separately.",
    "reportedLimits": {
      "loc_0g_pct": 85.0,
      "loc_lunar_016g_pct": 83.0,
      "loc_1g_upward_pct": 95.0,
      "supercritical_o2_hazard": "Ignites at ~811 K (1000 F) in 883-1008 psia 100% O2 (Apollo 13 Tank #2); pyrolysis smoke missed 2/3 of time by ISS near-IR detector",
      "nasa_std_6001_test1_34o2_82psia": "PASS (Certified self-extinguishing in 34% O2 at 8.2 psia)"
    },
    "densityKgm3": 2150,
    "locTrough0Pct": 80,
    "deltaXQuenchPct": 5,
    "vQuenchCms": 2,
    "vOptCms": 5,
    "slopeBlowoffPctPerCms": 0.25,
    "spreadCoeff": 0.0018,
    "dripsOrBubbles": false
  },
  "MAT-BETA-PBI": {
    "name": "Beta Cloth (PTFE-Coated Fiberglass) & Black PBI Max",
    "shortName": "Beta cloth / PBI",
    "thermalRegime": "thin",
    "isThermallyThin": true,
    "tfAirK": 1950,
    "tpK": 920,
    "evidence": "Exact user-supplied supplemental report properties; independent NASA validation is tracked separately.",
    "reportedLimits": {
      "loc_0g_pct": 98.0,
      "loc_lunar_016g_pct": 96.0,
      "loc_1g_upward_pct": 100.0,
      "nasa_std_6001_test1_34o2_82psia": "PASS (Non-combustible fire barrier per JSC 29353D)"
    },
    "densityKgm3": 1850,
    "locTrough0Pct": 95,
    "deltaXQuenchPct": 3,
    "vQuenchCms": 2,
    "vOptCms": 5,
    "slopeBlowoffPctPerCms": 0.2,
    "spreadCoeff": 0.0005,
    "dripsOrBubbles": false
  }
};

export type MissionProfileId = 'ISS_TRANSIT_0G' | 'ARTEMIS_LUNAR_016G' | 'MARS_HABITAT_038G' | 'EVA_SPACESUIT_HIGH_O2';
export interface MissionProfile { id: MissionProfileId; name: string; shortName: string; input: SimulationInput; weights: Weights; note: string }
export const MISSION_PROFILES: Record<MissionProfileId, MissionProfile> = {
  ISS_TRANSIT_0G: { id: 'ISS_TRANSIT_0G', name: 'ISS transit', shortName: 'ISS transit', input: { materialId: 'MAT-PMMA-CAST', gravityG: 0, pressureKpa: 101.3, oxygenPct: 21, forcedFlowCms: 15, electricFieldKvCm: 0 }, weights: [0.20, 0.15, 0.30, 0.20, 0.15], note: 'Research preset; AHP weights reproduced from the supplied research report.' },
  ARTEMIS_LUNAR_016G: { id: 'ARTEMIS_LUNAR_016G', name: 'Artemis lunar habitat', shortName: 'Artemis lunar', input: { materialId: 'MAT-PMMA-CAST', gravityG: 0.165, pressureKpa: 56.5, oxygenPct: 34, forcedFlowCms: 10, electricFieldKvCm: 0 }, weights: [0.35, 0.25, 0.15, 0.15, 0.10], note: 'Proposed exploration atmosphere; not an operational mission specification.' },
  MARS_HABITAT_038G: { id: 'MARS_HABITAT_038G', name: 'Mars surface habitat', shortName: 'Mars habitat', input: { materialId: 'MAT-PMMA-CAST', gravityG: 0.38, pressureKpa: 56.5, oxygenPct: 34, forcedFlowCms: 10, electricFieldKvCm: 0 }, weights: [0.30, 0.25, 0.20, 0.15, 0.10], note: 'Hypothetical habitat research scenario; exact supplied-report AHP priorities.' },
  EVA_SPACESUIT_HIGH_O2: { id: 'EVA_SPACESUIT_HIGH_O2', name: 'EVA spacesuit loop', shortName: 'EVA loop', input: { materialId: 'MAT-BETA-PBI', gravityG: 0.165, pressureKpa: 29.6, oxygenPct: 85, forcedFlowCms: 25, electricFieldKvCm: 0 }, weights: [0.45, 0.25, 0.10, 0.15, 0.05], note: '85% O2 is a bounded proxy; pure-oxygen EVA conditions are outside this model.' },
};

/** Exact Section 5 mission target API; legacy UI presets remain available above. */
export interface MissionProfileTarget {
  profileId: string; gravityG: number; pressureKPa: number;
  oxygenPct: number; forcedFlowCms: number;
  weights: { o2: number; pressure: number; flow: number; fuel: number; scale: number };
}
export const CANONICAL_MISSIONS: Record<MissionProfileId, MissionProfileTarget> = Object.fromEntries(
  Object.values(MISSION_PROFILES).map(({ id, input, weights }) => [id, {
    profileId: id, gravityG: input.gravityG, pressureKPa: input.pressureKpa,
    oxygenPct: input.oxygenPct, forcedFlowCms: input.forcedFlowCms,
    weights: { o2: weights[0], pressure: weights[1], flow: weights[2], fuel: weights[3], scale: weights[4] },
  }]),
) as Record<MissionProfileId, MissionProfileTarget>;

const round = (value: number, digits: number) => Number(value.toFixed(digits));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export type OptionalElectricSimulationInput = Omit<SimulationInput, 'electricFieldKvCm'> & { electricFieldKvCm?: number };
export type CanonicalSimulationInput = Omit<SimulationInput, 'pressureKpa' | 'electricFieldKvCm'> & { pressureKPa: number; electricFieldKvCm?: number };
export type CompatibleSimulationInput = SimulationInput | OptionalElectricSimulationInput | CanonicalSimulationInput;
export function validateSimulationInput(rawInput: CompatibleSimulationInput): SimulationInput {
  if (!rawInput || typeof rawInput !== 'object') throw new RangeError('Simulation input must be an object.');
  const input = { ...rawInput, pressureKpa: 'pressureKpa' in rawInput ? rawInput.pressureKpa : rawInput.pressureKPa, electricFieldKvCm: rawInput.electricFieldKvCm === undefined ? 0 : rawInput.electricFieldKvCm } as SimulationInput;
  if (!input || !Object.hasOwn(MATERIAL_PARAMS, input.materialId)) throw new RangeError('Unknown spacecraft material.');
  const bounds = { gravityG: [0, 1], pressureKpa: [29.6, 202.6], oxygenPct: [13, 85], forcedFlowCms: [0, 65], electricFieldKvCm: [0, 2.5] } as const;
  for (const key of Object.keys(bounds) as (keyof typeof bounds)[]) {
    const value = input[key]; const [min, max] = bounds[key];
    if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`${key} must be finite and within ${min}–${max}.`);
  }
  return { ...input };
}

export function calculateIonCurrentDensity(electricFieldKvCm: number): number {
  if (!Number.isFinite(electricFieldKvCm) || electricFieldKvCm < 0 || electricFieldKvCm > 2.5) throw new RangeError('Electric field must be 0–2.5 kV/cm.');
  const ratio = electricFieldKvCm / PHYSICS_CONSTANTS.saturationFieldKvCm;
  return PHYSICS_CONSTANTS.saturationCurrentAm2 * (ratio <= 1 ? ratio ** 2 : 1 + 0.35 * (ratio - 1) ** 2);
}

function temperature(material: MaterialParams, oxygenPct: number): number {
  return material.tfAirK * (1 + 0.185 * Math.log(oxygenPct / 21));
}
function buoyantVelocity(gravityG: number, tfK: number, pressureKpa: number): number {
  return 25 * Math.sqrt(gravityG * (tfK - PHYSICS_CONSTANTS.tInfinityK) / (2365 - PHYSICS_CONSTANTS.tInfinityK)) * (pressureKpa / PHYSICS_CONSTANTS.referencePressureKpa) ** (1 / 3);
}
function locAt(material: MaterialParams, velocityCms: number, pressureKpa: number): number {
  if (material.locTrough0Pct === undefined || material.deltaXQuenchPct === undefined || material.vQuenchCms === undefined || material.vOptCms === undefined || material.slopeBlowoffPctPerCms === undefined) return 0;
  return material.locTrough0Pct * (PHYSICS_CONSTANTS.referencePressureKpa / pressureKpa) ** 0.22
    + material.deltaXQuenchPct * Math.exp(-velocityCms / material.vQuenchCms)
    + material.slopeBlowoffPctPerCms * Math.max(0, velocityCms - material.vOptCms);
}

/** Complete implementation of the later user-supplied executable surrogate.
 * Completeness describes specification coverage, not experimental validation.
 */
export const MODEL_COMPLETENESS = {
  status: 'COMPLETE_SPECIFIED_SURROGATE',
  propagationAvailable: true,
  missing: [],
} as const;

export interface SimulationResult {
  input: SimulationInput; flameTemperatureK: number; effectiveGravityG: number;
  oxygenPartialPressurePsia: number;
  ionCurrentDensityAm2: number; grashofNumber: number; buoyantVelocityCms: number;
  mixedConvectionVelocityCms: number; reynoldsNumber: number; damkohlerNumber: number;
  flowTimeS: number; chemicalTimeS: number; forcedReynoldsNumber: number; diffusionVelocityCms: number; limitingOxygenConcentrationPct: number;
  negativeOxygenMarginPct: number; earthReferenceLocPct: number;
  flameSpreadRateMms: number; predictedBurnLengthCm: number;
  status: 'PASS' | 'WARNING' | 'FAIL'; test4Status: string;
  predictionAvailable: boolean; locPredictionAvailable: boolean; missingParameters: string[];
  jsc29353dPrescription: string; flameAspectRatio: number; colorSootIndex: number;
  flameColor: string; ionDragEquivalentGravityG: number;
  ehdEquivalentG: number; effectiveReynoldsNumber: number; flameTempK: number;
  loc1gReferencePct: number; negativeOxygenMarginOfSafetyPct: number; dominantColorHex: string;
  nasaStd6001Status: 'PASS' | 'WARNING_MUA_NON_CONSERVATIVE_1G' | 'FAIL';
  locCurvePoints: Array<{ vEff: number; vEffCms: number; locPct: number }>;
  gravityMarkers: Array<{ label: string; gravityG: number; vEff: number; locPct: number }>;
  warnings: string[];
}

export type SimulationOutput = SimulationResult;

export function simulatePartialGravityFlammability(rawInput: CompatibleSimulationInput): SimulationResult {
  const input = validateSimulationInput(rawInput); const material = MATERIAL_PARAMS[input.materialId]; const c = PHYSICS_CONSTANTS;
  const flameTemperatureK = temperature(material, input.oxygenPct);
  const ionCurrentDensityAm2 = calculateIonCurrentDensity(input.electricFieldKvCm);
  const effectiveGravityG = input.gravityG + ionCurrentDensityAm2 / (c.ionMobilityM2Vs * c.referenceDensityKgm3 * (1 - c.tInfinityK / flameTemperatureK) * c.g0);
  const pressureRatio = input.pressureKpa / c.referencePressureKpa;
  const oxygenPartialPressurePsia = round(input.pressureKpa * 0.1450377 * (input.oxygenPct / 100), 2);
  const grashofNumber = effectiveGravityG * c.g0 * (flameTemperatureK - c.tInfinityK) * c.characteristicLengthM ** 3 / (c.tInfinityK * c.kinematicViscosityM2s ** 2) * pressureRatio ** 2;
  const buoyantVelocityCms = buoyantVelocity(effectiveGravityG, flameTemperatureK, input.pressureKpa);
  const mixedConvectionVelocityCms = Math.hypot(input.forcedFlowCms, buoyantVelocityCms);
  const reynoldsNumber = mixedConvectionVelocityCms / 100 * c.characteristicLengthM / c.kinematicViscosityM2s * pressureRatio;
  const forcedReynoldsNumber = input.forcedFlowCms / 100 * c.characteristicLengthM / c.kinematicViscosityM2s * pressureRatio;
  const diffusionVelocityCms = 1.5 / pressureRatio;
  const flowTimeS = 1.2 / (mixedConvectionVelocityCms + diffusionVelocityCms);
  const chemicalTimeS = 0.008 * pressureRatio ** -0.8 * (21 / input.oxygenPct) ** 1.5 * Math.exp(12000 / flameTemperatureK - 12000 / 2365);
  const damkohlerNumber = flowTimeS / chemicalTimeS;
  const locPredictionAvailable = true;
  const predictionAvailable = true;
  const missingParameters: string[] = [];
  const limitingOxygenConcentrationPct = round(locAt(material, mixedConvectionVelocityCms, input.pressureKpa), 2);
  // The supplied executable uses a temperature-independent 1g reference here.
  // This intentionally differs from its temperature-corrected active buoyancy.
  const earthBuoyantVelocityCms = 25 * pressureRatio ** (1 / 3);
  const earthVEff = Math.hypot(input.forcedFlowCms, earthBuoyantVelocityCms);
  const earthReferenceLocPct = round(locAt(material, earthVEff, input.pressureKpa), 2);
  const negativeOxygenMarginPct = round(Math.max(0, earthReferenceLocPct - limitingOxygenConcentrationPct), 2);
  let spread = 0;
  if (input.oxygenPct > limitingOxygenConcentrationPct) {
    const theta = (flameTemperatureK - material.tpK) / (material.tpK - c.tInfinityK);
    const phi = 1 - Math.exp(-(input.oxygenPct - limitingOxygenConcentrationPct) / 2.5);
    if (material.thermalRegime === 'thick') {
      spread = material.spreadCoeff * mixedConvectionVelocityCms * pressureRatio * theta ** 2 * phi;
    } else {
      const xO2 = input.oxygenPct / 100;
      const vBlow = 28 * Math.max(0.1, (xO2 - 0.13) / (0.173 - 0.13)) ** 1.4;
      const quench = Math.exp(-material.vQuenchCms / Math.max(0.2, mixedConvectionVelocityCms));
      const blow = Math.exp(-((mixedConvectionVelocityCms / vBlow) ** 2));
      spread = material.spreadCoeff * pressureRatio ** 0.5 * (Math.max(0.2, mixedConvectionVelocityCms) / 20) ** 0.5 * theta ** 1.5 * quench * blow * phi;
    }
  }
  const flameSpreadRateMms = round(spread, 3);
  const sustainS = material.thermalRegime === 'thin' ? 90 : 300;
  const predictedBurnLengthCm = round(Math.min(30, flameSpreadRateMms * sustainS / 10), 1);
  const passesMission = predictedBurnLengthCm <= 15 && (!material.dripsOrBubbles || flameSpreadRateMms === 0);
  const passes1g = input.oxygenPct <= earthReferenceLocPct;
  const status = !passesMission && passes1g ? 'WARNING' : !passesMission ? 'FAIL' : 'PASS';
  const xO2 = input.oxygenPct / 100;
  const flameAspectRatio = round(1 + 0.38 * Math.max(0.1, mixedConvectionVelocityCms) ** 0.62 * pressureRatio ** 0.4, 2);
  const colorSootIndex = round(clamp(pressureRatio ** 0.85 * Math.max(0, (xO2 - 0.15) / 0.15) ** 0.7 * Math.max(0, (flameTemperatureK - 1300) / 1100) * (1 + 0.5 * Math.exp(-mixedConvectionVelocityCms / 15)) / 1.2, 0, 1), 2);
  const flameColor = colorSootIndex < 0.25 ? '#1A73E8' : colorSootIndex < 0.6 ? '#38BDF8' : '#FA903E';
  const warnings = ['Virtual research-model result. PASS does not establish NASA qualification; representative physical testing and configuration review are required.', 'All coefficients and executable closures are user-supplied; independent evidence verification is tracked separately.'];
  if (limitingOxygenConcentrationPct > 100) warnings.push('The supplied LOC formula exceeds 100% O₂ at this pressure; this mathematical extrapolation is not a physical test result.');
  if (input.pressureKpa < 40 || input.oxygenPct > 50) warnings.push('Exploration proxy exceeds most investigation envelopes; treat predictions as extrapolation.');
  if (input.electricFieldKvCm > 2.2) warnings.push('Electric field exceeds the 2.2 kV/cm bound supplied for ACME E-FIELD.');
  if (mixedConvectionVelocityCms > 50) warnings.push('Active mixed velocity exceeds the plotted 0–50 cm/s curve; active LOC is computed at the actual velocity.');
  const prescriptionDetail = status === 'PASS'
    ? `Predicted burn length ${predictedBurnLengthCm} cm is within the 15 cm (6 in) model limit, with no modeled flaming-debris transfer risk. Retain representative physical testing and configuration review; actual debris behavior is not measured by this model.`
    : status === 'WARNING'
      ? `Non-conservative 1g trap: mission LOC ${limitingOxygenConcentrationPct}% O₂ versus 1g reference LOC ${earthReferenceLocPct}% O₂; NOMS ${negativeOxygenMarginPct}% O₂. Require configuration review and Materials Usage Agreement (MUA) evaluation; assess a 15 cm (6 in) firebreak or suitable barrier with representative testing.`
      : `Predicted burn length ${predictedBurnLengthCm} cm${material.dripsOrBubbles ? '; melting/dripping material carries potential flaming-debris transfer risk' : ''}. Enclose or replace exposed flammable material, interrupt propagation paths, and test the representative configuration.`;
  const jsc29353dPrescription = `Virtual model ${status}: computed LOC ${limitingOxygenConcentrationPct}% O₂. ${prescriptionDetail} Consult NASA-STD-6001B and JSC 29353D; this recommendation is not NASA approval or a quotation of the standard.`;
  return { input, flameTemperatureK: Math.round(flameTemperatureK), effectiveGravityG: round(effectiveGravityG, 3), ionDragEquivalentGravityG: round(effectiveGravityG - input.gravityG, 3), ionCurrentDensityAm2, oxygenPartialPressurePsia,
    grashofNumber: Number(grashofNumber.toExponential(3)), buoyantVelocityCms: round(buoyantVelocityCms, 2), mixedConvectionVelocityCms: round(mixedConvectionVelocityCms, 2),
    reynoldsNumber: round(reynoldsNumber, 1), damkohlerNumber: round(damkohlerNumber, 2), flowTimeS, chemicalTimeS, forcedReynoldsNumber: round(forcedReynoldsNumber, 1), diffusionVelocityCms,
    predictionAvailable, locPredictionAvailable, missingParameters, limitingOxygenConcentrationPct, negativeOxygenMarginPct, earthReferenceLocPct, flameSpreadRateMms, predictedBurnLengthCm, status,
    test4Status: 'NOT EVALUATED — Test 4 is an electrical-wire insulation physical test; this bulk-material surrogate cannot establish its result.',
    jsc29353dPrescription, flameAspectRatio, colorSootIndex, flameColor,
    ehdEquivalentG: round(effectiveGravityG - input.gravityG, 3), effectiveReynoldsNumber: round(reynoldsNumber, 1), flameTempK: Math.round(flameTemperatureK),
    loc1gReferencePct: earthReferenceLocPct, negativeOxygenMarginOfSafetyPct: negativeOxygenMarginPct, dominantColorHex: flameColor,
    nasaStd6001Status: status === 'WARNING' ? 'WARNING_MUA_NON_CONSERVATIVE_1G' : status,
    locCurvePoints: Array.from({ length: 51 }, (_, vEff) => ({ vEff, vEffCms: vEff, locPct: round(locAt(material, vEff, input.pressureKpa), 2) })),
    gravityMarkers: [{ label: '0g', gravityG: 0 }, { label: 'Moon', gravityG: 0.165 }, { label: 'Mars', gravityG: 0.38 }, { label: 'Earth', gravityG: 1 }].map(({ label, gravityG }) => { const vEff = Math.hypot(input.forcedFlowCms, buoyantVelocity(gravityG, flameTemperatureK, input.pressureKpa)); return { label, gravityG, vEff: round(vEff, 2), locPct: round(locAt(material, vEff, input.pressureKpa), 2) }; }),
    warnings,
  };
}

export interface InvestigationRecord {
  id: string; materials_tested: string[]; fuel_phase: string;
  atmosphere: { pressure_min_kpa: number; pressure_max_kpa: number; o2_min_pct: number; o2_max_pct: number; flow_velocity_min_cms: number; flow_velocity_max_cms: number };
  scale_and_diagnostic_score: number; models_buoyancy_scaling: boolean;
}
export interface McdaSubScores { sO2: number; sP: number; sFlow: number; sFuel: number; sScale: number }
export type RankedInvestigation<T extends InvestigationRecord = InvestigationRecord> = T & McdaSubScores & { mcdaScore: number; subScores: McdaSubScores };
export interface PsiInvestigationSummary {
  id: string; code: string;
  fuelPhase: 'Solid' | 'Liquid Droplet' | 'Gaseous' | 'Gaseous (Condensed-Phase Emulator)' | 'Solid (Pyrolysis Aerosol)';
  o2MinPct: number; o2MaxPct: number; pMinKPa: number; pMaxKPa: number;
  flowMinCms: number; flowMaxCms: number; modelsBuoyancyScaling: boolean;
  scaleAndDiagnosticScore: number;
}
export type CanonicalRankedInvestigation = PsiInvestigationSummary & McdaSubScores & { mcdaScore: number; subScores: McdaSubScores };


export function normalizeWeights(weights: readonly number[]): Weights {
  if (weights.length !== 5 || weights.some((w) => !Number.isFinite(w) || w < 0)) throw new RangeError('MCDA needs five finite nonnegative weights.');
  const total = weights.reduce((sum, w) => sum + w, 0);
  return (total === 0 ? [0.2, 0.2, 0.2, 0.2, 0.2] : weights.map((w) => w / total)) as Weights;
}
function envelopeDistance(target: number, min: number, max: number): number {
  return Math.max(0, min - target, target - max);
}

/** Weighted sum with interval-distance affinities. Weights are project choices,
 * not measured NASA preferences. A high score denotes relevance, never safety.
 */
export function rankPsiInvestigations<T extends InvestigationRecord>(investigations: readonly T[], rawInput: CompatibleSimulationInput, rawWeights?: readonly number[]): RankedInvestigation<T>[];
export function rankPsiInvestigations(investigations: readonly PsiInvestigationSummary[], mission: MissionProfileTarget): CanonicalRankedInvestigation[];
export function rankPsiInvestigations(
  investigations: readonly (InvestigationRecord | PsiInvestigationSummary)[],
  rawInput: CompatibleSimulationInput | MissionProfileTarget,
  rawWeights: readonly number[] = MISSION_PROFILES.ARTEMIS_LUNAR_016G.weights,
): (RankedInvestigation | CanonicalRankedInvestigation)[] {
  const canonical = 'profileId' in rawInput;
  const input = canonical
    ? validateSimulationInput({ materialId: 'MAT-PMMA-CAST', gravityG: rawInput.gravityG, pressureKPa: rawInput.pressureKPa, oxygenPct: rawInput.oxygenPct, forcedFlowCms: rawInput.forcedFlowCms })
    : validateSimulationInput(rawInput);
  // The exact canonical API uses provided weights directly. The existing UI API
  // retains its documented auto-normalization of editable sliders.
  const weights = canonical
    ? [rawInput.weights.o2, rawInput.weights.pressure, rawInput.weights.flow, rawInput.weights.fuel, rawInput.weights.scale]
    : normalizeWeights(rawWeights);
  if (weights.some((w) => !Number.isFinite(w) || w < 0)) throw new RangeError('MCDA weights must be finite and nonnegative.');
  // MCDA follows the supplied executable mission-flow proxy, without material,
  // oxygen-temperature or electric-field correction.
  const effectiveMixedFlowCms = Math.hypot(input.forcedFlowCms, 25 * Math.sqrt(input.gravityG) * (input.pressureKpa / PHYSICS_CONSTANTS.referencePressureKpa) ** (1 / 3));
  return investigations.map((investigation) => {
    const record = 'atmosphere' in investigation ? investigation : {
      ...investigation,
      materials_tested: [], fuel_phase: investigation.fuelPhase,
      atmosphere: { o2_min_pct: investigation.o2MinPct, o2_max_pct: investigation.o2MaxPct, pressure_min_kpa: investigation.pMinKPa, pressure_max_kpa: investigation.pMaxKPa, flow_velocity_min_cms: investigation.flowMinCms, flow_velocity_max_cms: investigation.flowMaxCms },
      models_buoyancy_scaling: investigation.modelsBuoyancyScaling,
      scale_and_diagnostic_score: investigation.scaleAndDiagnosticScore,
    };
    const a = record.atmosphere;
    const sO2 = Math.min(100, 100 * Math.exp(-(envelopeDistance(input.oxygenPct, a.o2_min_pct, a.o2_max_pct) ** 2) / (2 * 144)) * (1 + (a.o2_max_pct >= 30 ? 0.15 : 0)));
    const sP = 100 * Math.exp(-(envelopeDistance(input.pressureKpa, a.pressure_min_kpa, a.pressure_max_kpa) ** 2) / (2 * 625));
    const sFlow = Math.min(100, 100 * Math.exp(-(envelopeDistance(effectiveMixedFlowCms, a.flow_velocity_min_cms, a.flow_velocity_max_cms) ** 2) / (2 * 144)) + (input.gravityG > 0 && record.models_buoyancy_scaling ? 20 : 0));
    const phase = record.fuel_phase.toLowerCase();
    const sFuel = phase.includes('solid') || phase === 'aerosol' ? 100 : phase.includes('condensed-phase emulator') || investigation.id === 'ACME-BRE' ? 85 : 65;
    const sScale = canonical ? record.scale_and_diagnostic_score : clamp(record.scale_and_diagnostic_score, 0, 100);
    const mcdaScore = sO2 * weights[0] + sP * weights[1] + sFlow * weights[2] + sFuel * weights[3] + sScale * weights[4];
    const subScores = { sO2: round(sO2, 1), sP: round(sP, 1), sFlow: round(sFlow, 1), sFuel, sScale };
    return { ...investigation, mcdaScore: round(clamp(mcdaScore, 0, 100), 1), ...subScores, subScores };
  }).sort((a, b) => b.mcdaScore - a.mcdaScore);
}
