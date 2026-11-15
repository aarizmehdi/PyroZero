import { describe, expect, it } from 'vitest';
import {
  executeCypher, extractEntities, graphEdges, graphNodes, knowledgeBase,
  PRESET_PROMPTS, queryKnowledgeGraph, traverseGraph, TRAVERSAL_CYPHER,
} from '../src/lib/graphrag-engine';
import { MISSION_PROFILES, simulatePartialGravityFlammability } from '../src/lib/pyrozero-engine';

describe('evidence catalogue completeness and provenance', () => {
  it('contains each required consolidated investigation and full atmosphere metadata', () => {
    expect(knowledgeBase.investigations.map(i=>i.id).sort()).toEqual([
      'PSI-159','ACME-E-FIELD','ACME-BRE','PSI-10','PSI-60','PSI-25',
      'PSI-98','SAFFIRE-IV-VI','SOFIE-RTDFS-NCA','SOFIE-SMURF-MIST-GEL','PSI-69','PSI-102',
      'ACME-S-FLAME','PSI-DAFT','PSI-FM2-LUCI',
    ].sort());
    for (const record of knowledgeBase.investigations) {
      for (const key of ['title','code','doi','facility','burner_geometry','fuel_phase','primary_publication_doi','evidence_status'] as const) expect(record[key].length).toBeGreaterThan(0);
      expect(record.pi_lead.length).toBeGreaterThan(0);
      expect(record.materials_tested.length).toBeGreaterThan(0);
      expect(record.quantitative_findings.length).toBeGreaterThan(0);
      expect(record.sourceIds.length).toBeGreaterThan(0);
      const a=record.atmosphere;
      expect(a.pressure_min_kpa).toBeLessThanOrEqual(a.pressure_max_kpa);
      expect(a.o2_min_pct).toBeLessThanOrEqual(a.o2_max_pct);
      expect(a.flow_velocity_min_cms).toBeLessThanOrEqual(a.flow_velocity_max_cms);
      expect(a.diluents.length).toBeGreaterThan(0);
    }
  });
  it('contains all materials, incidents and technology transfers without empty timelines', () => {
    expect(knowledgeBase.spacecraft_materials.map(m=>m.id).sort()).toEqual([
      'MAT-PMMA-CAST','MAT-SIBAL','MAT-NOMEX-HT90','MAT-VELCRO-NYLON','MAT-PTFE-TEFLON','MAT-BETA-PBI',
    ].sort());
    expect(knowledgeBase.historical_incidents).toHaveLength(3);
    expect(knowledgeBase.earth_spinoffs).toHaveLength(3);
    for (const incident of knowledgeBase.historical_incidents) {
      expect(incident.telemetry_status).toMatch(/reconstruct|interpolat/i);
      expect(incident.telemetry[0].timeS).toBe(0);
      expect(incident.telemetry.at(-1)!.timeS).toBe(incident.durationS);
      expect(incident.engineering_reforms.length).toBeGreaterThan(0);
      incident.telemetry.forEach((point,index)=>{
        expect(Number.isFinite(point.pressureKpa)).toBe(true);
        expect(Number.isFinite(point.temperatureK)).toBe(true);
        if(index) expect(point.timeS).toBeGreaterThan(incident.telemetry[index-1].timeS);
      });
    }
    expect(knowledgeBase.provenance.telemetry_status).toMatch(/not recovered/i);
    expect(knowledgeBase.provenance.scope).toMatch(/not a complete export/i);
  });
});

describe('entity extraction and engineering units', () => {
  it('parses the lunar two-material question without dropping pressure conversion', () => {
    const e=extractEntities(PRESET_PROMPTS[0]);
    expect(e.materialIds).toEqual(['MAT-PMMA-CAST','MAT-NOMEX-HT90']);
    expect(e.parameters.pressureKpa).toBeCloseTo(8.2*6.894757,6);
    expect(e.parameters.oxygenPct).toBe(34);
    expect(e.parameters.forcedFlowCms).toBe(5);
    expect(e.parameters.gravityG).toBe(0.165);
  });
  it('converts atm and reads reverse oxygen syntax, E field and a gravity token', () => {
    const e=extractEntities('PMMA at oxygen: 30%, 1 atm, 8 cm s-1, 0.38g, 1.2 kV/cm');
    expect(e.parameters).toMatchObject({materialId:'MAT-PMMA-CAST',oxygenPct:30,pressureKpa:101.325,forcedFlowCms:8,gravityG:0.38,electricFieldKvCm:1.2});
  });
  it('retains active parameters only when no named mission overrides them', () => {
    const active={...MISSION_PROFILES.MARS_HABITAT_038G.input,forcedFlowCms:17};
    expect(extractEntities('Compare PMMA and Nomex',active).parameters).toMatchObject({gravityG:0.38,forcedFlowCms:17});
    expect(extractEntities('PMMA on ISS transit',active).parameters).toMatchObject({gravityG:0,forcedFlowCms:15});
  });
  it('matches exact PSI IDs without inventing a prefix investigation', () => {
    expect(extractEntities('Show PSI-102').investigationIds).toEqual(['PSI-102']);
    expect(extractEntities('Show PSI-250').investigationIds).toEqual([]);
  });
  it.each(['PMMA -5 cm/s','PMMA -20% O2','PMMA -60 kPa','PMMA -0.5g','PMMA -1.2 kV/cm','PMMA at 100% oxygen','PMMA at 500 kPa'])(
    'rejects invalid explicit input instead of silently changing its meaning: %s', query=>{
      expect(()=>queryKnowledgeGraph(query)).toThrow();
    },
  );
});

