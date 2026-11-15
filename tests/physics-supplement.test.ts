import { describe, expect, it } from 'vitest';
import { calculateIonCurrentDensity, MATERIAL_PARAMS, MISSION_PROFILES, MODEL_COMPLETENESS, normalizeWeights, PHYSICS_CONSTANTS, rankPsiInvestigations, simulatePartialGravityFlammability, type MaterialId, type SimulationInput } from '../src/lib/pyrozero-engine';

const baseline = MISSION_PROFILES.ISS_TRANSIT_0G.input;
const run = (changes: Partial<SimulationInput>) => simulatePartialGravityFlammability({ ...baseline, ...changes });

describe('supplemental report fidelity', () => {
  it('retains reported observations separately from supplied executable predictions', () => {
    expect(MATERIAL_PARAMS['MAT-SIBAL'].reportedLimits.spread_rate_0g_20cms_mms).toBe(2.03);
    expect(MATERIAL_PARAMS['MAT-NOMEX-HT90'].reportedLimits.saffire_vi_31_9_o2_result).toContain('PASS');
    expect(MATERIAL_PARAMS['MAT-PMMA-CAST'].reportedLimits.nasa_std_6001_test1_34o2_82psia).toContain('FAIL');
    for (const materialId of ['MAT-SIBAL', 'MAT-NOMEX-HT90', 'MAT-PMMA-CAST'] as const) {
      const r = run({ materialId });
      expect(r.predictionAvailable).toBe(true);
      expect(r.locPredictionAvailable).toBe(true);
      expect(['PASS', 'WARNING', 'FAIL']).toContain(r.status);
      expect(r.locCurvePoints).toHaveLength(51);
      expect(r.missingParameters).toEqual([]);
    }
    expect(MODEL_COMPLETENESS.status).toBe('COMPLETE_SPECIFIED_SURROGATE');
  });
  it('copies supplied thermophysical properties and leaves absent properties absent', () => {
    expect(MATERIAL_PARAMS['MAT-PMMA-CAST']).toMatchObject({ densityKgm3: 1190, heatCapacityJkgK: 1400, conductivityWmK: 0.19, tpK: 579, tfAirK: 2365 });
    expect(MATERIAL_PARAMS['MAT-SIBAL']).toMatchObject({ areaDensityKgm2: 0.1805, tpK: 610, tfAirK: 2150 });
    expect(MATERIAL_PARAMS['MAT-SIBAL'].heatCapacityJkgK).toBeUndefined();
    expect(MATERIAL_PARAMS['MAT-NOMEX-HT90']).toMatchObject({ areaDensityKgm2: 0.24, tpK: 720, tfAirK: 2100 });
    expect(MATERIAL_PARAMS['MAT-VELCRO-NYLON']).toMatchObject({ densityKgm3: 1140, tpK: 673, tfAirK: 2250 });
    expect(MATERIAL_PARAMS['MAT-PTFE-TEFLON']).toMatchObject({ densityKgm3: 2150, tpK: 811, tfAirK: 2050 });
    expect(MATERIAL_PARAMS['MAT-BETA-PBI']).toMatchObject({ densityKgm3: 1850, tpK: 920, tfAirK: 1950 });
  });
  it('locks exact weights and fan-flow presets', () => {
    expect(MISSION_PROFILES.ISS_TRANSIT_0G.weights).toEqual([0.20, 0.15, 0.30, 0.20, 0.15]);
    expect(MISSION_PROFILES.ARTEMIS_LUNAR_016G.weights).toEqual([0.35, 0.25, 0.15, 0.15, 0.10]);
    expect(MISSION_PROFILES.MARS_HABITAT_038G.weights).toEqual([0.30, 0.25, 0.20, 0.15, 0.10]);
    expect(MISSION_PROFILES.EVA_SPACESUIT_HIGH_O2.weights).toEqual([0.45, 0.25, 0.10, 0.15, 0.05]);
    expect(MISSION_PROFILES.ISS_TRANSIT_0G.input.forcedFlowCms).toBe(15);
    expect(MISSION_PROFILES.EVA_SPACESUIT_HIGH_O2.input.forcedFlowCms).toBe(25);
  });
});

