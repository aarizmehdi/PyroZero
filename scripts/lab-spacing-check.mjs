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
const browserErrors=[];let socket;const pending=new Map();let id=0;
const ws=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(new Error('Browser launch timed out')),30000);child.stderr.on('data',chunk=>{out+=chunk;const m=out.match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(timer);resolve(m[1]);}});child.on('exit',code=>reject(new Error(`Browser exited ${code}`)));});
socket=new WebSocket(ws);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
socket.onmessage=event=>{const m=JSON.parse(String(event.data));if(m.method==='Runtime.exceptionThrown')browserErrors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.reject(new Error(m.error.message));else p.resolve(m.result)}};
const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(new Error(`CDP timeout ${method}`))},30000);pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}))});
let session;
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},session);if(r.exceptionDetails)throw new Error(r.exceptionDetails.text+': '+r.exceptionDetails.exception?.description);return r.result.value};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const click=async text=>{const clicked=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.toLowerCase().includes(${JSON.stringify(text)}.toLowerCase()));if(!b)return false;b.click();return true})()`);assert.ok(clicked,`Button ${text}`);await wait(350)};
const results=[];
try{
 const {targetId}=await send('Target.createTarget',{url:'about:blank'});({sessionId:session}=await send('Target.attachToTarget',{targetId,flatten:true}));await send('Page.enable',{},session);await send('Runtime.enable',{},session);
 const until=async(expression,message)=>{for(let i=0;i<80;i++){if(await evaluate(expression))return;await wait(200)}throw new Error(message)};



 await send('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('pyrozero-tour-v1','done')"},session);
 await send('Page.navigate',{url:origin},session);
 await until("document.querySelectorAll('.module-nav button').length===4",'Workspace');
 await until("Object.keys(document.querySelector('.module-nav button')).some(k=>k.startsWith('__reactProps$'))",'Hydration');await click('Flammability Lab');await evaluate("(()=>{const e=document.querySelector('.material-select');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'MAT-PMMA-CAST');e.dispatchEvent(new Event('change',{bubbles:true}))})()");await wait(150);
 const snapshot=async name=>{mkdirSync('docs/screenshots',{recursive:true});const r=await send('Page.captureScreenshot',{format:'png'},session);writeFileSync('docs/screenshots/lab-spacing-'+name+'.png',Buffer.from(r.data,'base64'))};
 for(const theme of ['light','dark']){await evaluate('localStorage.setItem("pyrozero-theme",'+JSON.stringify(theme)+');window.dispatchEvent(new Event("pyrozero-theme"))');for(const width of [1440,1354,1100,1024,390,425]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false},session);await wait(200);
 const m=await evaluate("(()=>{const s=document.querySelector('.specimen-geometry'),l=[...s.querySelectorAll('text')].find(e=>e.textContent==='6.5 cm').getBoundingClientRect(),p=s.querySelector('path[d=\"M101 260v5h47v-5\"]').getBoundingClientRect(),r=document.querySelector('.specimen-prescription').getBoundingClientRect(),g=document.querySelector('.loc-gravity-legend'),panel=g.closest('.panel');return{scroll:document.documentElement.scrollWidth,labelGap:l.top-p.bottom,belowGap:r.top-l.bottom,legendGap:panel.getBoundingClientRect().bottom-Math.max(...[...g.children].map(e=>e.getBoundingClientRect().bottom)),legend:[...g.children].map(e=>e.querySelector('b').textContent),badge:document.body.innerText.includes('Live surrogate')}})()");
 assert.ok(m.scroll<=width+1,'Overflow '+width);assert.ok(m.labelGap>=8,'Specimen label '+m.labelGap);assert.ok(m.belowGap>=24,'Prescription gap '+m.belowGap);assert.ok(m.legendGap>=20,'Legend bottom '+m.legendGap);assert.deepEqual(m.legend,['0g','Moon','Mars','Earth']);assert.equal(m.badge,false);
 await evaluate("document.querySelector('.specimen-geometry').scrollIntoView({block:'center',behavior:'instant'})");await snapshot(theme+'-'+width+'-specimen');await evaluate("document.querySelector('.loc-gravity-legend').scrollIntoView({block:'center',behavior:'instant'})");await snapshot(theme+'-'+width+'-boundary');results.push({theme,width,...m});}}
 assert.deepEqual(browserErrors,[]);writeFileSync('docs/lab-spacing-results.json',JSON.stringify({status:'PASS',checks:results,browserErrors},null,2));console.log('PASS: Lab spacing and responsive checks across 12 theme/viewport combinations');
}catch(error){console.error(String(error));process.exitCode=1;}finally{await send('Browser.close').catch(()=>{});socket.close();}
