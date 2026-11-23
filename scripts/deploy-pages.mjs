// Publishes only an already-built dist directory to this project's Pages branch.
import {mkdtemp,cp,readdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(new URL('..',import.meta.url).pathname);
const target='https://github.com/dcontessa/workshop-relay.git';
const dir=await mkdtemp(join(tmpdir(),'workshop-relay-pages-'));
const git=(...args)=>execFileSync('git',args,{cwd:dir,stdio:'inherit'});
try{
 git('init','-b','gh-pages');git('remote','add','origin',target);
 try{git('fetch','origin','gh-pages');git('reset','--hard','FETCH_HEAD');}catch{/* First publication has no branch. */}
 for(const name of await readdir(dir))if(name!=='.git')await rm(join(dir,name),{recursive:true,force:true});
 await cp(join(root,'dist'),dir,{recursive:true});await writeFile(join(dir,'.nojekyll'),'');
 git('add','.');
 let changed=true;try{execFileSync('git',['diff','--cached','--quiet'],{cwd:dir});changed=false;}catch{}
 if(changed){git('commit','-m','Publish Workshop Relay demo');git('push','origin','gh-pages');}
}finally{await rm(dir,{recursive:true,force:true});}