describe('exact supplied transport equations', () => {
  it('uses both current branches and pressure-invariant Chattock gravity', () => {
    expect(calculateIonCurrentDensity(0)).toBe(0);
    expect(calculateIonCurrentDensity(0.5)).toBeCloseTo(1.7e-3 * 0.25, 14);
    expect(calculateIonCurrentDensity(1)).toBe(1.7e-3);
    expect(calculateIonCurrentDensity(2.5)).toBeCloseTo(1.7e-3 * (1 + 0.35 * 1.5 ** 2), 14);
    const r = run({ oxygenPct: 34, electricFieldKvCm: 1 });
    const tf = 2365 * (1 + 0.185 * Math.log(34 / 21));
    expect(r.flameTemperatureK).toBe(Math.round(tf));
    expect(r.effectiveGravityG).toBe(Number((1.7e-3 / (1.7e-4 * 1.184 * (1 - 298.15 / tf) * 9.80665)).toFixed(3)));
    expect(run({ oxygenPct: 34, electricFieldKvCm: 1, pressureKpa: 56.5 }).effectiveGravityG).toBe(r.effectiveGravityG);
  });
  it('locks Gr, Re_f, Re_eff and parameterized Da', () => {
    const r = simulatePartialGravityFlammability(MISSION_PROFILES.ARTEMIS_LUNAR_016G.input);
    const p = 56.5 / 101.325, tf = 2365 * (1 + 0.185 * Math.log(34 / 21));
    const vb = 25 * Math.sqrt(0.165 * (tf - 298.15) / (2365 - 298.15)) * p ** (1 / 3);
    const ve = Math.hypot(10, vb);
    const flowTime = 1.2 / (ve + 1.5 / p);
    const chemTime = 0.008 * p ** -0.8 * (21 / 34) ** 1.5 * Math.exp(12000 / tf - 12000 / 2365);
    expect(PHYSICS_CONSTANTS.referencePressureKpa).toBe(101.325);
    expect(r.grashofNumber).toBe(Number((0.165 * 9.80665 * (tf - 298.15) * 0.05 ** 3 / (298.15 * (1.57e-5) ** 2) * p ** 2).toExponential(3)));
    expect(r.buoyantVelocityCms).toBe(Number(vb.toFixed(2)));
    expect(r.forcedReynoldsNumber).toBe(Number((10 / 100 * 0.05 / 1.57e-5 * p).toFixed(1)));
    expect(r.reynoldsNumber).toBe(Number((ve / 100 * 0.05 / 1.57e-5 * p).toFixed(1)));
    expect(r.flowTimeS).toBeCloseTo(flowTime, 12);
    expect(r.chemicalTimeS).toBeCloseTo(chemTime, 12);
    expect(r.damkohlerNumber).toBe(Number((flowTime / chemTime).toFixed(2)));
    expect(r.mixedConvectionVelocityCms).toBe(13.30);
  });
  it('preserves Beta/PBI coefficients and exact rounded LOC curve', () => {
    expect(MATERIAL_PARAMS['MAT-BETA-PBI']).toMatchObject({ locTrough0Pct: 95, deltaXQuenchPct: 3, vQuenchCms: 2, vOptCms: 5, slopeBlowoffPctPerCms: 0.2, tfAirK: 1950, tpK: 920, spreadCoeff: 0.0005, dripsOrBubbles: false });
    const r = run({ materialId: 'MAT-BETA-PBI', pressureKpa: 56.5 });
    expect(r.locPredictionAvailable).toBe(true);
    expect(r.predictionAvailable).toBe(true);
    expect(r.locCurvePoints).toHaveLength(51);
    for (const point of r.locCurvePoints) expect(point.locPct).toBe(Number((95 * (101.325 / 56.5) ** 0.22 + 3 * Math.exp(-point.vEff / 2) + 0.2 * Math.max(0, point.vEff - 5)).toFixed(2)));
    expect(r.jsc29353dPrescription).toContain(`${r.limitingOxygenConcentrationPct}%`);
    expect(r.gravityMarkers).toHaveLength(4);
  });
});

