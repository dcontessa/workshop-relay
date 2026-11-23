import test from 'node:test';
import assert from 'node:assert/strict';
// @ts-ignore — vendored reference runtime is plain JavaScript.
import {AgentNetwork,validateNetwork,filterSlyData} from '../public/runtime/kernel.js';
// @ts-ignore — vendored reference runtime is plain JavaScript.
import {Engine,manifestAllowsPeer,selectPeerRouter} from '../public/runtime/engine.js';
// @ts-ignore — vendored reference runtime is plain JavaScript.
import {RemoteRegistry} from '../public/runtime/remote.js';
// @ts-ignore — vendored reference runtime is plain JavaScript.
import {consumeRemoteBudget} from '../public/runtime/runner.js';
import net from '../public/workshop_relay.network.json';
test('published planner validates as a two-agent network',()=>{const n=new AgentNetwork(net,'workshop_relay');assert.deepEqual(validateNetwork(n).errors,[]);assert.equal(n.findFrontMan(),'coordinator');});
test('duplicate agent definitions fail validation',()=>{const n=structuredClone(net);n.tools.push(n.tools[0]);assert.ok(validateNetwork(new AgentNetwork(n,'bad')).errors.length>0);});
test('peer policy denies undeclared origins',()=>{assert.equal(manifestAllowsPeer('https://bad.example/a',{allowed_peers:['https://ok.example']}),false);});
test('peer cannot replace active router',()=>assert.deepEqual(selectPeerRouter({baseUrl:'https://caller.example/v1',mock:false}),{baseUrl:'https://caller.example/v1',mock:false}));
test('private context is deny-by-default',()=>assert.deepEqual(filterSlyData({secret:'private',public:'ok'},[]),{}));
test('private context forwards only explicitly named fields',()=>assert.deepEqual(filterSlyData({secret:'private',public:'ok'},['public']),{public:'ok'}));
test('composition cycles and depth are rejected',()=>{const r=new RemoteRegistry({maxDepth:2});assert.throws(()=>r.checkCycle(['https://peer.example::x'],'https://peer.example','x'),/cycle/);assert.throws(()=>r.checkCycle(['a','b'],'https://peer.example','x'),/depth/);});
test('finite peer budget rejects extra calls',()=>{const c={remoteCalls:0,maxRemoteCalls:1,peerCalls:new Map(),maxCallsPerPeer:1,deadline:Date.now()+1000};assert.equal(consumeRemoteBudget(c,'one'),null);assert.match(consumeRemoteBudget(c,'two'),/limit/);});
test('past deadline rejects peer work',()=>assert.match(consumeRemoteBudget({deadline:0},'one'),/deadline/));
test('exact network-name mismatch does not run a different network',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({networks:[{name:'different',hocon:'different.json'}]}));
 try{const e=new Engine({originUrl:'https://caller.example'});e.top={base:'https://caller.example',manifest:{allowed_peers:['https://peer.example']}};await assert.rejects(e.resolveRemote('https://peer.example/requested',[],null),/No published network named/);}finally{globalThis.fetch=original;}
});
