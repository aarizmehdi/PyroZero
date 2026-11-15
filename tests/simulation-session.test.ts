import { describe,expect,it } from 'vitest';
import { knowledgeBase } from '../src/lib/knowledge-base';
import { initialSimulationSession,simulationSessionReducer as reduce } from '../src/lib/simulation-session';
import { MISSION_PROFILES } from '../src/lib/pyrozero-engine';
const [apollo1,apollo13,mir]=knowledgeBase.historical_incidents;

describe('explicit material choice and bounded scenario state',()=>{
 it('starts without an explicit material and does not silently select one on a mission change',()=>{
  const initial=initialSimulationSession();expect(initial.materialConfirmed).toBe(false);
  const next=reduce(initial,{type:'mission',profile:'EVA_SPACESUIT_HIGH_O2'});
  expect(next.materialConfirmed).toBe(false);expect(next.input.oxygenPct).toBe(85);
 });
 it('preserves an explicitly selected material across mission comparisons',()=>{
  const chosen=reduce(initialSimulationSession(),{type:'material',materialId:'MAT-SIBAL'});
  const next=reduce(chosen,{type:'mission',profile:'ISS_TRANSIT_0G'});
  expect(next.materialConfirmed).toBe(true);expect(next.input.materialId).toBe('MAT-SIBAL');expect(next.input.gravityG).toBe(0);
 });
 it.each([[apollo1,'MAT-VELCRO-NYLON'],[apollo13,'MAT-PTFE-TEFLON'],[mir,null]] as const)('requires a fresh choice for $0.id and identifies the source analogue', (incident,suggested)=>{
  const chosen=reduce(initialSimulationSession(),{type:'material',materialId:'MAT-PMMA-CAST'});
  const scenario=reduce(chosen,{type:'enter-scenario',incident});
  expect(scenario.materialConfirmed).toBe(false);expect(scenario.scenario?.suggestedMaterial).toBe(suggested);
  expect(scenario.input.electricFieldKvCm).toBe(0);expect(scenario.input.forcedFlowCms).toBe(0);
  expect(scenario.input.oxygenPct).toBeLessThanOrEqual(85);expect(scenario.input.pressureKpa).toBeLessThanOrEqual(202.6);
 });
 it('restores the full original mission, edited atmosphere, material and priorities after switching incidents',()=>{
  let original=reduce(initialSimulationSession(),{type:'mission',profile:'MARS_HABITAT_038G'});
  original=reduce(original,{type:'material',materialId:'MAT-SIBAL'});
  original=reduce(original,{type:'environment',key:'forcedFlowCms',value:17});
  original=reduce(original,{type:'weights',weights:[.1,.2,.3,.2,.2]});
  const before=structuredClone(original);
  let scenario=reduce(original,{type:'enter-scenario',incident:apollo13});
  scenario=reduce(scenario,{type:'material',materialId:'MAT-PTFE-TEFLON'});
  scenario=reduce(scenario,{type:'enter-scenario',incident:apollo1});
  expect(scenario.materialConfirmed).toBe(false);expect(scenario.scenario?.suggestedMaterial).toBe('MAT-VELCRO-NYLON');
  scenario=reduce(scenario,{type:'material',materialId:'MAT-VELCRO-NYLON'});
  expect(reduce(scenario,{type:'exit-scenario'})).toEqual(original);expect(original).toEqual(before);
 });
 it('restores an unselected state and guards mission presets during a scenario',()=>{
  const initial=initialSimulationSession(),scenario=reduce(initial,{type:'enter-scenario',incident:apollo1});
  expect(reduce(scenario,{type:'mission',profile:'ISS_TRANSIT_0G'})).toBe(scenario);
  expect(reduce(scenario,{type:'exit-scenario'})).toEqual(initial);
  expect(initial.weights).toEqual(MISSION_PROFILES.ARTEMIS_LUNAR_016G.weights);
 });
});
