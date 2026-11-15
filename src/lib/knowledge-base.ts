import canonical from "../data/psi_combustion_knowledge_base.json";
import evidence from "../data/evidence-provenance.json";

/** The canonical source remains unchanged. This view adapts names for the UI;
 * evidence annotations and educational reconstructions are separate artifacts. */
export const canonicalKnowledgeBase = canonical;
export const evidenceProvenance = evidence;

/** A DOI field in the supplied catalogue can contain a DOI or a source URL. */
export function resolveCitation(value: string | null | undefined) {
  if (!value?.trim()) return { citationDoi: null, sourceUrl: null };
  const clean = value.trim();
  if (/^https:\/\//i.test(clean)) return { citationDoi: null, sourceUrl: clean };
  if (/^10\.\d{4,9}\/\S+$/i.test(clean)) return { citationDoi: clean, sourceUrl: `https://doi.org/${clean}` };
  return { citationDoi: null, sourceUrl: null };
}

const suppliedInvestigationSources = canonical.psi_investigations.flatMap((i) => {
  const values = [...new Set([i.doi, i.primary_publication_doi])];
  return values.flatMap((value, index) => {
    const { sourceUrl } = resolveCitation(value);
    return sourceUrl ? [{ id: `V3-${i.id}-${index}`, title: `${i.code} supplied source`, url: sourceUrl, status: "Source supplied in master specification; record-wide independent validation not implied" }] : [];
  });
});
const suppliedCardSources = canonical.knowledge_cards.flatMap((card) => card.source_urls.map((url, index) => ({
  id: `CARD-${card.id}-${index}`, title: card.title, url, status: "Source supplied with knowledge card; see separate independent verification annotation",
})));

export const knowledgeBase = {
  metadata: canonical.metadata,
  provenance: {
    ...evidence.provenance,
    scope: "Exact user-supplied master 3.0.0 catalogue: 15 investigation groups, 6 materials, 3 incidents, 3 spinoffs and 18 knowledge cards. This is not a complete export of NASA PSI.",
    citation_markers: "Supplemental payload is a supplied engineering report; field-level independent verification remains documented separately.",
    diagnostic_scores: "Exact user-supplied scale and diagnostic scores used as MCDA inputs; not NASA-issued ratings.",
  },
  investigations: canonical.psi_investigations.map((i) => {
    const annotation = evidence.investigation_annotations.find((a) => a.id === i.id);
    return {
      ...i,
      ...resolveCitation(i.doi || i.primary_publication_doi),
      pi_lead: [i.pi_lead],
      quantitative_findings_raw: i.quantitative_findings,
      quantitative_findings: [i.quantitative_findings.summary, ...Object.entries(i.quantitative_findings)
        .filter(([key]) => key !== "summary")
        .map(([key, value]) => `${key.replaceAll("_", " ")}: ${Array.isArray(value) ? value.join(" / ") : value}`)],
      material_ids: annotation?.material_ids ?? [],
      related_psi_ids: annotation?.related_psi_ids ?? [],
      sourceIds: [...new Set([...(annotation?.sourceIds ?? []), ...suppliedInvestigationSources.filter((s) => s.id.startsWith(`V3-${i.id}-`)).map((s) => s.id)])],
      evidence_status: i.status === "planned" ? "Planned research target; no released PSI data. Primary FM2 poster describes development and short-duration ground analog evidence." : annotation?.evidence_status ?? "Supplied master record; independent record-wide verification pending",
    };
  }),
  spacecraft_materials: canonical.spacecraft_materials.map((m) => {
    const annotation = evidence.material_annotations.find((a) => a.id === m.material_id);
    return {
      ...m,
      id: m.material_id,
      shortName: annotation?.shortName ?? m.name,
      composition: annotation?.composition ?? m.name,
      thermal_regime: annotation?.thermal_regime ?? "thin",
      application: m.category,
      investigation_ids: annotation?.investigation_ids ?? [],
      sourceIds: annotation?.sourceIds ?? [],
      evidence_status: annotation?.evidence_status ?? "Supplied supplemental report; independent verification pending",
    };
  }),
  historical_incidents: canonical.historical_incidents.map((i) => {
    const reconstruction = evidence.historical_reconstructions.find((a) => a.id === i.incident_id);
    return {
      ...i,
      id: i.incident_id,
      title: i.mission,
      summary: i.ignition_source,
      durationS: i.incident_id === "INC-APOLLO-1" ? 17.7 : i.incident_id === "INC-APOLLO-13" ? 69 : 840,
      atmosphere: {
        ...i.atmosphere,
        gravityG: i.atmosphere.gravity_g,
        pressureKpa: i.atmosphere.pressure_kpa,
        oxygenPct: i.atmosphere.o2_pct,
        forcedFlowCms: 0,
      },
      telemetry_anchors: i.telemetry,
      telemetry: reconstruction?.telemetry ?? [],
      telemetry_status: "Optional educational interpolation from the earlier draft, stored separately in evidence-provenance.json. Supplied exact event anchors are telemetry_anchors and take precedence. These samples are not measured accident telemetry.",
      sourceIds: reconstruction?.sourceIds ?? [],
      evidence_status: reconstruction?.evidence_status ?? "Supplied report event anchors; independent verification pending",
    };
  }),
  earth_spinoffs: canonical.earth_spinoffs.map((s) => {
    const annotation = evidence.spinoff_annotations.find((a) => a.id === s.spinoff_id);
    return {
      ...s,
      id: s.spinoff_id,
      title: s.name,
      summary: annotation?.summary ?? s.nasa_origin,
      parameters: {
        ...s.technical_specs,
        ...(annotation?.parameters ?? {}),
      },
      earth_applications: s.terrestrial_applications,
      sourceIds: annotation?.sourceIds ?? [],
      evidence_status: annotation?.evidence_status ?? "Supplied supplemental report; independent verification pending",
    };
  }),
  knowledge_cards: canonical.knowledge_cards.map((card) => {
    const independent = evidence.knowledge_card_annotations.find((a) => a.id === card.id);
    return {
      ...card,
      summary: card.text,
      safety_pillars: card.pillars,
      sourceUrls: card.source_urls,
      sourceIds: suppliedCardSources.filter((s) => s.id.startsWith(`CARD-${card.id}-`)).map((s) => s.id),
      independent_verification: independent ?? { id: card.id, status: "not_independently_verified", notes: "The payload's verified flag is supplied metadata; source-level verification has not been completed.", sourceUrls: card.source_urls },
    };
  }),
  sources: [...evidence.sources, ...suppliedInvestigationSources, ...suppliedCardSources],
};
