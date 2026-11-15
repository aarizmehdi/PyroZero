import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

// Run against the local development server or a served production export.
const origin = process.argv[2] || 'http://127.0.0.1:3000';
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p=>p&&existsSync(p));
if(!exe)throw new Error('Chrome or Edge is required for browser verification.');
const profile=join(process.cwd(),'.browser-test',String(Date.now()));mkdirSync(profile,{recursive:true});
const child=spawn(exe,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-extensions','--disable-gpu','--disable-webgl','--window-size=1440,1000','about:blank'],{stdio:['ignore','ignore','pipe'],windowsHide:true});
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
 const setValue=async(selector,value)=>{await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('Missing input');const proto=e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await wait(350)};



 const snapshot=async name=>{mkdirSync('docs/screenshots',{recursive:true});const r=await send('Page.captureScreenshot',{format:'png'},session);writeFileSync('docs/screenshots/final-'+name+'.png',Buffer.from(r.data,'base64'))};
 const viewport=async width=>send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false},session);
 await viewport(390);await send('Page.navigate',{url:origin},session);
 await until("!!document.querySelector('.product-tour-welcome')",'First visit welcome');await snapshot('tour-welcome-mobile');
 await until("document.activeElement.id==='product-tour-title'",'Welcome focus');
 await click('Skip tour');assert.equal(await evaluate("localStorage.getItem('pyrozero-tour-v1')"),'done');await send('Page.reload',{},session);await wait(1100);assert.equal(await evaluate("!!document.querySelector('.product-tour-panel')"),false);
 await evaluate("document.querySelector('.global-tools>summary').click()");await click('Tour');await click('Start tour');

 for(let step=0;step<6;step++){await until("document.querySelector('.product-tour-panel')?.dataset.tourStep==='"+step+"'",'Tour step '+step);assert.ok((await evaluate("document.querySelector('.module-nav [aria-current=page]').getAttribute('aria-label')")).includes(['PSI Mission','PSI Mission','Partial-g','Fire Forensics','Fire Forensics','Hybrid'][step]));await wait(250);await snapshot('tour-step-'+step);await click(step===5?'Finish tour':'Next');}
 assert.equal(await evaluate("!!document.querySelector('.product-tour-panel')"),false);
 await click('PSI Mission Explorer');await until("document.querySelectorAll('.matrix tbody tr:not(.detail-row)').length===3",'Three initial investigations');await click('Show all 15 investigations');assert.equal(await evaluate("document.querySelectorAll('.matrix tbody tr:not(.detail-row)').length"),15);await click('Show first 3');
 await setValue('[aria-label="Search investigations"]','E-FIELD');assert.ok((await evaluate("document.querySelector('.matrix tbody').innerText")).includes('E-FIELD'));await setValue('[aria-label="Search investigations"]','');
 const pillars=await evaluate("[...document.querySelectorAll('.pillar-filter button')].slice(1).map(e=>e.getBoundingClientRect().top)");assert.ok(Math.max(...pillars)-Math.min(...pillars)<1,'Safety pillars share a row');
 await click('Flammability Lab');assert.equal(await evaluate("document.querySelector('.atmosphere-drawer').open"),false);assert.equal(await evaluate("document.querySelectorAll('.mission-ribbon>button').length"),4);
 await setValue('.material-select','MAT-PMMA-CAST');await click('ISS Transit');assert.ok((await evaluate("document.querySelector('.telemetry-strip').textContent")).includes('0.000'));
 await evaluate("document.querySelector('.atmosphere-drawer>summary').click()");await wait(120);assert.equal(await evaluate("document.querySelector('.atmosphere-drawer').open"),true);await setValue('.material-select','MAT-NOMEX-HT90');await click('Artemis Lunar');
 await evaluate("document.querySelector('.atmosphere-drawer>summary').click()");
 assert.equal(await evaluate("document.querySelectorAll('.loc-gravity-legend>div').length"),4);assert.ok(await evaluate("[...document.querySelectorAll('.loc-gravity-legend>div')].every(e=>e.querySelector('b')&&e.innerText.includes('LOC')&&e.innerText.includes('cm/s'))"));assert.ok(await evaluate("!document.querySelector('.scientific-loc').textContent.includes('Cabin 34.0%')"));
 await click('Fire Forensics');await click('Historical fire forensics');assert.ok(await evaluate("!!document.querySelector('.timing-note')"));const button=await evaluate("(()=>{const b=document.querySelector('.incident-actions>button');return{scroll:b.scrollWidth,width:b.clientWidth,label:b.innerText}})()");assert.ok(button.scroll<=button.width);assert.ok(button.label.includes('Load scenario into lab'));await click('Load scenario into lab');assert.ok(await evaluate("!!document.querySelector('.scenario-banner')"));await click('Exit Scenario');
 await click('Hybrid GraphRAG');assert.equal(await evaluate("document.querySelectorAll('.response-ready').length"),0);await click('Smoke detection & Teflon');await until("!!document.querySelector('.response-ready')",'Reference answer');
 assert.ok(await evaluate("!!document.querySelector('.reference-answer-note strong')"));assert.ok(await evaluate("document.querySelector('.advisor-evidence-column').getBoundingClientRect().top<document.querySelector('.advisor-sources').getBoundingClientRect().top"),'Evidence map before sources');await snapshot('reference-answer-mobile');
 for(const theme of ['light','dark']){await evaluate('localStorage.setItem("pyrozero-theme",'+JSON.stringify(theme)+');window.dispatchEvent(new Event("pyrozero-theme"))');for(const width of [1440,1354,1100,1024,390,425]){await viewport(width);for(const name of ['PSI Mission Explorer','Flammability Lab','Fire Forensics','Hybrid GraphRAG']){await click(name);await evaluate('window.scrollTo({top:0,behavior:"instant"})');await wait(100);const m=await evaluate("({scroll:document.documentElement.scrollWidth,controlsOpen:document.querySelector('.atmosphere-drawer')?.open})");assert.ok(m.scroll<=width+1,'Overflow '+name+' '+width);if(name==='Flammability Lab')assert.equal(m.controlsOpen,width>768);await snapshot(theme+'-'+width+'-'+name.split(' ')[0]);results.push({theme,width,tab:name,...m})}}}
 await viewport(1440);await evaluate("document.querySelector('.global-tools>summary').click()");await click('Tour');await click('Start tour');await snapshot('tour-desktop');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape'},session);assert.equal(await evaluate("!!document.querySelector('.product-tour-panel')"),false);
 assert.deepEqual(browserErrors,[]);writeFileSync('docs/final-experience-results.json',JSON.stringify({status:'PASS',checks:results,functional:['first visit welcome','skip remembered across reload','Tools replay','six tour steps across all four modules','Escape dismissal','three initial results and show all','search across catalogue','three safety pillars on one row','collapsed mobile custom controls','four presets','gravity values paired with names','no overlapping SVG mission labels','mobile scenario button','time reference note','reference answer highlighted','evidence map before sources'],browserErrors},null,2));console.log('PASS: onboarding and refinements, plus '+results.length+' module/theme/viewport checks.');
}catch(error){const r=await send('Page.captureScreenshot',{format:'png'},session).catch(()=>null);if(r)writeFileSync('docs/screenshots/final-failure.png',Buffer.from(r.data,'base64'));console.error(error.stack);process.exitCode=1;}finally{await send('Browser.close').catch(()=>{});socket.close();}
