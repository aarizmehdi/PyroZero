import assets from '../.sites-runtime/embedded.sites-assets.json';
import { handleCopilotRequest, type CopilotEnvironment } from '../src/lib/copilot-service';

const files:Record<string,{body:string;type:string}>=assets;
const decoded=new Map<string,ArrayBuffer>();
const worker = {
  async fetch(request:Request,env:CopilotEnvironment):Promise<Response>{
    const url=new URL(request.url);
    if(url.pathname==='/api/copilot'){
      if(request.method==='GET')return Response.json({service:'PyroZero copilot',method:'POST',stages:['retrieve','compute','synthesize']});
      return handleCopilotRequest(request,{env});
    }
    if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
    const path=url.pathname;
    const resource=files[path];
    if(!resource){const fallback=files['/404.html'];return new Response(Uint8Array.from(atob(fallback.body),c=>c.charCodeAt(0)),{status:404,headers:{'Content-Type':fallback.type}})}
    if(!decoded.has(path))decoded.set(path,Uint8Array.from(atob(resource.body),c=>c.charCodeAt(0)).buffer);
    return new Response(request.method==='HEAD'?null:decoded.get(path)!,{headers:{'Content-Type':resource.type,'X-Content-Type-Options':'nosniff','Cache-Control':path.startsWith('/_next/static/')?'public, max-age=31536000, immutable':'no-cache'}});
  },
};
export default worker;
