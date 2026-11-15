import { readFile, readdir, mkdir, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { build } from 'esbuild';

// Next.js still performs the authoritative production build, including its real
// dynamic API route. The existing Sites host accepts a Worker ESM entrypoint;
// package its prerendered single-page UI and the identical shared POST handler.
const assets={};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.ico':'image/x-icon','.rsc':'text/x-component'};
async function add(url,path){const bytes=await readFile(path);const ext=path.slice(path.lastIndexOf('.'));assets[url]={body:bytes.toString('base64'),type:mime[ext]||'application/octet-stream'};}
async function tree(directory,url){for(const entry of await readdir(directory,{withFileTypes:true})){const path=join(directory,entry.name),assetUrl=url+'/'+entry.name;if(entry.isDirectory())await tree(path,assetUrl);else if(!entry.name.endsWith('.map'))await add(assetUrl,path);}}
await add('/','.next/server/app/index.html');
await add('/index.html','.next/server/app/index.html');
await add('/index.rsc','.next/server/app/index.rsc');
await add('/404.html','.next/server/app/_not-found.html');
await tree('.next/static','/_next/static');
await tree('public','');
await mkdir('.sites-runtime',{recursive:true});
await mkdir('dist/server',{recursive:true});
await writeFile('dist/package.json',JSON.stringify({type:'module'}));
await writeFile('.sites-runtime/embedded.sites-assets.json',JSON.stringify(assets));
await build({entryPoints:['worker/index.ts'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,tsconfig:'tsconfig.json',legalComments:'none'});
const output=await stat('dist/server/index.js');
console.log(`Sites Worker built: ${Object.keys(assets).length} embedded Next.js assets; ${output.size} bytes; live /api/copilot shared handler.`);
