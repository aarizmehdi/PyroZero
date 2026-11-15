import { describe, expect, it } from 'vitest';
import { MATERIAL_PARAMS, MISSION_PROFILES, PHYSICS_CONSTANTS, rankPsiInvestigations, simulatePartialGravityFlammability, type InvestigationRecord, type SimulationInput, type MaterialId } from '../src/lib/pyrozero-engine';

const base: SimulationInput = { materialId: 'MAT-PMMA-CAST', gravityG: .165, pressureKpa: 56.5, oxygenPct: 34, forcedFlowCms: 10, electricFieldKvCm: .8 };
const round = (value: number, digits: number) => Number(value.toFixed(digits));

describe('independent supplemental equation conformance', () => {
  it('uses SI acceleration in Gr, centimetres in reacting time, and the exact chemical time', () => {
    const r = simulatePartialGravityFlammability(base);
    const tf = 2365 * (1 + .185 * Math.log(34 / 21));
    const j = .0017 * .8 ** 2;
    const g = .165 + j / (.00017 * 1.184 * (1 - 298.15 / tf) * 9.80665);
    const pr = 56.5 / 101.325;
    const vb = 25 * Math.sqrt(g * (tf - 298.15) / (2365 - 298.15)) * pr ** (1 / 3);
    const vm = Math.hypot(10, vb);
    const gr = g * 9.80665 * (tf - 298.15) * .05 ** 3 / (298.15 * .0000157 ** 2) * pr ** 2;
    const re = vm / 100 * .05 / .0000157 * pr;
    const flow = 1.2 / (vm + 1.5 / pr);
    const chem = .008 * (1 / pr) ** .8 * (21 / 34) ** 1.5 * Math.exp(12000 / tf - 12000 / 2365);
    expect(PHYSICS_CONSTANTS.referencePressureKpa).toBe(101.325);
    expect(r.flameTemperatureK).toBe(Math.round(tf));
    expect(r.ionCurrentDensityAm2).toBeCloseTo(j, 12);
    expect(r.effectiveGravityG).toBe(round(g,3));
    expect(r.buoyantVelocityCms).toBe(round(vb,2));
    expect(r.mixedConvectionVelocityCms).toBe(round(vm,2));
    expect(r.grashofNumber).toBe(Number(gr.toExponential(3)));
    expect(r.reynoldsNumber).toBe(round(re,1));
    expect(r.flowTimeS).toBeCloseTo(flow, 12);
    expect(r.chemicalTimeS).toBeCloseTo(chem, 12);
    expect(r.damkohlerNumber).toBe(round(flow / chem,2));
  });

  it('preserves the ion-drag formula rather than forcing the rounded 1g prose benchmark', () => {
    const input = { ...base, gravityG: 0, pressureKpa: 101.325, oxygenPct: 21, electricFieldKvCm: 1 };
    const r = simulatePartialGravityFlammability(input);
    const exact = .0017 / (.00017 * 1.184 * (1 - 298.15 / 2365) * 9.80665);
    expect(r.effectiveGravityG).toBe(round(exact,3));
    expect(r.effectiveGravityG).toBeGreaterThan(.98);
    expect(r.effectiveGravityG).toBeLessThan(.99);
    expect(simulatePartialGravityFlammability({ ...input, pressureKpa: 56.5 }).effectiveGravityG).toBe(round(exact,3));
  });

  it('retains finite diffusion time in still microgravity', () => {
    const r = simulatePartialGravityFlammability({ ...base, gravityG: 0, forcedFlowCms: 0, electricFieldKvCm: 0 });
    expect(r.flowTimeS).toBeCloseTo(1.2 / (1.5 / (56.5 / 101.325)), 12);
    expect(Number.isFinite(r.damkohlerNumber)).toBe(true);
  });

  it('locks exact supplied mission weights and nominal fan speeds', () => {
    expect(MISSION_PROFILES.ISS_TRANSIT_0G.weights).toEqual([.20, .15, .30, .20, .15]);
    expect(MISSION_PROFILES.ARTEMIS_LUNAR_016G.weights).toEqual([.35, .25, .15, .15, .10]);
    expect(MISSION_PROFILES.MARS_HABITAT_038G.weights).toEqual([.30, .25, .20, .15, .10]);
    expect(MISSION_PROFILES.EVA_SPACESUIT_HIGH_O2.weights).toEqual([.45, .25, .10, .15, .05]);
    expect(MISSION_PROFILES.ISS_TRANSIT_0G.input.forcedFlowCms).toBe(15);
    expect(MISSION_PROFILES.EVA_SPACESUIT_HIGH_O2.input.forcedFlowCms).toBe(25);
  });

  it('preserves the supplied Beta/PBI coefficient set', () => {
    const p = MATERIAL_PARAMS['MAT-BETA-PBI'];
    expect([p.locTrough0Pct, p.deltaXQuenchPct, p.vQuenchCms, p.vOptCms, p.slopeBlowoffPctPerCms, p.tfAirK, p.tpK, p.spreadCoeff, p.dripsOrBubbles]).toEqual([95, 3, 2, 5, .20, 1950, 920, .0005, false]);
  });
});

