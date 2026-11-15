import { describe, expect, it, vi } from 'vitest';
import { handleCopilotRequest } from '../src/lib/copilot-service';
import { queryKnowledgeGraph } from '../src/lib/graphrag-engine';
const query='Compare PMMA and Nomex at 34% O2, 56.5 kPa and 5 cm/s on the Moon';
const req=(key?:string)=>new Request('http://localhost/api/copilot',{method:'POST',headers:{'Content-Type':'application/json',...(key?{'x-deepseek-key':key}:{})},body:JSON.stringify({query})});
const frame=(content:string,finish_reason:string|null=null)=>`data: ${JSON.stringify({choices:[{delta:{content},finish_reason}]})}\n\n`;
const parse=(text:string)=>text.trim().split('\n\n').map(block=>({event:block.match(/^event: (.+)$/m)?.[1],data:JSON.parse(block.match(/^data: (.+)$/m)![1])}));
describe('DeepSeek live grounded streaming',()=>{
 it('forwards first token before upstream completion, with computed evidence and exact endpoint settings',async()=>{
  let upstream!:ReadableStreamDefaultController<Uint8Array>;
  const enc=new TextEncoder(),fetcher=vi.fn(async()=>new Response(new ReadableStream<Uint8Array>({start(controller){upstream=controller;controller.enqueue(enc.encode(frame('## Engineering analysis\n')))}})));
  const response=await handleCopilotRequest(req('test-client-key-123'),{env:{DEEPSEEK_API_KEY:'test-server-key-456',OPENAI_API_KEY:'unused-key'},fetcher});
  const reader=response.body!.getReader(),decoder=new TextDecoder();let text='';
  for(let i=0;i<3;i++){const next=await reader.read();text+=decoder.decode(next.value)}
  expect(parse(text).map(event=>event.event)).toEqual(['result','mode','token']);
  expect(parse(text).at(-1)!.data.text).toBe('## Engineering analysis\n');
  const [url,init]=fetcher.mock.calls[0] as unknown as [string,RequestInit];
  expect(url).toBe('https://api.deepseek.com/chat/completions');expect((init.headers as Record<string,string>).Authorization).toBe('Bearer test-client-key-123');
  const body=JSON.parse(String(init.body));expect(body).toMatchObject({model:'deepseek-chat',temperature:0.2,stream:true});
  const grounding=JSON.parse(body.messages[1].content),expected=queryKnowledgeGraph(query);
  expect(grounding.simulations).toEqual(expected.simulations);expect(grounding.citations).toEqual(expected.citations);expect(grounding.ranking).toHaveLength(5);
  upstream.enqueue(enc.encode(frame('Use representative testing [PSI-25].','stop')+'data: [DONE]\n\n'));upstream.close();
  for(;;){const next=await reader.read();if(next.done)break;text+=decoder.decode(next.value)}
  expect(parse(text).at(-1)!.data).toMatchObject({mode:'deepseek',citationLocked:true,providerFallback:false});expect(fetcher).toHaveBeenCalledTimes(1);expect(text).not.toContain('test-client-key-123');
 });
 it('uses server credential when client header is absent and retains requested default model',async()=>{
  const fetcher=vi.fn(async()=>new Response(frame('Grounded analysis [ACME-E-FIELD].','stop')+'data: [DONE]\n\n'));
  const out=parse(await (await handleCopilotRequest(req(),{env:{DEEPSEEK_API_KEY:'test-server-key'},fetcher})).text());
  expect(fetcher.mock.calls).toHaveLength(1);expect((fetcher.mock.calls[0] as unknown as [string,RequestInit])[1].headers).toMatchObject({Authorization:'Bearer test-server-key'});expect(out.at(-1)!.data.mode).toBe('deepseek');
 });
 it.each([401,429,503])('reports provider HTTP%s failures without fake deterministic synthesis or secret disclosure',async status=>{
  const fetcher=vi.fn(async()=>new Response('secret private upstream failure',{status}));
  const out=parse(await (await handleCopilotRequest(req('test-client-secret'),{fetcher})).text());
  expect(out.some(event=>event.event==='error')).toBe(true);expect(out.some(event=>event.event==='token')).toBe(false);expect(out.at(-1)!.data.mode).toBe('provider_error');expect(JSON.stringify(out)).not.toMatch(/test-client-secret|private upstream/);
 });
 it('rejects malformed client credentials before any provider call',async()=>{
  const fetcher=vi.fn();expect((await handleCopilotRequest(req('invalid key'),{fetcher})).status).toBe(400);expect(fetcher).not.toHaveBeenCalled();
 });
 it('detects an incomplete provider stream instead of reporting a successful live answer',async()=>{
  const out=parse(await (await handleCopilotRequest(req('test-client-key'),{fetcher:vi.fn(async()=>new Response(frame('Partial result')))})).text());
  expect(out.at(-1)!.data.mode).toBe('provider_error');expect(out.some(event=>event.event==='error')).toBe(true);
 });
});
