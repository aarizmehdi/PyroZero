import { describe,expect,it,vi } from 'vitest';
import { queryKnowledgeGraph } from '../src/lib/graphrag-engine';
import { handleCopilotRequest,validateDeepSeekNarrative } from '../src/lib/copilot-service';
const query='Compare PMMA and Nomex on the Moon at 34% O2, 56.5 kPa and 5 cm/s';
describe('live narrative evidence and calculated-value grounding',()=>{
 it('supports an internal calculation reference without pretending it is a NASA publication',()=>{
  const result=queryKnowledgeGraph(query);
  expect(()=>validateDeepSeekNarrative('The modeled PMMA spread is 1.194 mm/s [MODEL].',result)).not.toThrow();
  expect(result.citations.some(c=>c.id==='MODEL')).toBe(false);
 });
 it('rejects section headings, invented citations, unsupported numbers and certification claims',()=>{
  const result=queryKnowledgeGraph(query);
  for(const text of ['Retrieved records support this [Traceability].','This is true [invented-source].','The spread is 987654321 mm/s [MODEL].','This material is NASA-certified [MODEL].'])expect(()=>validateDeepSeekNarrative(text,result)).toThrow();
 });
 it('does not allow a calculation reference without a chosen specimen',()=>{
  const result=queryKnowledgeGraph('Explain lunar gravity',undefined,{requireExplicitMaterial:true});
  expect(()=>validateDeepSeekNarrative('Computed material result [MODEL].',result)).toThrow();
 });
 it('provides both oxygen margins with distinct definitions and the actual relevant investigation findings',async()=>{
  const fetcher=vi.fn<typeof fetch>(async()=>new Response('data: {"choices":[{"delta":{"content":"Compare the modeled screens [MODEL]."},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n'));
  const response=await handleCopilotRequest(new Request('http://localhost/api/copilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query})}),{nowMs:0,env:{DEEPSEEK_API_KEY:'test-key'},fetcher});
  await response.text();const context=JSON.parse(JSON.parse(String(fetcher.mock.calls[0][1]?.body)).messages[1].content);
  expect(context.definitions.noms).toContain('NOT ambient oxygen');expect(context.modelSummary.map((s:{ambientAboveLoc:boolean})=>s.ambientAboveLoc)).toEqual([true,true]);
  expect(context.modelSummary[1].ambientMinusLocPercentagePoints).toBe(.92);
  expect(context.modelSummary[1].nomsPercentagePoints).toBe(1.59);
  expect(context.investigationEvidence.length).toBeGreaterThan(0);expect(context.allowedCitationIds).toContain('MODEL');
 });
});