describe('independent supplemental MCDA conformance', () => {
  const record: InvestigationRecord = { id: 'AUDIT-INTERVAL', materials_tested: ['Unrelated specimen'], fuel_phase: 'Solid', atmosphere: { pressure_min_kpa: 80, pressure_max_kpa: 100, o2_min_pct: 14, o2_max_pct: 25, flow_velocity_min_cms: 1, flow_velocity_max_cms: 3 }, scale_and_diagnostic_score: 42, models_buoyancy_scaling: true };

  it('uses squared interval distances and the additive partial-gravity flow bonus', () => {
    const input = { ...base, electricFieldKvCm: 0 };
    const ranked = rankPsiInvestigations([record], input, [.35, .25, .15, .15, .10])[0];
    const vb = 25 * Math.sqrt(.165) * (56.5 / 101.325) ** (1 / 3);
    const mixed = Math.hypot(10, vb);
    const o2 = 100 * Math.exp(-((34 - 25) ** 2) / (2 * 144));
    const pressure = 100 * Math.exp(-((80 - 56.5) ** 2) / (2 * 625));
    const flow = Math.min(100, 100 * Math.exp(-((mixed - 3) ** 2) / (2 * 144)) + 20);
    expect(ranked.sO2).toBe(round(o2,1));
    expect(ranked.sP).toBe(round(pressure,1));
    expect(ranked.sFlow).toBe(round(flow,1));
    expect(ranked.sFuel).toBe(100);
    expect(ranked.mcdaScore).toBe(round(.35 * o2 + .25 * pressure + .15 * flow + .15 * 100 + .10 * 42,1));
  });

  it('applies the high-oxygen experimental-envelope bonus before capping', () => {
    const enriched = { ...record, atmosphere: { ...record.atmosphere, o2_max_pct: 30 } };
    const input = { ...base, oxygenPct: 50 };
    const ranked = rankPsiInvestigations([enriched], input)[0];
    expect(ranked.sO2).toBe(round(Math.min(100, 100 * Math.exp(-(20 ** 2) / (2 * 144)) * 1.15),1));
  });

  it.each([['Solid',100],['Solid (Pyrolysis Aerosol)',100],['Gaseous (Condensed-Phase Emulator)',85],['Gaseous',65],['Liquid Droplet',65]] as const)('scores %s by phase rather than a material-name match', (fuel_phase, expected) => {
    expect(rankPsiInvestigations([{ ...record, fuel_phase }], base)[0].sFuel).toBe(expected);
  });
});

const FINAL_MATERIALS = {
  'MAT-PMMA-CAST': [false,13.6,3.2,1.2,2.5,.16,2365,579,.0042,true],
  'MAT-SIBAL': [true,16.2,2.8,1.5,4,.11,2150,610,.3147,false],
  'MAT-NOMEX-HT90': [true,28.5,3.5,2,5,.14,2100,720,.195,false],
  'MAT-VELCRO-NYLON': [true,18.2,2.5,1.4,3.5,.12,2250,673,.58,true],
  'MAT-PTFE-TEFLON': [false,80,5,2,5,.25,2050,811,.0018,false],
  'MAT-BETA-PBI': [true,95,3,2,5,.20,1950,920,.0005,false],
} as const;

