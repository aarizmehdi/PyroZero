import { describe, expect, it, vi } from 'vitest';
import { POST, GET } from '../src/app/api/copilot/route';
import { handleCopilotRequest, validateNarrative } from '../src/lib/copilot-service';
import { queryKnowledgeGraph } from '../src/lib/graphrag-engine';

const prompt='Compare PMMA and Nomex at 34% O2, 56.5 kPa and 5 cm/s on the Moon';
const request=(body:unknown)=>new Request('http://localhost/api/copilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
async function events(response:Response){const text=await response.text();return text.trim().split('\n\n').map(block=>({event:block.match(/^event: (.+)$/m)?.[1],data:JSON.parse(block.match(/^data: (.+)$/m)![1])}));}
function providerStream(text:string,mode:'openai'|'gemini'='openai'){
  const frames=[text.slice(0,17),text.slice(17)].map(delta=>`data: ${JSON.stringify(mode==='openai'?{type:'response.output_text.delta',delta}:{candidates:[{content:{parts:[{text:delta}]}}]})}\n\n`).join('');
  return new Response(frames,{headers:{'Content-Type':'text/event-stream'}});
}

describe('real server copilot route and deterministic fallback',()=>{
  it('exposes service metadata and runs all three stages without a paid key',async()=>{
    expect((await (await GET()).json()).method).toBe('POST');
    const network=vi.fn();
    const response=await handleCopilotRequest(request({query:prompt}),{env:{},fetcher:network});
    expect(response.status).toBe(200);expect(response.headers.get('Content-Type')).toContain('text/event-stream');
    const output=await events(response);
    const result=output.find(e=>e.event==='result')!.data;
    expect(result.simulations).toHaveLength(2);expect(result.rankings).toHaveLength(15);expect(result.stages).toHaveLength(3);expect(result.citations.length).toBeGreaterThan(0);
    expect(output.at(-1)!.data).toMatchObject({mode:'deterministic',citationLocked:true});
    expect(output.some(e=>e.event==='token')).toBe(true);expect(network).not.toHaveBeenCalled();
  });
  it('uses the App Router POST implementation when no provider is configured',async()=>{
    vi.stubEnv('OPENAI_API_KEY','');vi.stubEnv('GEMINI_API_KEY','');vi.stubEnv('DEEPSEEK_API_KEY','');
    try{expect((await events(await POST(request({query:'PMMA on ISS transit'})))).at(-1)!.data.mode).toBe('deterministic')}finally{vi.unstubAllEnvs()}
  });
  it.each([{query:''},{query:'x'.repeat(8001)},{query:prompt,input:{oxygenPct:'34'}},{query:'PMMA at 500 kPa'},{query:prompt,input:[]}])('rejects malformed queries and conditions before opening a stream: %j',async body=>{
    const response=await handleCopilotRequest(request(body));expect(response.status).toBe(400);expect((await response.json()).error).toBeTruthy();
  });
  it('rejects incorrect content type, oversized bodies and unsupported methods',async()=>{
    expect((await handleCopilotRequest(new Request('http://localhost',{method:'POST',body:'hello'}))).status).toBe(415);
    expect((await handleCopilotRequest(request({query:'x'.repeat(40000)}))).status).toBe(413);
    expect((await handleCopilotRequest(new Request('http://localhost'))).status).toBe(405);
    expect((await handleCopilotRequest(new Request('http://localhost',{method:'POST',headers:{'Content-Type':'application/json'},body:'{broken'}))).status).toBe(400);
  });
  it('automatically falls back on provider outage without exposing keys or errors',async()=>{
    const fetcher=vi.fn(async()=>new Response('private upstream error',{status:503}));
    const response=await handleCopilotRequest(request({query:prompt}),{env:{OPENAI_API_KEY:'test-secret'},fetcher});
    const text=await response.text();expect(text).not.toContain('test-secret');expect(text).not.toContain('private upstream error');expect(text).toContain('"providerFallback":true');expect(text).toContain('"mode":"deterministic"');
  });
  it('streams an OpenAI narrative only after citation validation',async()=>{
    const result=queryKnowledgeGraph(prompt),id=result.citations[0].id;
    const fetcher=vi.fn<typeof fetch>(async()=>providerStream(JSON.stringify({paragraphs:[{text:'Compare the material screens with the cited research evidence.',citationIds:[id]}]})));
    const output=await events(await handleCopilotRequest(request({query:prompt}),{env:{OPENAI_API_KEY:'test-secret'},fetcher}));
    expect(output.at(-1)!.data.mode).toBe('openai');expect(output.find(e=>e.event==='token')!.data.citationIds).toEqual([id]);
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body)).stream).toBe(true);
  });
  it('supports Gemini streaming and rejects invented citations or numerical claims',async()=>{
    const result=queryKnowledgeGraph(prompt),id=result.citations[0].id;
    expect(()=>validateNarrative({paragraphs:[{text:'The material is safe.',citationIds:['invented-source']}]},result)).toThrow();
    expect(()=>validateNarrative({paragraphs:[{text:'It reaches 987654321 kelvin.',citationIds:[id]}]},result)).toThrow();
    expect(()=>validateNarrative({paragraphs:[{text:'NASA-certified for open cabin use.',citationIds:[id]}]},result)).toThrow();
    const fetcher=vi.fn(async()=>providerStream(JSON.stringify({paragraphs:[{text:'Inspect the computed screen alongside the experimental evidence.',citationIds:[id]}]}),'gemini'));
    const output=await events(await handleCopilotRequest(request({query:prompt}),{env:{GEMINI_API_KEY:'test-secret'},fetcher}));
    expect(output.at(-1)!.data.mode).toBe('gemini');
  });
  it('rejects ungrounded provider text and retains the deterministic answer',async()=>{
    const fetcher=vi.fn(async()=>providerStream(JSON.stringify({paragraphs:[{text:'Guaranteed safe at any oxygen concentration.',citationIds:['made-up']}]})));
    const output=await events(await handleCopilotRequest(request({query:prompt}),{env:{OPENAI_API_KEY:'test-secret'},fetcher}));
    expect(output.at(-1)!.data.mode).toBe('deterministic');expect(output.filter(e=>e.event==='token').map(e=>e.data.text).join('')).not.toContain('Guaranteed safe');
  });
});
