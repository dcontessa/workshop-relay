import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.wasm':'application/wasm'};
export function staticServer(dir,port,host='127.0.0.1'){
 return createServer(async(req,res)=>{
  try{
   if(!['GET','HEAD','OPTIONS'].includes(req.method)){res.writeHead(405);return res.end();}
   const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const file=resolve(dir,`.${path.endsWith('/')?path+'index.html':path}`);
   if(!file.startsWith(resolve(dir)+'/')){res.writeHead(403);return res.end();}
   const data=await readFile(file);
   const publicArtifact=/\.(json|js|mjs)$/.test(file);
   res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(publicArtifact?{'Access-Control-Allow-Origin':'*'}:{})});
   res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404);res.end('Not found');}
 }).listen(port,host,()=>console.log(`Serving ${dir} on http://${host}:${port}`));
}
export function inferenceProxy(port=5193){
 const active=new Set();
 return createServer(async(req,res)=>{
  if(req.url==='/api/local-llm/health'){try{const r=await fetch('http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(2000)});const d=await r.json();res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({available:true,models:d.models?.map(m=>m.name)||[]}));}catch{res.writeHead(503);return res.end('{"available":false}');}}
  if(req.url!=='/api/local-llm/v1/chat/completions'||req.method!=='POST'){res.writeHead(404);return res.end();}
  const origin=req.headers.origin;
  if(origin&&!['http://127.0.0.1:5190','http://localhost:5190'].includes(origin)){res.writeHead(403);return res.end();}
  if(active.size>=2){res.writeHead(429);return res.end('Local model is busy.');}
  let body='';const controller=new AbortController();active.add(controller);
  req.on('data',b=>{body+=b;if(body.length>120000){controller.abort();req.destroy();}});
  req.on('end',async()=>{
   const timer=setTimeout(()=>controller.abort(),60000);res.on('close',()=>controller.abort());
   try{const input=JSON.parse(body);if(!['qwen2.5:7b','qwen2.5:14b','llama3.2:latest'].includes(input.model))throw new Error('Unsupported local model');
    input.max_tokens=350;input.temperature=0;
    const upstream=await fetch('http://127.0.0.1:11434/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:controller.signal});
    res.writeHead(upstream.status,{'Content-Type':upstream.headers.get('content-type')||'text/event-stream','X-Nsdeploy-LLM-Route':'local-ollama'});
    for await(const chunk of upstream.body)res.write(chunk);res.end();
   }catch(e){if(!res.headersSent)res.writeHead(502);res.end('Local inference failed or was cancelled.');}finally{clearTimeout(timer);active.delete(controller);}
  });
 }).listen(port,'127.0.0.1',()=>console.log(`Local-only inference bridge: ${port}`));
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 staticServer(join(root,'dist'),5190);staticServer(join(root,'public/providers/trainer'),5191,'localhost');staticServer(join(root,'public/providers/venue'),5192,'localhost');inferenceProxy();
}