describe('independent final executable closure conformance', () => {
  it.each(Object.keys(FINAL_MATERIALS) as MaterialId[])('preserves all supplied coefficients and closures for %s', materialId => {
    const row = FINAL_MATERIALS[materialId];
    const [thin,loc0,delta,vq,vopt,slope,tfAir,tp,coeff,drips] = row;
    const p = MATERIAL_PARAMS[materialId];
    expect([p.thermalRegime==='thin',p.locTrough0Pct,p.deltaXQuenchPct,p.vQuenchCms,p.vOptCms,p.slopeBlowoffPctPerCms,p.tfAirK,p.tpK,p.spreadCoeff,p.dripsOrBubbles]).toEqual(row);
    const enriched = materialId==='MAT-PTFE-TEFLON'||materialId==='MAT-BETA-PBI';
    const input = {...base,materialId,electricFieldKvCm:0,pressureKpa:enriched?202.6:56.5,oxygenPct:enriched?85:34};
    const pr=input.pressureKpa/101.325;
    const tf=tfAir*(1+.185*Math.log(input.oxygenPct/21));
    const vb=25*Math.sqrt(input.gravityG*(tf-298.15)/(2365-298.15))*pr**(1/3);
    const vm=Math.hypot(input.forcedFlowCms,vb);
    const computeLOC=(v:number)=>round(loc0/pr**.22+delta*Math.exp(-v/vq)+slope*Math.max(0,v-vopt),2);
    const loc=computeLOC(vm);
    const earthLoc=computeLOC(Math.hypot(input.forcedFlowCms,25*pr**(1/3)));
    const theta=(tf-tp)/(tp-298.15);
    const phi=1-Math.exp(-(input.oxygenPct-loc)/2.5);
    const vBlow=28*Math.max(.1,(input.oxygenPct/100-.13)/(.173-.13))**1.4;
    const raw=input.oxygenPct<=loc?0:thin
      ?coeff*pr**.5*(Math.max(.2,vm)/20)**.5*theta**1.5*Math.exp(-vq/Math.max(.2,vm))*Math.exp(-((vm/vBlow)**2))*phi
      :coeff*vm*pr*theta**2*phi;
    const spread=round(raw,3);
    const burn=round(Math.min(30,spread*(thin?90:300)/10),1);
    const pass=burn<=15&&(!drips||spread===0);
    const status=pass?'PASS':input.oxygenPct<=earthLoc?'WARNING':'FAIL';
    const ar=round(1+.38*Math.max(.1,vm)**.62*pr**.4,2);
    const csi=round(Math.min(1,Math.max(0,pr**.85*Math.max(0,(input.oxygenPct/100-.15)/.15)**.7*Math.max(0,(tf-1300)/1100)*(1+.5*Math.exp(-vm/15))/1.2)),2);
    const actual=simulatePartialGravityFlammability(input);
    expect(actual.predictionAvailable).toBe(true);
    expect(actual.locPredictionAvailable).toBe(true);
    expect(actual.limitingOxygenConcentrationPct).toBe(loc);
    expect(actual.earthReferenceLocPct).toBe(earthLoc);
    expect(actual.negativeOxygenMarginPct).toBe(round(Math.max(0,earthLoc-loc),2));
    expect(actual.flameSpreadRateMms).toBe(spread);
    expect(actual.predictedBurnLengthCm).toBe(burn);
    expect(actual.status).toBe(status);
    expect(actual.flameAspectRatio).toBe(ar);
    expect(actual.colorSootIndex).toBe(csi);
  });

  it('matches the SIBAL reported observation with the calibrated coefficient',()=>{
    const r=simulatePartialGravityFlammability({...base,materialId:'MAT-SIBAL',gravityG:0,pressureKpa:100,oxygenPct:21,forcedFlowCms:20,electricFieldKvCm:0});
    expect(MATERIAL_PARAMS['MAT-SIBAL'].reportedLimits.spread_rate_0g_20cms_mms).toBe(2.03);
    expect(r.flameSpreadRateMms).toBe(2.030);
    expect(r.predictedBurnLengthCm).toBe(18.3);
  });
});
