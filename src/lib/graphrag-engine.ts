import { knowledgeBase as data } from "./knowledge-base";
import {
  MATERIAL_PARAMS,
  MISSION_PROFILES,
  rankPsiInvestigations,
  simulatePartialGravityFlammability,
  type MaterialId,
  type SimulationInput,
} from "./pyrozero-engine";

export const knowledgeBase = data;
export type Investigation = (typeof knowledgeBase.investigations)[number];
export type Incident = (typeof knowledgeBase.historical_incidents)[number];
export type MissionId = keyof typeof MISSION_PROFILES;
export type NodeType = "Investigation" | "FuelMaterial" | "AtmosphericCondition" | "HistoricalFailure" | "Countermeasure" | "EarthApplication";
export type EdgeType = "TESTED_MATERIAL" | "TESTED_AT" | "REVEALS_HAZARD" | "MITIGATED_BY" | "ENABLES" | "INFORMS" | "SUPPORTS";
export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  description: string;
  sourceIds: string[];
  recordKind?: "knowledgeCard";
}
export interface GraphEdge { id: string; source: string; target: string; type: EdgeType }
export interface Citation { id: string; label: string; doi?: string; url: string; evidenceStatus: string }

const investigationNodes: GraphNode[] = data.investigations.map((i) => ({
  id: i.id, label: i.code, type: "Investigation", sourceIds: i.sourceIds,
  description: `${i.title} · ${i.facility} · ${i.status.toUpperCase()}. ${i.quantitative_findings.join(" ")} Evidence: ${i.evidence_status}.`,
}));
const materialNodes: GraphNode[] = data.spacecraft_materials.map((m) => ({
  id: m.id, label: m.shortName, type: "FuelMaterial", sourceIds: m.sourceIds,
  description: `${m.name}. ${m.application}. ${m.evidence_status}.`,
}));
const atmosphereNodes: GraphNode[] = data.investigations.map((i) => ({
  id: `ATM-${i.id}`, label: `${i.atmosphere.o2_min_pct}–${i.atmosphere.o2_max_pct}% O₂`,
  type: "AtmosphericCondition", sourceIds: i.sourceIds,
  description: `${i.code}: ${i.atmosphere.pressure_min_kpa}–${i.atmosphere.pressure_max_kpa} kPa; ${i.atmosphere.flow_velocity_min_cms}–${i.atmosphere.flow_velocity_max_cms} cm/s. ${i.status === "planned" ? "Planned target envelope, not released lunar-surface telemetry." : "Aggregated ranges do not imply every parameter combination was tested."}`,
}));
const missionNodes: GraphNode[] = Object.values(MISSION_PROFILES).map((m) => ({
  id: m.id, label: m.shortName, type: "AtmosphericCondition", sourceIds: [],
  description: `${m.name}: ${m.input.gravityG}g, ${m.input.pressureKpa} kPa, ${m.input.oxygenPct}% oxygen. Project mission preset and research proxy.`,
}));
const incidentNodes: GraphNode[] = data.historical_incidents.map((i) => ({
  id: i.id, label: i.title, type: "HistoricalFailure", sourceIds: i.sourceIds,
  description: `${i.summary} ${i.telemetry_status}`,
}));
const countermeasureNodes: GraphNode[] = data.earth_spinoffs.map((s) => ({
  id: s.id, label: s.title, type: "Countermeasure", sourceIds: s.sourceIds, description: `${s.summary} ${s.evidence_status}`,
}));
const applicationNodes: GraphNode[] = data.earth_spinoffs.map((s) => ({
  id: `EARTH-${s.id}`, label: s.earth_applications[0], type: "EarthApplication", sourceIds: s.sourceIds,
  description: s.earth_applications.join(" · "),
}));
const knowledgeCardNodes: GraphNode[] = data.knowledge_cards.map((card) => ({
  id: card.id, label: card.title, type: "Countermeasure", recordKind: "knowledgeCard", sourceIds: card.sourceIds,
  description: `Safety knowledge reference (${card.pillars.join(", ")}). ${card.text} Independent check: ${card.independent_verification.status}. ${card.independent_verification.notes}`,
}));
export const graphNodes: GraphNode[] = [...investigationNodes, ...materialNodes, ...atmosphereNodes, ...missionNodes, ...incidentNodes, ...countermeasureNodes, ...applicationNodes, ...knowledgeCardNodes];
const edge = (source: string, target: string, type: EdgeType): GraphEdge => ({ id: `${source}::${type}::${target}`, source, target, type });
const knowledgeCardLinks: Record<string, string[]> = {
  "kc-0g-flame-shape": ["PSI-159", "ACME-S-FLAME"],
  "kc-slow-flow": ["PSI-25"],
  "kc-cool-flames": ["PSI-159", "PSI-69"],
  "kc-smoke-coagulation": ["PSI-102"],
  "kc-dust-baseline": ["PSI-DAFT", "PSI-102", "SPIN-DUST-SMOKE"],
  "kc-ea-atmospheres": ["ARTEMIS_LUNAR_016G", "MARS_HABITAT_038G"],
  "kc-ppo2": ["ISS_TRANSIT_0G", "ARTEMIS_LUNAR_016G", "EVA_SPACESUIT_HIGH_O2"],
  "kc-partial-g-gap": ["PSI-FM2-LUCI", "ACME-E-FIELD"],
  "kc-saffire-matrix": ["SAFFIRE-IV-VI"],
  "kc-fm2-prelim": ["PSI-FM2-LUCI"],
  "kc-eclss-materials": ["ARTEMIS_LUNAR_016G", "MAT-PMMA-CAST", "MAT-NOMEX-HT90"],
  "kc-ices2026-model": ["SAFFIRE-IV-VI", "PSI-98"],
  "kc-halon-mist": ["SPIN-FWM-PFE", "PSI-69"],
  "kc-artemis2-alarm": ["SPIN-DUST-SMOKE", "PSI-DAFT"],
  "kc-history": ["INC-APOLLO-1", "INC-APOLLO-13", "INC-MIR-1997"],
  "kc-hardware-sharing": ["ACME-S-FLAME", "PSI-102", "PSI-98"],
  "kc-psi-access": ["PSI-DAFT", "PSI-159"],
  "kc-scope": ["ISS_TRANSIT_0G", "ARTEMIS_LUNAR_016G"],
};
export const graphEdges: GraphEdge[] = [
  ...data.investigations.flatMap((i) => [
    edge(i.id, `ATM-${i.id}`, i.status === "planned" ? "SUPPORTS" : "TESTED_AT"),
    ...("material_ids" in i ? (i.material_ids ?? []).map((id) => edge(i.id, id, "TESTED_MATERIAL")) : []),
  ]),
  ...data.investigations.filter((i) => i.models_buoyancy_scaling).flatMap((i) => [
    edge(i.id, "ARTEMIS_LUNAR_016G", "SUPPORTS"), edge(i.id, "MARS_HABITAT_038G", "SUPPORTS"),
  ]),
  edge("PSI-98", "ISS_TRANSIT_0G", "SUPPORTS"),
  edge("SOFIE-RTDFS-NCA", "EVA_SPACESUIT_HIGH_O2", "SUPPORTS"),
  edge("MAT-VELCRO-NYLON", "INC-APOLLO-1", "REVEALS_HAZARD"),
  edge("MAT-PTFE-TEFLON", "INC-APOLLO-13", "REVEALS_HAZARD"),
  edge("INC-APOLLO-1", "SPIN-SCBA-PBI", "MITIGATED_BY"),
  edge("INC-APOLLO-13", "SPIN-SCBA-PBI", "INFORMS"),
  edge("INC-MIR-1997", "SPIN-FWM-PFE", "MITIGATED_BY"),
  edge("INC-MIR-1997", "SPIN-DUST-SMOKE", "INFORMS"),
  edge("PSI-102", "SPIN-DUST-SMOKE", "INFORMS"),
  edge("PSI-69", "SPIN-FWM-PFE", "INFORMS"),
  edge("PSI-25", "SPIN-FWM-PFE", "INFORMS"),
  ...data.earth_spinoffs.map((s) => edge(s.id, `EARTH-${s.id}`, "ENABLES")),
  ...Object.entries(knowledgeCardLinks).flatMap(([id, targets]) => targets.map((target) => edge(id, target, "INFORMS"))),
];

