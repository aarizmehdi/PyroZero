import { describe, expect, it } from 'vitest';
import { CANONICAL_MISSIONS, MATERIAL_PARAMS, MISSION_PROFILES, rankPsiInvestigations, simulatePartialGravityFlammability, type PsiInvestigationSummary } from '../src/lib/pyrozero-engine';

describe('master v3 physics API and partial pressure', () => {
  it('returns the exact executable oxygen partial pressures for all mission targets', () => {
    const expected = { ISS_TRANSIT_0G: 3.09, ARTEMIS_LUNAR_016G: 2.79, MARS_HABITAT_038G: 2.79, EVA_SPACESUIT_HIGH_O2: 3.65 };
    for (const [id, mission] of Object.entries(CANONICAL_MISSIONS)) {
      const r = simulatePartialGravityFlammability({ ...mission, materialId: 'MAT-PMMA-CAST' });
      expect(r.oxygenPartialPressurePsia).toBe(expected[id as keyof typeof expected]);
      expect(r.predictionAvailable).toBe(true);
      expect(r.locPredictionAvailable).toBe(true);
      expect(r.missingParameters).toEqual([]);
    }
  });
  it('keeps canonical mission objects identical to the existing UI presets', () => {
    for (const id of Object.keys(CANONICAL_MISSIONS) as (keyof typeof CANONICAL_MISSIONS)[]) {
      const canonical = CANONICAL_MISSIONS[id], ui = MISSION_PROFILES[id];
      expect(canonical).toEqual({ profileId: id, gravityG: ui.input.gravityG, pressureKPa: ui.input.pressureKpa, oxygenPct: ui.input.oxygenPct, forcedFlowCms: ui.input.forcedFlowCms, weights: { o2: ui.weights[0], pressure: ui.weights[1], flow: ui.weights[2], fuel: ui.weights[3], scale: ui.weights[4] } });
    }
  });
  it('does not silently clamp the contradictory 10–100% prose range into the 13–85% UI boundary', () => {
    const base = MISSION_PROFILES.ISS_TRANSIT_0G.input;
    for (const oxygenPct of [10, 100]) expect(() => simulatePartialGravityFlammability({ ...base, oxygenPct })).toThrow(RangeError);
    for (const oxygenPct of [13, 85]) expect(simulatePartialGravityFlammability({ ...base, oxygenPct }).oxygenPartialPressurePsia).toBe(Number((101.3 * 0.1450377 * oxygenPct / 100).toFixed(2)));
  });
  it('exposes every supplied closure coefficient as a finite typed material property', () => {
    for (const material of Object.values(MATERIAL_PARAMS)) {
      for (const key of ['locTrough0Pct', 'deltaXQuenchPct', 'vQuenchCms', 'vOptCms', 'slopeBlowoffPctPerCms', 'tfAirK', 'tpK', 'spreadCoeff'] as const) expect(Number.isFinite(material[key])).toBe(true);
    }
  });
});

describe('master v3 canonical MCDA signature', () => {
  const investigations: PsiInvestigationSummary[] = [
    { id: 'solid', code: 'SOLID', fuelPhase: 'Solid', o2MinPct: 15, o2MaxPct: 34, pMinKPa: 56.5, pMaxKPa: 101.3, flowMinCms: 1, flowMaxCms: 40, modelsBuoyancyScaling: true, scaleAndDiagnosticScore: 97 },
    { id: 'gas', code: 'GAS', fuelPhase: 'Gaseous', o2MinPct: 21, o2MaxPct: 21, pMinKPa: 101.3, pMaxKPa: 101.3, flowMinCms: 5, flowMaxCms: 40, modelsBuoyancyScaling: false, scaleAndDiagnosticScore: 88 },
    { id: 'emulator', code: 'BRE', fuelPhase: 'Gaseous (Condensed-Phase Emulator)', o2MinPct: 15, o2MaxPct: 40, pMinKPa: 48.3, pMaxKPa: 101.3, flowMinCms: 0, flowMaxCms: 2, modelsBuoyancyScaling: false, scaleAndDiagnosticScore: 90 },
  ];
  it('accepts master camel-case investigations and object weights with transparent subScores', () => {
    const ranked = rankPsiInvestigations(investigations, CANONICAL_MISSIONS.ARTEMIS_LUNAR_016G);
    expect(ranked.map((r) => r.id)).toEqual(['solid', 'emulator', 'gas']);
    expect(ranked[0]).toMatchObject({ mcdaScore: 99.7, subScores: { sO2: 100, sP: 100, sFlow: 100, sFuel: 100, sScale: 97 } });
    for (const r of ranked) expect(r.subScores).toEqual({ sO2: r.sO2, sP: r.sP, sFlow: r.sFlow, sFuel: r.sFuel, sScale: r.sScale });
  });
  it('preserves exact canonical object-weight semantics while the UI slider API normalizes', () => {
    const mission = { ...CANONICAL_MISSIONS.ARTEMIS_LUNAR_016G, weights: { o2: 0.175, pressure: 0.125, flow: 0.075, fuel: 0.075, scale: 0.05 } };
    const r = rankPsiInvestigations([investigations[0]], mission)[0];
    expect(r.mcdaScore).toBe(49.9);
    expect(() => rankPsiInvestigations(investigations, { ...mission, weights: { ...mission.weights, flow: NaN } })).toThrow(RangeError);
  });
});
