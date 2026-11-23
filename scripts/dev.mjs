import { spawn } from 'node:child_process';
import { staticServer,inferenceProxy } from './serve.mjs';
const servers=[staticServer(new URL('../public/providers/trainer/',import.meta.url).pathname,5191,'localhost'),staticServer(new URL('../public/providers/venue/',import.meta.url).pathname,5192,'localhost'),inferenceProxy()];
const vite=spawn('node',['node_modules/vite/bin/vite.js'],{stdio:'inherit'});
const close=()=>{vite.kill();servers.forEach(s=>s.close());};process.on('SIGINT',close);process.on('SIGTERM',close);