export const PRESET_PROMPTS = [
  "Will a 10-mm PMMA window or Nomex divider propagate a fire in the Artemis Lunar Habitat at 34% O₂ and 8.2 psia if the fan drops to 5 cm/s?",
  "Why did the ISS near-IR smoke detector miss 66.7% of Teflon pyrolysis tests in SAME, and how does the 650nm polarimetric detector help?",
  "Compare ACME E-FIELD ion-wind equivalent gravity at 1.0 kV/cm against Lunar 0.165g buoyancy.",
  "Why can a material that passes a 1g screen still spread flame in microgravity? Compare BASS and SoFIE for PMMA.",
  "What connects the Mir 1997 fire, fine water mist extinguishers, and terrestrial data-center fire suppression?",
] as const;

const materialAliases: [MaterialId, RegExp][] = [
  ["MAT-PMMA-CAST", /pmma|acrylic|polymethyl/i],
  ["MAT-SIBAL", /sibal|cotton|fiberglass fabric/i],
  ["MAT-NOMEX-HT90", /nomex|aramid|divider/i],
  ["MAT-VELCRO-NYLON", /velcro|nylon|hook.and.loop/i],
  ["MAT-PTFE-TEFLON", /ptfe|teflon/i],
  ["MAT-BETA-PBI", /beta\s*cloth|\bpbi\b|spacesuit outer/i],
];