describe('numerical and scope safety', () => {
  it('stays finite across all 3456 material and atmosphere combinations', () => {
    let checked = 0;
    for (const materialId of Object.keys(MATERIAL_PARAMS) as MaterialId[]) for (const gravityG of [0, 0.165, 0.38, 1]) for (const pressureKpa of [29.6, 56.5, 101.3, 202.6]) for (const oxygenPct of [13, 21, 34, 85]) for (const forcedFlowCms of [0, 10, 65]) for (const electricFieldKvCm of [0, 1, 2.5]) {
      const r = run({ materialId, gravityG, pressureKpa, oxygenPct, forcedFlowCms, electricFieldKvCm });
      const invalidScalar = Object.entries(r).find(([,v]) => typeof v === 'number' && !Number.isFinite(v));
      const invalidCurve = r.locCurvePoints.some(p=>!Number.isFinite(p.locPct)||!Number.isFinite(p.vEff));
      if (invalidScalar || invalidCurve || !r.predictionAvailable || !['PASS','WARNING','FAIL'].includes(r.status) || r.flameSpreadRateMms<0 || r.predictedBurnLengthCm<0 || r.predictedBurnLengthCm>30) {
        throw new Error(`Invalid simulation ${JSON.stringify({ materialId, gravityG, pressureKpa, oxygenPct, forcedFlowCms, electricFieldKvCm, invalidScalar, invalidCurve })}`);
      }
      checked++;
    }
    expect(checked).toBe(3456);
  }, 60000);
  it('uses finite specified diffusion at zero flow and rejects invalid inputs', () => {
    const r = run({ forcedFlowCms: 0, gravityG: 0 });
    expect(r.reynoldsNumber).toBe(0);
    expect(r.flowTimeS).toBeCloseTo(1.2 / (1.5 / (101.3 / 101.325)), 12);
    for (const patch of [{ oxygenPct: 100 }, { gravityG: -1 }, { forcedFlowCms: NaN }, { pressureKpa: Infinity }, { electricFieldKvCm: 3 }]) expect(() => run(patch)).toThrow(RangeError);
    expect(() => run({ materialId: 'unknown' as MaterialId })).toThrow(RangeError);
    expect(run({}).test4Status).toContain('NOT EVALUATED');
  });
});

describe('exact Gaussian MCDA', () => {
  const record = { id: 'equations', materials_tested: ['Cast PMMA'], fuel_phase: 'Solid', atmosphere: { pressure_min_kpa: 90, pressure_max_kpa: 110, o2_min_pct: 25, o2_max_pct: 30, flow_velocity_min_cms: 40, flow_velocity_max_cms: 50 }, scale_and_diagnostic_score: 90, models_buoyancy_scaling: true };
  it('uses Gaussian squared distance, high-O2 bonus, mixed flow and partial-gravity bonus', () => {
    const input = MISSION_PROFILES.ARTEMIS_LUNAR_016G.input, w = MISSION_PROFILES.ARTEMIS_LUNAR_016G.weights;
    const r = rankPsiInvestigations([record], input, w)[0];
    const ve = Math.hypot(input.forcedFlowCms, 25 * Math.sqrt(input.gravityG) * (input.pressureKpa / 101.325) ** (1 / 3));
    const so = Math.min(100, 100 * Math.exp(-(4 ** 2) / (2 * 144)) * 1.15);
    const sp = 100 * Math.exp(-((90 - 56.5) ** 2) / (2 * 625));
    const sf = Math.min(100, 100 * Math.exp(-((40 - ve) ** 2) / (2 * 144)) + 20);
    expect(r.sO2).toBe(Number(so.toFixed(1)));
    expect(r.sP).toBe(Number(sp.toFixed(1)));
    expect(r.sFlow).toBe(Number(sf.toFixed(1)));
    expect(r.sFuel).toBe(100);
    expect(r.mcdaScore).toBe(Number((so * w[0] + sp * w[1] + sf * w[2] + 100 * w[3] + 90 * w[4]).toFixed(1)));
    const elevated = rankPsiInvestigations([record], { ...input, oxygenPct: 54 }, w)[0];
    expect(elevated.sO2).toBe(Number((100 * Math.exp(-(24 ** 2) / (2 * 144)) * 1.15).toFixed(1)));
  });
  it('uses exact supplied fuel-phase scores and normalized custom weights', () => {
    for (const [phase, score] of [['Solid', 100], ['Solid (Pyrolysis Aerosol)', 100], ['Gaseous (Condensed-Phase Emulator)', 85], ['Gaseous', 65], ['Liquid Droplet', 65]] as const) expect(rankPsiInvestigations([{ ...record, fuel_phase: phase }], baseline)[0].sFuel).toBe(score);
    expect(normalizeWeights([3, 2, 1, 2, 2])).toEqual([0.3, 0.2, 0.1, 0.2, 0.2]);
    expect(normalizeWeights([0, 0, 0, 0, 0])).toEqual([0.2, 0.2, 0.2, 0.2, 0.2]);
    expect(() => normalizeWeights([NaN, 1, 1, 1, 1])).toThrow(RangeError);
  });
});


