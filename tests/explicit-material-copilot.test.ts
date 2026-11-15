import { describe,expect,it,vi } from 'vitest';
import { queryKnowledgeGraph } from '../src/lib/graphrag-engine';
import { handleCopilotRequest } from '../src/lib/copilot-service';
const request=(body:unknown)=>new Request('http://localhost/api/copilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
describe('advisor material-selection scope',()=>{
 it('answers evidence questions without silently computing a PMMA specimen',()=>{
  const r=queryKnowledgeGraph('Explain ACME E-FIELD and lunar gravity',undefined,{requireExplicitMaterial:true});
  expect(r.materialContext).toBe('unselected');expect(r.simulations).toEqual([]);
  expect(r.sections.some(s=>s.title==='Computed material screen'||s.title==='Ion-drag comparison')).toBe(false);
  expect(r.cypherParameters.ids).not.toContain('MAT-PMMA-CAST');expect(r.citations.length).toBeGreaterThan(0);
 });
 it('uses materials named in the question or an explicitly selected material',()=>{
  const named=queryKnowledgeGraph('Compare PMMA and Nomex on the Moon',undefined,{requireExplicitMaterial:true});
  expect(named.simulations.map(s=>s.materialId)).toEqual(['MAT-PMMA-CAST','MAT-NOMEX-HT90']);expect(named.materialContext).toBe('question');
  const selected=queryKnowledgeGraph('What is the flammability margin?',{materialId:'MAT-SIBAL'},{requireExplicitMaterial:true});
  expect(selected.simulations[0].materialId).toBe('MAT-SIBAL');expect(selected.materialContext).toBe('selection');
 });
 it('preserves legacy API defaults for clients without the explicit-selection flag',()=>{
  const r=queryKnowledgeGraph('Explain lunar gravity');expect(r.materialContext).toBe('default');expect(r.simulations).toHaveLength(1);
 });
 it('does not leak an unchosen default specimen into the provider grounding',async()=>{
  const fetcher=vi.fn<typeof fetch>(async()=>new Response('data: {"choices":[{"delta":{"content":"Evidence review."},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n'));
  const response=await handleCopilotRequest(request({query:'Explain lunar gravity',requireExplicitMaterial:true}),{env:{DEEPSEEK_API_KEY:'test-key-not-real'},fetcher});
  await response.text();const body=JSON.parse(String(fetcher.mock.calls[0][1]?.body)),context=JSON.parse(body.messages[1].content);
  expect(context.conditions.materialId).toBeNull();expect(context.simulations).toEqual([]);expect(context.materialScope).toContain('No material was chosen');
 });
 it('validates selection flags and still rejects out-of-range inputs without a specimen',async()=>{
  expect((await handleCopilotRequest(request({query:'Explain lunar gravity',requireExplicitMaterial:'yes'}))).status).toBe(400);
  expect((await handleCopilotRequest(request({query:'Explain gravity',requireExplicitMaterial:true,input:{pressureKpa:500}}))).status).toBe(400);
 });
});
