import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';

const root=resolve('out');
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
if(!existsSync(resolve(root,'index.html')))throw new Error('Build the static export first with npm run build.');
createServer((req,res)=>{
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch{res.writeHead(400);res.end('Bad request');return}
 let path=resolve(root,`.${pathname}`);
 if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403);res.end('Forbidden');return}
 if(existsSync(path)&&statSync(path).isDirectory())path=resolve(path,'index.html');
 if(!existsSync(path)&&existsSync(path+'.html'))path+='.html';
 if(!existsSync(path)||!statSync(path).isFile()){res.writeHead(404);res.end('Not found');return}
 res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});
 createReadStream(path).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log(`PyroZero production preview: http://127.0.0.1:${port}`));