describe('final executable spread benchmarks and canonical compatibility', () => {
  it('matches the calibrated SIBAL spread benchmark', () => {
    const r = run({ materialId: 'MAT-SIBAL', gravityG: 0, pressureKpa: 100, oxygenPct: 21, forcedFlowCms: 20, electricFieldKvCm: 0 });
    expect(r.limitingOxygenConcentrationPct).toBe(18.01);
    expect(r.flameSpreadRateMms).toBe(2.030);
    expect(r.predictedBurnLengthCm).toBe(18.3);
    expect(r.flameSpreadRateMms).toBe(MATERIAL_PARAMS['MAT-SIBAL'].reportedLimits.spread_rate_0g_20cms_mms);
  });
  it('passes the provided Nomex non-ignition benchmark and fails lunar PMMA', () => {
    const n = run({ materialId: 'MAT-NOMEX-HT90', gravityG: 0, pressureKpa: 54.1, oxygenPct: 31.9, forcedFlowCms: 20, electricFieldKvCm: 0 });
    expect(n.limitingOxygenConcentrationPct).toBe(34.82);
    expect(n.flameSpreadRateMms).toBe(0);
    expect(n.predictedBurnLengthCm).toBe(0);
    expect(n.status).toBe('PASS');
    const p = simulatePartialGravityFlammability(MISSION_PROFILES.ARTEMIS_LUNAR_016G.input);
    expect(p.limitingOxygenConcentrationPct).toBe(17.19);
    expect(p.flameSpreadRateMms).toBe(1.573);
    expect(p.predictedBurnLengthCm).toBe(30);
    expect(p.status).toBe('FAIL');
  });
  it('accepts canonical pressureKPa spelling and provides vEffCms aliases', () => {
    const { pressureKpa, ...rest } = baseline;
    expect(simulatePartialGravityFlammability({ ...rest, pressureKPa: pressureKpa })).toMatchObject({ predictionAvailable: true });
    for (const point of run({}).locCurvePoints) expect(point.vEffCms).toBe(point.vEff);
  });
});


describe('canonical executable output aliases', () => {
  it('mirrors canonical alias fields and defaults omitted electric field to zero', () => {
    const { electricFieldKvCm: _field, pressureKpa, ...rest } = baseline;
    expect(_field).toBe(0);
    const r = simulatePartialGravityFlammability({ ...rest, pressureKPa: pressureKpa });
    expect(r.input.electricFieldKvCm).toBe(0);
    expect(r.ehdEquivalentG).toBe(r.ionDragEquivalentGravityG);
    expect(r.effectiveReynoldsNumber).toBe(r.reynoldsNumber);
    expect(r.flameTempK).toBe(r.flameTemperatureK);
    expect(r.loc1gReferencePct).toBe(r.earthReferenceLocPct);
    expect(r.negativeOxygenMarginOfSafetyPct).toBe(r.negativeOxygenMarginPct);
    expect(r.dominantColorHex).toBe(r.flameColor);
    expect(r.nasaStd6001Status).toBe(r.status === 'WARNING' ? 'WARNING_MUA_NON_CONSERVATIVE_1G' : r.status);
    for (const material of Object.values(MATERIAL_PARAMS)) expect(material.isThermallyThin).toBe(material.thermalRegime === 'thin');
  });
});
