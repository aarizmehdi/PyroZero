// Credentials arrive only on stdin and are never logged or written to disk.
const input=await new Promise(resolve=>{let value='';process.stdin.setEncoding('utf8');process.stdin.on('data',chunk=>{value+=chunk;const end=value.indexOf('\n');if(end>=0){process.stdin.pause();resolve(value.slice(0,end))}});process.stdin.on('end',()=>resolve(value));});
const {url,token}=JSON.parse(input);
const origin=new URL(url);if(origin.protocol!=='https:')throw new Error('Use the published HTTPS Site origin.');
let auth=token?`Bearer ${token}`:undefined;
const headers=()=>auth?{'OAI-Sites-Authorization':auth}:{};
let home=await fetch(origin,{headers:headers(),redirect:'follow'});
if([401,403].includes(home.status)&&token){auth=token;home=await fetch(origin,{headers:headers(),redirect:'follow'})}
if(!home.ok)throw new Error(`Published page returned HTTP ${home.status}`);
const html=await home.text();if(!html.includes('PyroZero'))throw new Error('Published page did not render PyroZero.');
const response=await fetch(new URL('/api/copilot',origin),{method:'POST',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify({query:'Compare PMMA and Nomex on the Moon at 34% O2 and 56.5 kPa'})});
if(!response.ok)throw new Error(`Published API returned HTTP ${response.status}`);
if(!(response.headers.get('content-type')||'').includes('text/event-stream'))throw new Error('Published API did not return an event stream.');
const text=await response.text();let result,done;
for(const block of text.split('\n\n')){const event=block.match(/^event: (.+)$/m)?.[1],data=block.match(/^data: (.+)$/m)?.[1];if(data&&event==='result')result=JSON.parse(data);if(data&&event==='done')done=JSON.parse(data)}
if(result?.rankings?.length!==15||result?.simulations?.length!==2||result?.stages?.length!==3||!done?.mode)throw new Error('Published API payload failed the investigation/material/stage checks.');
console.log(JSON.stringify({url:origin.origin,pageStatus:home.status,apiStatus:response.status,investigations:result.rankings.length,materials:result.simulations.length,stages:result.stages.length,citations:result.citations.length,mode:done.mode,status:'PASS'}));
