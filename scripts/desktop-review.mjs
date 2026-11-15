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
 const setValue=async(selector,value)=>{await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('Missing input');const proto=e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await wait(350)};


 await send('Page.navigate',{url:origin},session);
 await until(`document.querySelectorAll('.matrix tbody tr:not(.detail-row)').length===15`,'Workspace');await until(`Object.keys(document.querySelector('.mission-ribbon button')).some(k=>k.startsWith('__reactProps$'))`,'Hydration');
 assert.equal(await evaluate(`document.querySelectorAll('.page-heading button,.catalogue-access').length`),0);
 assert.equal(await evaluate(`document.querySelectorAll('.topbar .tools-menu button').length`),3);await evaluate(`document.querySelector('.global-tools>summary').click()`);await wait(200);await click('Scope (15)');assert.ok(await evaluate(`!!document.querySelector('.evidence-modal')&&!document.querySelector('.global-tools').open`));await evaluate(`document.querySelector('[aria-label="Close evidence notes"]').click()`);
 await click('ISS Transit');await until(`document.querySelector('.telemetry-strip').textContent.includes('3.09')`,'Mission update');await click('Artemis Lunar');
 await setValue('.weight-slider input','1');await evaluate(`document.querySelector('[aria-label="Reset weights"]').click()`);await wait(300);assert.deepEqual(await evaluate(`[...document.querySelectorAll('.weight-slider input')].map(e=>+e.value)`),[.35,.25,.15,.15,.1]);
 await click('Fire Forensics');await click('Apollo 13');assert.ok(await evaluate(`!!(document.querySelector('.incident-actions').compareDocumentPosition(document.querySelector('.incident-summary'))&Node.DOCUMENT_POSITION_PRECEDING)`));await click('Load Scenario into');await until(`!!document.querySelector('.scenario-banner')`,'Scenario context');await click('Exit Scenario');
 await click('Hybrid GraphRAG');await until(`!!document.querySelector('#engineering-query')`,'Advisor');
 assert.equal(await evaluate(`document.querySelectorAll('.preset-prompts button').length`),4);await click('AI settings');await setValue('#deepseek-api-key','sk-browser-test-placeholder');await click('Save settings');assert.ok(await evaluate(`localStorage.getItem('pyrozero-deepseek-key')==='sk-browser-test-placeholder'`));await click('AI settings');await click('Remove key');assert.equal(await evaluate(`localStorage.getItem('pyrozero-deepseek-key')`),null);await setValue('#engineering-query','Compare PMMA and Nomex on the Moon at 34% O2 and 56.5 kPa');await click('Send question');await until(`!!document.querySelector('.answer-table')&&!document.querySelector('.query-form button[type="submit"]').disabled`,'Grounded response');
 assert.ok((await evaluate('document.body.innerText')).includes('Reference answer'));assert.equal(await evaluate(`document.querySelectorAll('.advisor-source-card').length`),6);await click('+ Show');assert.ok(await evaluate(`document.querySelectorAll('.advisor-source-card').length>6`));await click('Show fewer sources');
 mkdirSync('docs/screenshots',{recursive:true});
 for(const theme of ['light','dark']){
  await evaluate(`localStorage.setItem('pyrozero-theme',${JSON.stringify(theme)});window.dispatchEvent(new Event('pyrozero-theme'))`);await wait(200);
  for(const width of [1440,1354,1280,1200,1100,1024]){
   const height=width===1354?600:900;
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false},session);
   for(const name of ['PSI Mission Explorer','Partial-g Flammability Lab','Fire Forensics','Hybrid GraphRAG']){
    await click(name);await evaluate('window.scrollTo({top:0,behavior:"instant"})');await wait(250);
    const metrics=await evaluate(`({scroll:document.documentElement.scrollWidth,positions:[...document.querySelectorAll('.side-column,.control-deck,.copilot-graph')].map(e=>getComputedStyle(e).position),nav:getComputedStyle(document.querySelector('.module-nav')).overflowX,workspacePadding:getComputedStyle(document.querySelector('.workspace')).paddingLeft})`);
    assert.ok(metrics.scroll<=width+1,`${theme} ${width} ${name} overflow ${metrics.scroll}`);
    const nav=await evaluate(`(()=>{const nav=document.querySelector('.module-nav'),n=nav.getBoundingClientRect(),buttons=[...nav.querySelectorAll('button')].map(e=>e.getBoundingClientRect()),u=document.querySelector('.topbar-right').getBoundingClientRect();return {row:Math.max(...buttons.map(r=>r.top))-Math.min(...buttons.map(r=>r.top)),fits:buttons.every(r=>r.left>=n.left-1&&r.right<=n.right+1),separate:n.right<=u.left-8,brandLeft:document.querySelector('.pyro-brand').getBoundingClientRect().right<=n.left-8,height:document.querySelector('.topbar').getBoundingClientRect().height}})()`);assert.ok(nav.row<2&&nav.fits&&nav.separate&&nav.brandLeft&&nav.height<100,`${width} bad navigation ${JSON.stringify(nav)}`);
    if(name==='Fire Forensics'){
     const incident=await evaluate(`(()=>{const a=document.querySelector('.incident-actions'),r=a.getBoundingClientRect(),button=a.querySelector('button').getBoundingClientRect(),context=a.querySelector('span').getBoundingClientRect(),panel=document.querySelector('.forensics-grid>.panel').getBoundingClientRect(),note=document.querySelector('.mission-note').getBoundingClientRect();return {separate:!a.closest('.panel-head'),aligned:Math.abs(panel.left-note.left)<3,notOverlapping:context.right<button.left-8,buttonInside:button.right<=r.right+1,oneHeading:document.querySelectorAll('.mission-note h2,.mission-note h3').length===1}})()`);assert.ok(incident.separate&&incident.aligned&&incident.notOverlapping&&incident.buttonInside&&incident.oneHeading,`${width} bad incident ${JSON.stringify(incident)}`);
    }
assert.ok(metrics.positions.every(p=>p!=='sticky'&&p!=='fixed'),`${name} sticky`);
    if(width<=768&&name==='Hybrid GraphRAG'){assert.equal(await evaluate(`document.querySelector('.advisor-graph-drawer').open`),false);assert.ok(await evaluate(`document.querySelectorAll('.connected-evidence-list button').length>0`));}
    if(width<=768){assert.ok(await evaluate(`(()=>{const n=document.querySelector('.module-nav').getBoundingClientRect(),a=document.querySelector('.module-nav [aria-current="page"]').getBoundingClientRect();return a.left>=n.left-2&&a.right<=n.right+2})()`),'Active mobile nav pill must be visible');assert.equal(metrics.nav,'auto');assert.equal(metrics.workspacePadding,'16px');if(name==='PSI Mission Explorer'||name==='Partial-g Flammability Lab'){assert.equal(await evaluate(`document.querySelector('.telemetry-disclosure').open`),false);await evaluate(`document.querySelector('.telemetry-disclosure').open=true`);await wait(100);assert.equal(await evaluate(`getComputedStyle(document.querySelector('.telemetry-strip')).gridTemplateColumns.split(' ').length`),2);await evaluate(`document.querySelector('.telemetry-disclosure').open=false`);}}
    const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},session);writeFileSync(`docs/screenshots/desktop-v7-${theme}-${width}-${name.split(' ')[0]}.png`,Buffer.from(shot.data,'base64'));
    if(width===1440){const before=await evaluate(`document.querySelector('.side-column,.control-deck,.copilot-graph')?.getBoundingClientRect().top??null`);await evaluate('window.scrollTo({top:300,behavior:"instant"})');await wait(150);const after=await evaluate(`document.querySelector('.side-column,.control-deck,.copilot-graph')?.getBoundingClientRect().top??null`);if(before!==null)assert.ok(after<before-100,`${name}: sidebar did not scroll naturally`);}
    if(name==='Fire Forensics'){
     if(width===1354&&theme==='light'){await evaluate(`document.querySelector('.incident-list>button').click();window.scrollTo({top:0,behavior:"instant"})`);await wait(200);const firstCase=await send('Page.captureScreenshot',{format:'png'},session);writeFileSync('docs/screenshots/desktop-v7-light-1354-Apollo1.png',Buffer.from(firstCase.data,'base64'));}
     await evaluate('window.scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"})');await wait(150);
     const end=await send('Page.captureScreenshot',{format:'png'},session);writeFileSync(`docs/screenshots/desktop-v7-${theme}-${width}-bottom.png`,Buffer.from(end.data,'base64'));
     assert.ok(await evaluate(`document.querySelector('footer').getBoundingClientRect().height<110`),'Footer must stay compact');
    }
    results.push({width,height,theme,module:name,...metrics});
   }
  }
 }
 assert.deepEqual(browserErrors,[]);writeFileSync('docs/browser-results-desktop-v7.json',JSON.stringify({origin,status:'PASS',checks:results,browserErrors,liveDeepSeekVerified:false},null,2));console.log('PASS:48 desktop module/theme/viewport checks, single-row navigation, scenario placement, aligned mission note and compact footer.');
}catch(error){mkdirSync('docs/screenshots',{recursive:true});const shot=await send('Page.captureScreenshot',{format:'png'},session).catch(()=>null);if(shot)writeFileSync('docs/screenshots/browser-failure-desktop-v7.png',Buffer.from(shot.data,'base64'));console.error(await evaluate('document.body.innerText').catch(()=>''));throw error;}finally{await send('Browser.close').catch(()=>{});socket.close();}