export interface ExtractedEntities {
  materialIds: MaterialId[];
  missionId: MissionId;
  parameters: SimulationInput;
  investigationIds: string[];
  knowledgeCardIds: string[];
  seedNodeIds: string[];
  parsedParameters: string[];
  notes: string[];
}

const searchStopwords = new Set(["a", "an", "the", "and", "or", "of", "to", "in", "on", "at", "is", "are", "for", "with", "how", "why", "what", "does", "do", "will", "can", "from", "that", "this", "it", "its", "as", "by", "show", "compare", "nasa", "fire", "space", "spacecraft"]);
function searchTerms(text: string) {
  return [...new Set(text.toLowerCase().replace(/o₂/g, "o2").match(/[a-z0-9]+(?:[.-][a-z0-9]+)*/g) ?? [])].filter((word) => word.length > 2 && !searchStopwords.has(word));
}

/** Bounded lexical retrieval complements entity aliases and graph traversal.
 * Scores are term matches, not semantic model probabilities. */
export function searchKnowledgeCards(query: string, limit = 6) {
  const terms = searchTerms(query);
  const aliases: Record<string, RegExp> = {
    "kc-eclss-materials": /eclss|70\s*%|20260003925/i,
    "kc-ices2026-model": /\bfds\b|20260001600|ices.?2026.?092|fire dynamics/i,
    "kc-artemis2-alarm": /artemis\s*(?:ii|2)\b|orion.*alarm|camera.*flash/i,
    "kc-ppo2": /partial.pressure|\bppo2\b|\bpo2\b|p[oO]₂/i,
    "kc-fm2-prelim": /\bfm2\b|\bluci\b|20240015307/i,
    "kc-psi-access": /\baws\b|s3|open.data|mirror|psi.access/i,
    "kc-scope": /rocket|propellant|out.of.scope/i,
    "kc-dust-baseline": /\bdaft\b|dust.baseline/i,
  };
  return data.knowledge_cards.map((card) => {
    const titleTerms = new Set(searchTerms(card.title));
    const bodyTerms = new Set(searchTerms(card.text));
    const matchedTerms = terms.filter((term) => titleTerms.has(term) || bodyTerms.has(term));
    const score = (query.toLowerCase().includes(card.id) ? 100 : 0) + (aliases[card.id]?.test(query) ? 40 : 0) + matchedTerms.reduce((sum, term) => sum + (titleTerms.has(term) ? 4 : 1), 0);
    return { ...card, retrievalScore: score, matchedTerms };
  }).filter((card) => card.retrievalScore >= 3).sort((a, b) => b.retrievalScore - a.retrievalScore || a.id.localeCompare(b.id)).slice(0, Math.max(0, Math.min(18, limit)));
}

