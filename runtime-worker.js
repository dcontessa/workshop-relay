// Workshop Relay boundary around the pinned reference runtime.
// The worker is terminated by the UI on cancel/deadline, aborting its fetches and model loop.
import { Engine } from './runtime/engine.js';
import { TraceBus } from './runtime/trace.js';
const nativeFetch=self.fetch.bind(self);
let started=false;
self.onmessage=async({data})=>{
 if(started||data.type!=='start')return;started=true;
 const {base,sites,settings,state}=data;
 const top=new URL(base);const router=new URL(settings.endpoint,base);
 let browserModel;
 if(settings.mode==='browser'){
  try{browserModel=await import('./browser-model.bundle.js');await browserModel.prepare(text=>self.postMessage({type:'progress',text}));}
  catch(e){self.postMessage({type:'error',message:String(e?.message||e)});return;}
 }
 self.postMessage({type:'ready'});
 const approved=sites.map(s=>new URL(s));
 const isLoopback=u=>['localhost','127.0.0.1','127.0.0.2','[::1]'].includes(u.hostname);
 if(router.protocol!=='https:'&&!(router.protocol==='http:'&&isLoopback(router))){self.postMessage({type:'error',message:'The model endpoint must use HTTPS or loopback HTTP.'});return;}
 let modelCalls=0;let artifactCalls=0;
 const inside=(u,b)=>u.origin===b.origin&&(u.pathname===b.pathname||u.pathname.startsWith(b.pathname.replace(/\/$/,'')+'/'));
 self.fetch=async(input,init={})=>{
  const url=new URL(typeof input==='string'?input:input.url,base);
  const method=(init.method||'GET').toUpperCase();
  const inference=url.href===router.href.replace(/\/$/,'')+'/chat/completions';
  const headers=new Headers(init.headers);
  if(inference){if(method!=='POST'||++modelCalls>16)throw new Error('Model call budget exceeded.');if(browserModel)return browserModel.complete(JSON.parse(init.body));}
  else{
   const local=inside(url,top),peer=approved.some(p=>inside(url,p));
   if((!local&&!peer)||method!=='GET'||!url.pathname.endsWith('.json'))throw new Error('Blocked undeclared network request.');
   if(++artifactCalls>30)throw new Error('Public artifact request budget exceeded.');
   headers.delete('Authorization');headers.delete('Cookie');
  }
  const response=await nativeFetch(url,{...init,headers,credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.any([AbortSignal.timeout(inference?60000:12000),...(init.signal?[init.signal]:[])])});
  if(!inference&&response.ok){
   const text=await response.text();if(text.length>200000)throw new Error('Agent artifact exceeds size limit.');
   const parsed=JSON.parse(text);
   if(url.pathname.endsWith('agent-manifest.json')){
    if(!Array.isArray(parsed.networks)||parsed.networks.length===0)throw new Error('Invalid network manifest.');
    if(parsed.coded_tools)throw new Error('Executable peer tool bundles are not supported by this planner.');
    if(url.origin!==top.origin&&parsed.actions)throw new Error('Remote write/action bridges are outside this planner’s permissions.');
    for(const n of parsed.networks){const def=new URL(n.hocon,url);if(!approved.some(p=>inside(def,p))&&!inside(def,top))throw new Error('Network definition points outside approved sites.');}
   }
   return new Response(text,{status:response.status,headers:response.headers});
  }
  return response;
 };
 self.workshopState={brief:{...state.brief,budgetMYR:state.brief.budgetMinor/100},catalogues:state.catalogues.map(c=>({providerId:c.providerId,version:c.version,offers:c.offers.map(o=>({id:o.id,title:o.title,kind:o.kind,capacity:o.capacity,dates:o.dates,location:o.location,topics:o.topics,facilities:o.facilities,available:o.available,totalMYR:(o.priceMinor+o.feesMinor)/100}))})),feasiblePlans:state.evaluation.plans.map(p=>({trainer_id:p.trainer.id,venue_id:p.venue.id,totalMYR:p.totalMinor/100})),rejectedOffers:state.evaluation.rejects};
 delete self.workshopState.brief.budgetMinor;
 const trace=new TraceBus();
 trace.addEventListener('event',({detail:e})=>{
  if(e.phase==='update')return;
  const safe={phase:e.phase,kind:e.kind,status:e.status,network:e.network,agent:e.agent,origin:e.origin,peerOrigin:e.peerOrigin,method:e.method,model:e.model,verifiedReal:e.verifiedReal,error:e.error,durationMs:e.durationMs,wall:e.wall};
  self.postMessage({type:'trace',event:safe});
 });
 try{
  const engine=new Engine({originUrl:base,trace,byokKey:settings.key||'',routerOverride:router.href,modelOverride:settings.model,allowAnonymous:settings.mode!=='custom'});
  engine.registry.maxDepth=3;
  engine.onConsent=async info=>approved.some(p=>info.peerOrigin===p.host||info.peerOrigin===p.origin)?'allow':'decline';
  engine.onActionConfirm=async()=>false;
  await engine.loadTop();
  const result=await engine.runTurn('Call website_get_planning_state, then trainer, then venue, then constraints_reviewer. After those four tools succeed, return ONLY JSON {"trainer_id":"T1","venue_id":"V1"} using the actual selected IDs from the feasiblePlans data. You must call both trainer and venue. Pass the public catalogue and brief in their request. Do not write prose, totals, booking claims, or markdown. If no feasible plan exists return {"no_match":true}.');
  const peerRuns=trace.events.filter(e=>e.kind==='remote_call'&&e.phase==='end'&&e.status==='ok').length;
  const realCalls=trace.events.filter(e=>e.kind==='model_call'&&e.phase==='end'&&e.verifiedReal).length;
  const completedPeers=new Set(trace.events.filter(e=>e.kind==='remote_call'&&e.phase==='end'&&e.status==='ok').map(e=>e.network));
  if(!completedPeers.has('trainer')||!completedPeers.has('venue'))throw new Error('Both provider consultations must complete. Your verified manual plan is unchanged.');
  const match=result.text.match(/\{[\s\S]*\}/);let proposal;try{proposal=JSON.parse(match?.[0]||'');}catch{throw new Error('The model did not return a valid plan proposal. No model-generated claim was accepted; use the verified manual plan.');}
  const chosen=state.evaluation.plans.find(p=>p.trainer.id===proposal.trainer_id&&p.venue.id===proposal.venue_id);
  if(!chosen&&!(proposal.no_match===true&&state.evaluation.plans.length===0))throw new Error('The model proposed an unverified combination. It was rejected. The manual plan is unchanged.');
  const text=chosen?`The agent-selected combination ${chosen.trainer.id} + ${chosen.venue.id} passes the date, capacity, location, facilities and budget checks. Prices and availability were validated against the published catalogues. This is a planning recommendation, not a reservation.`:'The agents found no feasible combination. No constraint was relaxed.';
  self.postMessage({type:'result',text,selectedId:chosen?.id,peerRuns,realCalls});
 }catch(e){self.postMessage({type:'error',message:String(e?.message||e)});}
};