describe('bounded citation-grounded graph retrieval', () => {
  it('has all six node kinds and seven directed relation kinds with no dangling endpoints', () => {
    expect(new Set(graphNodes.map(n=>n.type)).size).toBe(6);
    expect(new Set(graphEdges.map(e=>e.type)).size).toBe(7);
    const ids=new Set(graphNodes.map(n=>n.id));
    expect(ids.size).toBe(graphNodes.length);
    expect(new Set(graphEdges.map(e=>e.id)).size).toBe(graphEdges.length);
    for (const e of graphEdges) {expect(ids.has(e.source)).toBe(true);expect(ids.has(e.target)).toBe(true);}
    const sourceIds=new Set(knowledgeBase.sources.map(s=>s.id));
    for(const node of graphNodes)for(const id of node.sourceIds)expect(sourceIds.has(id)).toBe(true);
  });
  it('exposes a read-only bounded traversal and rejects unsupported Cypher', () => {
    expect(executeCypher(TRAVERSAL_CYPHER,{ids:['MAT-PTFE-TEFLON']})).toEqual(traverseGraph(['MAT-PTFE-TEFLON'],2));
    expect(traverseGraph(['missing'],2)).toEqual({nodes:[],edges:[]});
    expect(traverseGraph(['PSI-102'],0).nodes.map(n=>n.id)).toEqual(['PSI-102']);
    expect(()=>executeCypher('MATCH (n) DELETE n',{ids:[]})).toThrow(/unsupported/i);
  });
  it('computes both compared material screens from extracted conditions and cites relevant research', () => {
    const result=queryKnowledgeGraph(PRESET_PROMPTS[0]);
    expect(result.simulations).toHaveLength(2);
    for (const simulation of result.simulations) expect(simulation.result).toEqual(simulatePartialGravityFlammability({...result.extracted.parameters,materialId:simulation.materialId}));
    expect(result.citations.some(c=>c.id==='SAFFIRE-IV-VI')).toBe(true);
    expect(result.citations.every(c=>/^https:\/\//.test(c.url)&&c.evidenceStatus.length>0)).toBe(true);
    expect(result.sections.map(s=>s.body).join(' ')).toMatch(/physical NASA-STD-6001 testing/i);
    expect(result.rankings).toHaveLength(15);
    expect(result.stages).toHaveLength(3);
  });
  it('retrieves smoke research and labels unverified percentage claims explicitly', () => {
    const result=queryKnowledgeGraph(PRESET_PROMPTS[1]);
    expect(result.traversedNodeIds).toContain('PSI-102');
    expect(result.citations.some(c=>c.id==='PSI-102')).toBe(true);
    expect(result.sections.map(s=>s.body).join(' ')).toMatch(/not been independently audited/i);
  });
  it('answers all five presets with finite results and a traceable evidence path', () => {
    for (const prompt of PRESET_PROMPTS) {
      const result=queryKnowledgeGraph(prompt);
      expect(result.traversedNodeIds.length).toBeGreaterThan(0);
      expect(result.traversedEdgeIds.length).toBeGreaterThan(0);
      expect(result.citations.length).toBeGreaterThan(0);
      for(const s of result.simulations)expect(Number.isFinite(s.result.limitingOxygenConcentrationPct)).toBe(true);
    }
  });
  it('does not pretend an unrelated question was answered by default physics', () => {
    const result=queryKnowledgeGraph('What is the capital of France?');
    expect(result.sections.map(s=>s.body).join(' ')).toMatch(/not evidence answering an unrelated question/i);
    expect(()=>queryKnowledgeGraph(' ')).toThrow(/enter/i);
  });
});
