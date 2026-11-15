import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

// Run against the local development server or a served production export.
const origin = process.argv[2] || 'http://127.0.0.1:3000';
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p=>p&&existsSync(p));
if(!exe)throw new Error('Chrome or Edge is required for browser verification.');
const profile=join(process.cwd(),'.browser-test',String(Date.now()));mkdirSync(profile,{recursive:true});
const child=spawn(exe,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-extensions','--disable-gpu','--window-size=1440,1000','about:blank'],{stdio:['ignore','ignore','pipe'],windowsHide:true});
const handlers=[];const browserErrors=[];let socket;const pending=new Map();let id=0;
const ws=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(new Error('Browser launch timed out')),30000);child.stderr.on('data',chunk=>{out+=chunk;const m=out.match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(timer);resolve(m[1]);}});child.on('exit',code=>reject(new Error(`Browser exited ${code}`)));});
socket=new WebSocket(ws);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
socket.onmessage=event=>{const m=JSON.parse(String(event.data));for(const handler of handlers)handler(m);if(m.method==='Runtime.exceptionThrown')browserErrors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.reject(new Error(m.error.message));else p.resolve(m.result)}};
const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(new Error(`CDP timeout ${method}`))},30000);pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}))});
let session;
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},session);if(r.exceptionDetails)throw new Error(r.exceptionDetails.text+': '+r.exceptionDetails.exception?.description);return r.result.value};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const click=async text=>{const clicked=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.toLowerCase().includes(${JSON.stringify(text)}.toLowerCase()));if(!b)return false;b.click();return true})()`);assert.ok(clicked,`Button ${text}`);await wait(350)};

const checks=[];
try{
 const {targetId}=await send('Target.createTarget',{url:'about:blank'});({sessionId:session}=await send('Target.attachToTarget',{targetId,flatten:true}));await send('Page.enable',{},session);await send('Runtime.enable',{},session);
 const until=async(expression,message)=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await wait(100)}throw new Error(message)};
 await send('Emulation.setDeviceMetricsOverride',{width:1660,height:1050,deviceScaleFactor:1,mobile:false},session);
 await send('Page.navigate',{url:origin+'/pyrozero-pitch-deck.html'},session);
 await until("document.querySelectorAll('.slide').length===7&&[...document.images].every(i=>i.complete&&i.naturalWidth>0)",'Deck assets');await evaluate('document.fonts.ready');
 mkdirSync('docs/screenshots/submission',{recursive:true});
 for(let i=0;i<7;i++){
  const bounds=await evaluate(`(()=>{const s=document.querySelectorAll('.slide')[${i}],r=s.getBoundingClientRect(),f=s.querySelector('.footnote')?.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,overflow:s.scrollHeight>s.clientHeight+1,overlap:[...s.children].filter(e=>!e.matches('.footnote,.brand,.kicker')).some(e=>e.getBoundingClientRect().bottom>(f?f.top-8:r.bottom-20))}})()`);
  assert.ok(!bounds.overflow&&!bounds.overlap,'Slide '+(i+1)+' overflows or overlaps its source footer');
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height,scale:1}},session);writeFileSync(`docs/screenshots/submission/slide-${i+1}.png`,Buffer.from(shot.data,'base64'));checks.push({slide:i+1,desktopFit:true});
 }
 await send('Emulation.setEmulatedMedia',{media:'print'},session);await wait(300);
 const pdf=await send('Page.printToPDF',{printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false,marginTop:0,marginBottom:0,marginLeft:0,marginRight:0,paperWidth:16.666667,paperHeight:9.375},session);writeFileSync('public/pyrozero-pitch-deck.pdf',Buffer.from(pdf.data,'base64'));
 await send('Emulation.setEmulatedMedia',{media:'screen'},session);await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false},session);await wait(300);assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Mobile deck overflow');checks.push({mobileDeckReading:true});
 let status={sharedAvailable:true,expiresAt:'2099-01-01T00:00:00Z',remainingMs:600000};let errorMode=false;let statusCalls=0;const pendingFetch=[];
 handlers.push(m=>{if(m.method!=='Fetch.requestPaused')return;const p=m.params;let value;if(p.request.method==='GET'){statusCalls++;value=JSON.stringify(status)}else if(errorMode)value='event: error\ndata: {"message":"Shared provider unavailable"}\n\nevent: done\ndata: {"mode":"provider_error"}\n\n';else{pendingFetch.push(send('Fetch.continueRequest',{requestId:p.requestId},session));return}pendingFetch.push(send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:p.request.method==='GET'?'application/json':'text/event-stream'}],body:Buffer.from(value).toString('base64')},session))});
 await send('Fetch.enable',{patterns:[{urlPattern:'*/api/copilot',requestStage:'Request'}]},session);
 await send('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('pyrozero-tour-v1','done')"},session);
 for(const theme of ['light','dark'])for(const width of [1440,390]){
  status={sharedAvailable:true,expiresAt:'2099-01-01T00:00:00Z',remainingMs:600000};errorMode=false;
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false},session);await send('Page.navigate',{url:origin},session);await until("!!document.querySelector('.module-nav')&&Object.keys(document.querySelector('.module-nav button')).some(k=>k.startsWith('__reactProps$'))",'Hydration');await evaluate(`localStorage.setItem('pyrozero-theme','${theme}');window.dispatchEvent(new Event('pyrozero-theme'))`);await click('Hybrid GraphRAG');await until("!!document.querySelector('.ai-connected')",'Shared access feedback');assert.ok(await evaluate("!document.querySelector('.ai-settings-button')"));assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));await evaluate("document.querySelector('.advisor-composer').scrollIntoView({block:'start',behavior:'instant'})");const shot=await send('Page.captureScreenshot',{format:'png'},session);writeFileSync(`docs/screenshots/submission/shared-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));checks.push({theme,width,sharedStatus:true,settingsHidden:true});
 }
 // A failed shared request immediately reveals key recovery; no real provider call occurs.
 errorMode=true;await evaluate("(()=>{const e=document.querySelector('#engineering-query');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'Explain lunar fire');e.dispatchEvent(new Event('input',{bubbles:true}))})()");await click('Send question');await until("!!document.querySelector('.advisor-request-error')",'Provider recovery');assert.ok(await evaluate("!!document.querySelector('.ai-settings-button')"));await click('Use your own key');assert.ok(await evaluate("document.querySelector('label[for=deepseek-api-key]').innerText==='DeepSeek API key'"));checks.push({sharedFailureRecovery:true});
 // Time advancement is supplied by the server status, not a client clock or cookie.
 errorMode=false;status={sharedAvailable:true,expiresAt:'2099-01-01T00:00:00Z',remainingMs:1000};await send('Page.navigate',{url:origin},session);await until("!!document.querySelector('.module-nav')&&Object.keys(document.querySelector('.module-nav button')).some(k=>k.startsWith('__reactProps$'))",'Hydration');await click('Hybrid GraphRAG');await until("!!document.querySelector('.ai-connected')",'Before deadline');status={sharedAvailable:false,expiresAt:'2020-01-01T00:00:00Z',remainingMs:0};await until("!!document.querySelector('.ai-settings-button')&&!document.querySelector('.ai-connected')",'Automatic settings return');checks.push({automaticExpiryWhileOpen:true});
 status={sharedAvailable:false,expiresAt:'2099-01-01T00:00:00Z',remainingMs:600000};await send('Page.navigate',{url:origin},session);await until("!!document.querySelector('.module-nav')&&Object.keys(document.querySelector('.module-nav button')).some(k=>k.startsWith('__reactProps$'))",'Hydration');await click('Hybrid GraphRAG');await until("!!document.querySelector('.ai-settings-button')",'Missing key visibility');checks.push({missingKeyDoesNotClaimConnected:true});
 await Promise.all(pendingFetch);assert.deepEqual(browserErrors,[]);writeFileSync('docs/submission-browser-results.json',JSON.stringify({origin,status:'PASS',checks,statusCalls,browserErrors,providerCallsMocked:true},null,2));console.log('PASS: seven-slide fit/PDF, mobile reading, four shared-access layouts, failure recovery, live expiry and missing-key states.');
}catch(error){console.error(error.stack);process.exitCode=1;}finally{await send('Browser.close').catch(()=>{});socket.close();}
