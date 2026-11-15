import { MATERIAL_PARAMS, MISSION_PROFILES, type MaterialId, type SimulationInput, type Weights } from './pyrozero-engine';
import { knowledgeBase } from './knowledge-base';

export type ProfileId = keyof typeof MISSION_PROFILES;
type Incident = typeof knowledgeBase.historical_incidents[number];
export interface ScenarioContext {
  id:string; title:string; reportedOxygenPct:number; reportedPressureKpa:number;
  suggestedMaterial:MaterialId|null; materialNote:string; boundaryNote:string;
}
interface Snapshot {profile:ProfileId;input:SimulationInput;weights:Weights;materialConfirmed:boolean}
export interface SimulationSession extends Snapshot {scenario:ScenarioContext|null;previous:Snapshot|null}
export type SessionAction =
  | {type:'material';materialId:MaterialId}
  | {type:'environment';key:Exclude<keyof SimulationInput,'materialId'>;value:number}
  | {type:'mission';profile:ProfileId}
  | {type:'weights';weights:Weights}
  | {type:'enter-scenario';incident:Incident}
  | {type:'exit-scenario'};

export function initialSimulationSession():SimulationSession {
  const profile='ARTEMIS_LUNAR_016G';
  return {profile,input:{...MISSION_PROFILES[profile].input},weights:[...MISSION_PROFILES[profile].weights],materialConfirmed:false,scenario:null,previous:null};
}
export function boundedScenario(incident:Incident) {
  const oxygenPct=Math.min(85,Math.max(13,incident.atmosphere.oxygenPct));
  const pressureKpa=Math.min(202.6,Math.max(29.6,incident.atmosphere.pressureKpa));
  const suggestedMaterial:MaterialId|null=incident.id==='INC-APOLLO-1'?'MAT-VELCRO-NYLON':incident.id==='INC-APOLLO-13'?'MAT-PTFE-TEFLON':null;
  const materialNote=incident.id==='INC-APOLLO-1'
    ? 'The incident record lists nylon/Velcro among several primary fuels. Velcro Nylon is a catalogue analogue; choose it explicitly or evaluate another material.'
    :incident.id==='INC-APOLLO-13'
    ? 'The incident record identifies PTFE wire insulation. The PTFE specimen screen does not model the cryogenic oxygen tank or its ignition mechanism.'
    : 'The oxygen-generator cartridge and its reported fuels are not represented by this solid-material catalogue. A material choice here is an exploratory comparison.';
  const bounded=oxygenPct!==incident.atmosphere.oxygenPct||pressureKpa!==incident.atmosphere.pressureKpa;
  const boundaryNote=bounded
    ? `Reported ${incident.atmosphere.oxygenPct}% O₂ and ${incident.atmosphere.pressureKpa.toFixed(1)} kPa exceed the model bounds. This screen uses ${oxygenPct}% O₂ and ${pressureKpa.toFixed(1)} kPa; it does not reconstruct the accident.`
    : 'Reported atmosphere, with 0 cm/s imposed flow for this bounded screen. This does not reconstruct the accident.';
  return {context:{id:incident.id,title:incident.title,reportedOxygenPct:incident.atmosphere.oxygenPct,reportedPressureKpa:incident.atmosphere.pressureKpa,suggestedMaterial,materialNote,boundaryNote},input:{gravityG:incident.atmosphere.gravityG,oxygenPct,pressureKpa,forcedFlowCms:0,electricFieldKvCm:0}};
}
export function simulationSessionReducer(state:SimulationSession,action:SessionAction):SimulationSession {
  switch(action.type){
    case 'material':return MATERIAL_PARAMS[action.materialId]?{...state,input:{...state.input,materialId:action.materialId},materialConfirmed:true}:state;
    case 'environment':return {...state,input:{...state.input,[action.key]:action.value}};
    case 'weights':return {...state,weights:[...action.weights]};
    case 'mission':return state.scenario?state:{...state,profile:action.profile,input:{...MISSION_PROFILES[action.profile].input,materialId:state.input.materialId},weights:[...MISSION_PROFILES[action.profile].weights]};
    case 'enter-scenario':{
      const {context,input}=boundedScenario(action.incident);
      const previous=state.previous??{profile:state.profile,input:{...state.input},weights:[...state.weights] as Weights,materialConfirmed:state.materialConfirmed};
      return {...state,input:{...input,materialId:context.suggestedMaterial??'MAT-PMMA-CAST'},scenario:context,materialConfirmed:false,previous};
    }
    case 'exit-scenario':return state.previous?{...state.previous,input:{...state.previous.input},weights:[...state.previous.weights],scenario:null,previous:null}:state;
  }
}
