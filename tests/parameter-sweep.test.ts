import { expect,it } from 'vitest';
import { MATERIAL_PARAMS,simulatePartialGravityFlammability,type MaterialId } from '../src/lib/pyrozero-engine';
it('keeps all slider-boundary combinations finite and applies oxygen and burn limits consistently',()=>{
 let cases=0;
 for(const materialId of Object.keys(MATERIAL_PARAMS) as MaterialId[])
 for(const gravityG of [0,.165,.38,1])for(const pressureKpa of [29.6,56.5,101.325,202.6])
 for(const oxygenPct of [13,21,34,85])for(const forcedFlowCms of [0,2,20,65])for(const electricFieldKvCm of [0,1,2.5]){
  const r=simulatePartialGravityFlammability({materialId,gravityG,pressureKpa,oxygenPct,forcedFlowCms,electricFieldKvCm});
  for(const value of Object.values(r))if(typeof value==='number')expect(Number.isFinite(value)).toBe(true);
  expect(r.flameSpreadRateMms).toBeGreaterThanOrEqual(0);expect(r.predictedBurnLengthCm).toBeGreaterThanOrEqual(0);expect(r.predictedBurnLengthCm).toBeLessThanOrEqual(30);
  expect(r.colorSootIndex).toBeGreaterThanOrEqual(0);expect(r.colorSootIndex).toBeLessThanOrEqual(1);
  expect(r.effectiveGravityG).toBeGreaterThanOrEqual(gravityG-.0005);
  if(oxygenPct<=r.limitingOxygenConcentrationPct)expect(r.flameSpreadRateMms).toBe(0);
  if(r.predictedBurnLengthCm>15)expect(r.status).not.toBe('PASS');
  expect(r.locCurvePoints).toHaveLength(51);cases++;
 }
 expect(cases).toBe(4608);
});
