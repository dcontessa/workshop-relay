export type Settings={mode:'browser'|'local'|'custom';endpoint:string;model:string;key:string};
export type Trace={phase?:string;kind?:string;status?:string;network?:string;agent?:string;origin?:string;peerOrigin?:string;model?:string;method?:string;verifiedReal?:boolean;error?:string;durationMs?:number;wall?:number};
export const defaultSettings:Settings={mode:'local',endpoint:new URL('api/local-llm/v1',document.baseURI).href,model:'qwen2.5:7b',key:''};
export const browserSettings:Settings={mode:'browser',endpoint:new URL('__browser-inference/v1',document.baseURI).href,model:'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',key:''};
export function runAgents(input:unknown,onMessage:(data:any)=>void){
 const worker=new Worker(new URL('runtime-worker.js',document.baseURI),{type:'module'});
 let ended=false;
 const stop=()=>{if(ended)return;ended=true;clearTimeout(timer);worker.terminate();};
 let timer=setTimeout(()=>{stop();onMessage({type:'error',message:'Model setup timed out. Execution was stopped. Your manual plan is unchanged.'});},600000);
 worker.onmessage=({data})=>{if(ended)return;if(data.type==='ready'){clearTimeout(timer);timer=setTimeout(()=>{stop();onMessage({type:'error',message:'The agent run reached its 90-second limit. Execution was stopped. Your manual plan is unchanged.'});},90000);}onMessage(data);if(['result','error'].includes(data.type))stop();};
 worker.onerror=()=>{stop();onMessage({type:'error',message:'The browser agent runtime stopped unexpectedly. Your manual plan is still available.'});};
 worker.postMessage({type:'start',...input as object});return stop;
}
