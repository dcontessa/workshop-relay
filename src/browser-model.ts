import {CreateMLCEngine,type MLCEngine} from '@mlc-ai/web-llm';
export const modelId='Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
let engine:MLCEngine;let queue=Promise.resolve();
export async function prepare(onProgress:(text:string)=>void){
 if(!(navigator as any).gpu)throw new Error('This browser does not support WebGPU. Use a current desktop Chrome/Edge browser, or configure another model.');
 engine=await CreateMLCEngine(modelId,{initProgressCallback:p=>onProgress(p.text)},{context_window_size:8192});
}
export async function complete(body:any){
 let release!:()=>void;const previous=queue;queue=new Promise<void>(r=>release=r);await previous;
 try{
  const tools=(body.tools||[]).map((t:any)=>t.function);
  const names=tools.map((t:any)=>t.name);
  const used=new Set(body.messages.flatMap((m:any)=>(m.tool_calls||[]).map((t:any)=>t.function.name)));
  const pending=names.filter((n:string)=>!used.has(n));
  const reader=pending.filter((n:string)=>n==='website_get_planning_state');
  const peers=pending.filter((n:string)=>n!=='website_get_planning_state'&&n!=='constraints_reviewer');
  const requiredTools=reader.length?reader:peers.length?peers:pending;
  const state=(self as any).workshopState;
  const bestPlans=state.feasiblePlans.filter((p:any)=>p.totalMYR===Math.min(...state.feasiblePlans.map((x:any)=>x.totalMYR)));
  const messages=body.messages.map((m:any)=>({role:m.role==='tool'?'user':m.role,content:m.role==='tool'?`Tool ${m.name||m.tool_call_id} result:\n${m.content}`:m.tool_calls?`Requested tools: ${JSON.stringify(m.tool_calls)}`:String(m.content||'')}));
  if(tools.length){
   messages[0].content+='\nYou use tools through JSON. Return {"tool":"NAME","request":"text"} to call one available tool, or {"tool":"final","trainer_id":"ID","venue_id":"ID"} after all required tools have returned. Available tools: '+JSON.stringify(tools)+'. Choose exactly one tool each turn. Never repeat a tool that already returned a useful result.';
  }else messages[0].content+='\nReturn JSON only. Use {"offer_ids":["ID"]} for provider advice, or {"valid":true} for a constraint review. Never invent an ID.';
  // WebLLM currently supports native function calls only on selected larger models.
  // This adapter uses its documented JSON mode and translates actual model decisions into tool calls.
  // Enforce the workflow's required consultations in the output schema. The model
  // chooses among pending providers and finally selects a catalogue-grounded plan.
  const schema=tools.length?(requiredTools.length?{type:'object',properties:{tool:{type:'string',enum:requiredTools}},required:['tool'],additionalProperties:false}:bestPlans.length?{type:'object',properties:{tool:{const:'final'},trainer_id:{type:'string',enum:[...new Set(bestPlans.map((p:any)=>p.trainer_id))]},venue_id:{type:'string',enum:[...new Set(bestPlans.map((p:any)=>p.venue_id))]}},required:['tool','trainer_id','venue_id'],additionalProperties:false}:{type:'object',properties:{tool:{const:'final'},no_match:{const:true}},required:['tool','no_match'],additionalProperties:false}):{type:'object'};
  messages[0].content+='\nCurrent allowed output schema: '+JSON.stringify(schema)+'. Select the lowest-total feasible plan when returning the final answer.';
  const response:any=await engine.chat.completions.create({messages,temperature:0,max_tokens:256,stream:false,response_format:{type:'json_object',schema:JSON.stringify(schema)}} as any);
  const content=response.choices[0].message.content||'{}';let data:any;try{data=JSON.parse(content);}catch{throw new Error('Browser model returned invalid JSON.');}
  let delta:any={content};let finish='stop';
  if(tools.length&&data.tool&&data.tool!=='final'){
   if(!names.includes(data.tool))throw new Error('Browser model requested an undeclared tool.');
   const name=data.tool;const args=name==='website_get_planning_state'?{}:{request:JSON.stringify(state)};
   delta={tool_calls:[{index:0,id:crypto.randomUUID(),type:'function',function:{name,arguments:JSON.stringify(args)}}]};finish='tool_calls';
  }else if(tools.length){delta={content:JSON.stringify({trainer_id:data.trainer_id,venue_id:data.venue_id,no_match:data.no_match})};}
  const chunks=[{model:modelId,choices:[{index:0,delta,finish_reason:null}]},{model:modelId,choices:[{index:0,delta:{},finish_reason:finish}],usage:response.usage}];
  return new Response(chunks.map(x=>'data: '+JSON.stringify(x)+'\n\n').join('')+'data: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream','X-Nsdeploy-LLM-Route':'browser-webgpu'}});
 }finally{release();}
}