export function extractEntities(query: string, defaults?: Partial<SimulationInput>): ExtractedEntities {
  let missionId: MissionId = "ISS_TRANSIT_0G";
  if (/artemis|lunar|moon/i.test(query)) missionId = "ARTEMIS_LUNAR_016G";
  if (/mars|martian/i.test(query)) missionId = "MARS_HABITAT_038G";
  if (/\beva\b|spacesuit loop/i.test(query)) missionId = "EVA_SPACESUIT_HIGH_O2";
  if (/artemis\s*(?:ii|2)\b/i.test(query)) missionId = "ISS_TRANSIT_0G";
  const materialIds = materialAliases.filter(([id, pattern]) => pattern.test(query) || query.toUpperCase().includes(id)).map(([id]) => id);
  const hasMission = /artemis|lunar|moon|mars|martian|\beva\b|spacesuit loop|\biss\b|transit/i.test(query);
  const parameters: SimulationInput = { ...MISSION_PROFILES[missionId].input, ...(!hasMission ? defaults : {}), materialId: materialIds[0] ?? defaults?.materialId ?? "MAT-PMMA-CAST" };
  const notes: string[] = [];
  const parsedParameters: string[] = [];
  const set = (name: keyof Omit<SimulationInput, "materialId">, value: number, label: string) => {
    if (Number.isFinite(value)) { parameters[name] = value; parsedParameters.push(label); }
  };
  const oxygen = query.match(/([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*%\s*(?:o[₂2]|oxygen)/i) ?? query.match(/(?:oxygen|o[₂2])\s*(?:of|at|=|:)?\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*%/i);
  if (oxygen) set("oxygenPct", Number(oxygen[1]), "oxygen");
  const pressure = query.match(/([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(kpa|psia?|atm)\b/i);
  if (pressure) set("pressureKpa", Number(pressure[1]) * (/psi/i.test(pressure[2]) ? 6.894757 : /atm/i.test(pressure[2]) ? 101.325 : 1), "pressure");
  const flow = query.match(/([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*cm\s*(?:\/\s*s|s[-−]?1)/i);
  if (flow) set("forcedFlowCms", Number(flow[1]), "forced flow");
  const gravity = query.match(/(?<![\w.+-])([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*g\b/i);
  if (gravity) set("gravityG", Number(gravity[1]), "gravity");
  if (!gravity && /microgravity|zero.gravity|\b0g\b/i.test(query)) set("gravityG", 0, "microgravity");
  const field = query.match(/([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*kv\s*\/\s*cm/i);
  if (field) set("electricFieldKvCm", Number(field[1]), "electric field");
  const investigationIds = data.investigations.filter((i) => {
    const ids: string[] = [i.id, i.code, ...("related_psi_ids" in i ? i.related_psi_ids ?? [] : [])];
    return ids.some((id) => new RegExp(`(?:^|[^A-Z0-9])${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Z0-9])`, "i").test(query)) ||
      (i.id === "PSI-25" && /\bbass\b/i.test(query)) ||
      (i.id === "PSI-102" && /\bsame\b|near.ir|smoke detector|polarimet/i.test(query)) ||
      (i.id === "PSI-69" && /\bflex\b|cool.flame|droplet/i.test(query)) ||
      (i.id === "SOFIE-SMURF-MIST-GEL" && /\bsofie\b|noms|negative oxygen/i.test(query)) ||
      (i.id === "PSI-98" && /\bsaffire\b/i.test(query)) ||
      (i.id === "ACME-S-FLAME" && /\bs[-\s]?flame\b/i.test(query)) ||
      (i.id === "PSI-DAFT" && /\bdaft(?:-2)?\b/i.test(query)) ||
      (i.id === "PSI-FM2-LUCI" && /\b(?:psi-)?(?:fm2|luci)\b/i.test(query));
  }).map((i) => i.id);
  const extraSeeds: string[] = [];
  if (/apollo\s*1(?!3)/i.test(query)) extraSeeds.push("INC-APOLLO-1");
  if (/apollo\s*13/i.test(query)) extraSeeds.push("INC-APOLLO-13");
  if (/\bmir\b/i.test(query)) extraSeeds.push("INC-MIR-1997");
  if (/water.?mist|extinguisher|doering|droplet spectrum/i.test(query)) extraSeeds.push("SPIN-FWM-PFE");
  if (/smoke detector|polarimet|dust|scattering/i.test(query)) extraSeeds.push("SPIN-DUST-SMOKE");
  if (/scba|breathing apparatus|firefighter|pbi/i.test(query)) extraSeeds.push("SPIN-SCBA-PBI");
  const knowledgeCardIds = searchKnowledgeCards(query).map((card) => card.id);
  if (!materialIds.length) notes.push(`No explicit solid material matched; physics uses the active/default ${MATERIAL_PARAMS[parameters.materialId].shortName} specimen.`);
  if (!hasMission) notes.push("No explicit mission matched; active simulation parameters or the ISS preset are used.");
  if (!materialIds.length && !investigationIds.length && !extraSeeds.length && !hasMission && !knowledgeCardIds.length) notes.push("No catalogue entity matched. This result is a default-parameter calculation, not evidence answering an unrelated question.");
  if (/rocket|propellant/i.test(query)) notes.push("Rocket-engine and propellant calculations are outside PyroZero's habitat-fire scope; default material calculations below do not predict rocket behavior.");
  return { materialIds, missionId, parameters, investigationIds, knowledgeCardIds, parsedParameters, notes,
    seedNodeIds: [...new Set([...materialIds, ...investigationIds, ...extraSeeds, ...knowledgeCardIds, ...(hasMission ? [missionId] : [])])],
  };
}

/** Undirected neighborhood retrieval preserves each returned edge's original direction. */
export function traverseGraph(seedIds: string[], hops = 2) {
  const existing = new Set(graphNodes.map((n) => n.id));
  const visited = new Set(seedIds.filter((id) => existing.has(id)));
  let frontier = [...visited];
  const traversedEdges = new Set<string>();
  for (let depth = 0; depth < Math.min(2, Math.max(0, Math.floor(hops))); depth++) {
    const next = new Set<string>();
    for (const id of frontier) for (const e of graphEdges) {
      if (e.source !== id && e.target !== id) continue;
      traversedEdges.add(e.id);
      const neighbor = e.source === id ? e.target : e.source;
      if (!visited.has(neighbor)) next.add(neighbor);
    }
    next.forEach((id) => visited.add(id));
    frontier = [...next];
  }
  return { nodes: graphNodes.filter((n) => visited.has(n.id)), edges: graphEdges.filter((e) => traversedEdges.has(e.id)) };
}

/** A bounded, read-only Cypher subset; unsupported queries are rejected explicitly. */
export function executeCypher(query: string, parameters: { ids: string[] }) {
  if (!/^MATCH \(seed\) WHERE seed\.id IN \$ids MATCH p=\(seed\)-\[\*1\.\.2\]-\(neighbor\) RETURN DISTINCT nodes\(p\), relationships\(p\)$/.test(query.trim())) {
    throw new Error("Unsupported query. This client implements only parameterized two-hop read traversal.");
  }
  return traverseGraph(parameters.ids, 2);
}

export const TRAVERSAL_CYPHER = "MATCH (seed) WHERE seed.id IN $ids MATCH p=(seed)-[*1..2]-(neighbor) RETURN DISTINCT nodes(p), relationships(p)";

export function queryKnowledgeGraph(query: string, defaults?: Partial<SimulationInput>, options: {requireExplicitMaterial?:boolean} = {}) {
  if (!query.trim()) throw new Error("Enter an engineering question to query the catalogue.");
  const extracted = extractEntities(query.slice(0, 8000), defaults);
  const input = extracted.parameters;
  const hasMaterial=!options.requireExplicitMaterial||extracted.materialIds.length>0||!!defaults?.materialId;
  const materialContext=extracted.materialIds.length?'question':defaults?.materialId?'selection':hasMaterial?'default':'unselected';
  if(!hasMaterial){extracted.notes=extracted.notes.filter(note=>!note.includes('physics uses the active/default')).map(note=>note.replace('This result is a default-parameter calculation, not evidence answering an unrelated question.','No material calculation is performed; this does not establish evidence for an unrelated question.').replace('default material calculations below do not predict rocket behavior','no rocket calculation is performed'));extracted.notes.push('No material was selected or named. Material predictions are omitted. Choose a material to add a calculated screen.')}
  const rankings = rankPsiInvestigations(data.investigations, input, MISSION_PROFILES[extracted.missionId].weights);
  const seeds = extracted.seedNodeIds.length ? extracted.seedNodeIds : [...(hasMaterial?[input.materialId]:[]), rankings[0].id];
  const subgraph = executeCypher(TRAVERSAL_CYPHER, { ids: seeds });
  const materialIds: MaterialId[] = !hasMaterial?[]:extracted.materialIds.length ? extracted.materialIds : [input.materialId];
  const simulations = materialIds.map((materialId) => ({
    materialId, name: MATERIAL_PARAMS[materialId].shortName,
    result: simulatePartialGravityFlammability({ ...input, materialId }),
  }));
  const relatedInvestigations = data.investigations.filter((i) => subgraph.nodes.some((n) => n.id === i.id));
  const citedInvestigations = relatedInvestigations.length ? relatedInvestigations : rankings.slice(0, 3);
  const citations: Citation[] = citedInvestigations.flatMap((i) => i.sourceUrl ? [{ id: i.id, label: `${i.id} / ${i.code}`, ...(i.citationDoi ? { doi: i.citationDoi } : {}), url: i.sourceUrl, evidenceStatus: i.evidence_status }] : []);
  const knowledgeCards = searchKnowledgeCards(query);
  for (const card of knowledgeCards) {
    for (const [index, url] of card.sourceUrls.entries()) citations.push({ id: index === 0 ? card.id : `${card.id}-${index}`, label: card.title, url, evidenceStatus: `${card.independent_verification.status}: ${card.independent_verification.notes}` });
  }
  const sourceIds = [...new Set(subgraph.nodes.flatMap((n) => n.sourceIds))];
  for (const id of sourceIds) {
    const source = data.sources.find((s) => s.id === id);
    if (source && !citations.some((c) => c.url === source.url)) citations.push({ id, label: source.title, url: source.url, evidenceStatus: source.status });
  }
  const statuses = simulations.map((s) => `${s.name}: ${s.result.status}`).join(" · ");
  const sections: { title: string; body: string }[] = [{
    title: "Computed material screen",
    body: simulations.map(({ name, result: r }) => `${name}: ${r.status}. LOC ${r.locPredictionAvailable ? `${r.limitingOxygenConcentrationPct.toFixed(2)}% O₂` : "unavailable — incomplete supplied LOC coefficients"}; spread ${r.predictionAvailable ? `${r.flameSpreadRateMms.toFixed(3)} mm/s` : "unavailable — supplied spread closure incomplete"}; predicted burn ${r.predictionAvailable ? `${r.predictedBurnLengthCm.toFixed(2)} cm` : "unavailable"}. ${r.missingParameters.length ? `Missing inputs: ${r.missingParameters.join(", ")}. ` : ""}${r.jsc29353dPrescription}`).join("\n"),
  }, {
    title: "Atmosphere and transport",
    body: `Requested conditions: ${input.gravityG.toFixed(3)}g, ${input.pressureKpa.toFixed(2)} kPa, ${input.oxygenPct.toFixed(2)}% O₂, ${input.forcedFlowCms.toFixed(2)} cm/s forced flow, ${input.electricFieldKvCm.toFixed(2)} kV/cm. Mixed convection and electric-field equivalent gravity are recomputed from the supplied surrogate equations. All PASS/FAIL labels are model screens; physical NASA-STD-6001 testing and materials review remain necessary.`,
  }];
  if(!hasMaterial){sections.shift();sections[0].body=`Requested conditions: ${input.gravityG.toFixed(3)}g, ${input.pressureKpa.toFixed(2)} kPa, ${input.oxygenPct.toFixed(2)}% O₂ and ${input.forcedFlowCms.toFixed(2)} cm/s. No material-specific screen is calculated until a material is selected or named.`}
  for (const card of knowledgeCards) sections.push({ title: card.title, body: `${card.text}\nIndependent source check (${card.independent_verification.status}): ${card.independent_verification.notes}` });
  if (hasMaterial && /e.field|ion.wind|chattock|electric/i.test(query)) {
    const ion = simulatePartialGravityFlammability({ ...input, gravityG: 0 });
    const lunar = simulatePartialGravityFlammability({ ...input, gravityG: 0.165, electricFieldKvCm: 0 });
    sections.push({ title: "Ion-drag comparison", body: `At ${input.electricFieldKvCm.toFixed(2)} kV/cm in 0g the project Chattock surrogate yields ${ion.effectiveGravityG.toFixed(4)}g equivalent body force, versus lunar ${lunar.effectiveGravityG.toFixed(3)}g. Ratio: ${(ion.effectiveGravityG / 0.165).toFixed(2)}. This is a force-density equivalence, not validation that electric fields reproduce every partial-gravity combustion process. ACME-E-FIELD is the associated investigation; the supplied model coefficients are project inputs.` });
  }
  if (/same|teflon|near.ir|polarimet|dust|smoke detector/i.test(query)) {
    sections.push({ title: "Detection evidence and optical mechanism", body: "The brief reports SAME misses of 66.7% for Teflon and 55% for Kapton. These experiment-specific values have not been independently audited here. Near-IR scattering depends on particle size, concentration and refractive index; a miss cannot be assigned to chemistry alone. The supplied 650-nm demonstrator compares 90° depolarization (dust 0.20 versus ideal spherical smoke 0.00) and a 145° channel for mist discrimination. These idealized signatures require calibrated multi-angle measurements; they do not guarantee smoke detection or complete dust rejection." });
  }
  if (hasMaterial && /noms|negative oxygen|1g|microgravity|sofie|bass/i.test(query)) {
    sections.push({ title: "Negative oxygen margin of safety", body: simulations.map(({ name, result: r }) => `${name}: ${r.locPredictionAvailable ? `computed NOMS ${r.negativeOxygenMarginPct.toFixed(2)} percentage points` : "computed NOMS unavailable because the full LOC coefficient set was not supplied"}. The specified check-mark equation combines low-flow radiative quenching with high-flow blowoff. Reducing buoyancy can move a specimen toward the trough, so a terrestrial screen can be non-conservative. BASS and partial-gravity investigations supply context. Catalogue benchmark values are supplied observations and are separate from an executable, validated prediction.`).join("\n") });
  }
  if (/mir|mist|doering|extinguisher|data.center/i.test(query)) {
    sections.push({ title: "Countermeasure transfer", body: "The Mir oxygen-generator fire demonstrates the importance of accessible suppression and respirators in ventilation-driven smoke. NASA Spinoff documents the fine-water-mist extinguisher and Doering zero-leak valve lineage. Supplied diameter moments are D10 28 µm, D20 32 µm, D30 36 µm and D32 46 µm; these moments are not exactly consistent with a single lognormal fit. Data-center or lithium-ion deployment requires application-specific testing; technology transfer does not establish performance for those hazards." });
  }
  if (/apollo|mir|history|historical/i.test(query)) {
    sections.push({ title: "Historical evidence boundary", body: "Incident evidence consists of the supplemental report's discrete event anchors, not a continuous measured time series. Earlier educational interpolations are retained only in a separate provenance artifact. Apollo 13 represents an oxygen tank, not cabin atmosphere; its pressure is outside the flammability model envelope. Its 69-second combustion-duration field differs from the 93.555-second fan-start-to-rupture interval. Mir duration varies among accounts; supplied candle temperatures describe a local source rather than cabin air." });
  }
  sections.push({ title: "Traceability", body: `Two-hop traversal retrieved ${subgraph.nodes.length} nodes and ${subgraph.edges.length} directed relationships. Ranking identifies relevant investigation envelopes, not material certification or causal proof. Numeric values marked brief-supplied retain the original request's attribution and need source-level validation. ${extracted.notes.join(" ")} ${simulations.flatMap((s) => s.result.warnings).join(" ")}` });
  return {
    query, extracted, simulations, rankings, citations, sections, knowledgeCards, materialContext,
    headline: hasMaterial?`Engineering screen · ${statuses}`:'Evidence review · no material selected',
    traversedNodeIds: subgraph.nodes.map((n) => n.id), traversedEdgeIds: subgraph.edges.map((e) => e.id),
    cypher: TRAVERSAL_CYPHER, cypherParameters: { ids: seeds },
    stages: ["Entity extraction + two-hop evidence retrieval", "Deterministic physics + MCDA ranking", "Citation-locked engineering synthesis"],
  };
}

export type GraphQueryResult = ReturnType<typeof queryKnowledgeGraph>;
