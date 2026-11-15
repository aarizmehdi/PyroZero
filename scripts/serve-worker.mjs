import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const worker=(await import(pathToFileURL(resolve('dist/server/index.js')).href)).default;
const env={DEEPSEEK_API_KEY:process.env.DEEPSEEK_API_KEY,DEEPSEEK_MODEL:process.env.DEEPSEEK_MODEL,OPENAI_API_KEY:process.env.OPENAI_API_KEY,OPENAI_MODEL:process.env.OPENAI_MODEL,GEMINI_API_KEY:process.env.GEMINI_API_KEY,GEMINI_MODEL:process.env.GEMINI_MODEL};
const port=Number(process.env.PORT||4173);
createServer(async(req,res)=>{
 const abort=new AbortController();req.on('aborted',()=>abort.abort());res.on('close',()=>{if(!res.writableEnded)abort.abort()});
 try{
  const headers=new Headers();for(const [k,v] of Object.entries(req.headers)){if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(', '):v)}
  const method=req.method||'GET';
  const init={method,headers,signal:abort.signal};
  if(method!=='GET'&&method!=='HEAD'){init.body=Readable.toWeb(req);init.duplex='half'}
  const request=new Request(`http://127.0.0.1:${port}${req.url}`,init);
  const response=await worker.fetch(request,env);
  res.writeHead(response.status,Object.fromEntries(response.headers));
  if(response.body)Readable.fromWeb(response.body).pipe(res);else res.end();
 }catch(error){if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Preview request failed'}));console.error(error instanceof Error?error.message:'Preview error')}
}).listen(port,'127.0.0.1',()=>console.log(`PyroZero Worker preview: http://127.0.0.1:${port}`));
