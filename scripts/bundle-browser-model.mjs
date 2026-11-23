import {build} from 'esbuild';
await build({entryPoints:['src/browser-model.ts'],outfile:'public/browser-model.bundle.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'eof'});
