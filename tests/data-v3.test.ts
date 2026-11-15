import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import canonical from '../src/data/psi_combustion_knowledge_base.json';
import { knowledgeBase, resolveCitation } from '../src/lib/knowledge-base';
import { extractEntities, graphNodes, queryKnowledgeGraph, searchKnowledgeCards } from '../src/lib/graphrag-engine';

describe('master Section 4 payload fidelity', () => {
  it('preserves the exact supplied v3 payload and all consolidated groups', () => {
    const raw = readFileSync(new URL('../src/data/psi_combustion_knowledge_base.json', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
    expect(createHash('sha256').update(raw).digest('hex')).toBe('c7e7b826dba44b4a65d61d149c98566dc5456f2af57755c7299d656c5044f026');
    expect(canonical.metadata.schema_version).toBe('3.0.0');
    expect(canonical.psi_investigations).toHaveLength(15);
    expect(canonical.spacecraft_materials).toHaveLength(6);
    expect(canonical.historical_incidents).toHaveLength(3);
    expect(canonical.earth_spinoffs).toHaveLength(3);
    expect(canonical.knowledge_cards).toHaveLength(18);
    expect(canonical.psi_investigations.filter((i) => i.status === 'planned').map((i) => i.id)).toEqual(['PSI-FM2-LUCI']);
    expect(canonical.psi_investigations.find((i) => i.id === 'PSI-FM2-LUCI')?.has_psi_data).toBe(false);
  });

  it('retains the v3 experiment envelopes, sensors, pillars and new s-Flame record', () => {
    const cfi = knowledgeBase.investigations.find((i) => i.id === 'PSI-159')!;
    expect(cfi.atmosphere).toMatchObject({ pressure_min_kpa: 50.3, o2_max_pct: 85, flow_velocity_max_cms: 15 });
    expect(knowledgeBase.investigations.some((i) => i.id === 'ACME-S-FLAME')).toBe(true);
    for (const investigation of knowledgeBase.investigations) {
      expect(investigation.sensors.length).toBeGreaterThan(0);
      expect(investigation.safety_pillars.length).toBeGreaterThan(0);
      expect(investigation.sub_hardware.length).toBeGreaterThan(0);
      expect(investigation.gravity_coverage.length).toBeGreaterThan(0);
      expect(investigation.quantitative_findings_raw).toEqual(canonical.psi_investigations.find((i) => i.id === investigation.id)?.quantitative_findings);
    }
  });

  it('keeps incident anchors distinct from separately stored educational interpolations', () => {
    for (const incident of knowledgeBase.historical_incidents) {
      const original = canonical.historical_incidents.find((i) => i.incident_id === incident.id)!;
      expect(incident.telemetry_anchors).toEqual(original.telemetry);
      expect(Array.isArray(original.telemetry)).toBe(false);
      expect(incident.telemetry_status).toMatch(/separat|not measured/i);
    }
  });
});

describe('citation resolution and independent evidence status', () => {
  it('resolves actual DOIs, source URLs and absent identifiers safely', () => {
    expect(resolveCitation('10.60555/0t15-1z43')).toEqual({ citationDoi: '10.60555/0t15-1z43', sourceUrl: 'https://doi.org/10.60555/0t15-1z43' });
    expect(resolveCitation('https://ntrs.nasa.gov/citations/20220007191')).toEqual({ citationDoi: null, sourceUrl: 'https://ntrs.nasa.gov/citations/20220007191' });
    expect(resolveCitation(null)).toEqual({ citationDoi: null, sourceUrl: null });
    expect(resolveCitation('unassigned')).toEqual({ citationDoi: null, sourceUrl: null });
  });

  it('does not turn supplied verified flags into independent verification', () => {
    expect(knowledgeBase.knowledge_cards.every((card) => card.verified)).toBe(true);
    const mirror = knowledgeBase.knowledge_cards.find((card) => card.id === 'kc-psi-access')!;
    expect(mirror.independent_verification.status).toBe('qualified');
    expect(mirror.independent_verification.notes).toMatch(/complete PSI combustion/i);
    const eclss = knowledgeBase.knowledge_cards.find((card) => card.id === 'kc-eclss-materials')!;
    expect(eclss.independent_verification.status).toBe('verified_primary_source');
    expect(eclss.independent_verification.sourceUrls).toContain('https://ntrs.nasa.gov/citations/20260003925');
  });
});

describe('expanded evidence retrieval', () => {
  it.each(['PSI-FM2', 'PSI-LUCI', 'FM2', 'LUCI'])('resolves %s to the combined planned group', (alias) => {
    expect(extractEntities(alias).investigationIds).toContain('PSI-FM2-LUCI');
    const result = queryKnowledgeGraph(alias);
    expect(result.rankings).toHaveLength(15);
    expect(result.traversedNodeIds).toContain('PSI-FM2-LUCI');
    expect(result.citations.every((citation) => !citation.url.includes('doi.org/https'))).toBe(true);
  });

  it.each(canonical.knowledge_cards.map((card) => [card.id, card.source_urls[0]]))('retrieves and cites %s by its exact identifier', (id, sourceUrl) => {
    const result = queryKnowledgeGraph(id);
    expect(result.knowledgeCards.some((card) => card.id === id)).toBe(true);
    expect(result.extracted.knowledgeCardIds).toContain(id);
    expect(result.traversedNodeIds).toContain(id);
    expect(result.citations.some((citation) => citation.id === id && citation.url === sourceUrl)).toBe(true);
    expect(graphNodes.find((node) => node.id === id)?.recordKind).toBe('knowledgeCard');
  });

  it.each([
    ['How does the 2026 ECLSS 70% material replacement study affect design?', 'kc-eclss-materials'],
    ['What did ICES-2026-092 validate using FDS?', 'kc-ices2026-model'],
    ['What is oxygen partial pressure pO2 compared with ISS air?', 'kc-ppo2'],
    ['Was the Artemis II Orion smoke alarm caused by lunar dust?', 'kc-artemis2-alarm'],
    ['Where is the AWS PSI mirror?', 'kc-psi-access'],
    ['Are rocket propellant engines in scope?', 'kc-scope'],
  ])('retrieves %s through text and subject aliases', (query, expectedId) => {
    const result = queryKnowledgeGraph(query);
    expect(result.knowledgeCards[0].id).toBe(expectedId);
    expect(result.sections.some((section) => section.body.includes('Independent source check'))).toBe(true);
    expect(result.citations.some((citation) => citation.id === expectedId)).toBe(true);
  });

  it('keeps lexical retrieval bounded and does not invent semantic confidence', () => {
    expect(searchKnowledgeCards('ECLSS NASA 2026', 1)).toHaveLength(1);
    expect(searchKnowledgeCards('xyzzy quux unknown')).toEqual([]);
    expect(searchKnowledgeCards('ECLSS')[0].retrievalScore).toBeGreaterThan(0);
    const scope = queryKnowledgeGraph('rocket propellant engine');
    expect(scope.extracted.notes.join(' ')).toMatch(/outside PyroZero.*habitat-fire scope/i);
  });
});
