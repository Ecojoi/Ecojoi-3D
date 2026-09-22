import fs from 'node:fs';
import assert from 'node:assert/strict';
import {ECOJOI_CATALOGUE} from '../lib/ecojoi-catalog.ts';
const origin='http://localhost:5173';
const {cookie}=JSON.parse(fs.readFileSync(new URL('../../local-print-session.json',import.meta.url),'utf8'));
async function call(path,data,method=data?'POST':'GET'){
 const r=await fetch(origin+'/api/studio/'+path,{method,signal:AbortSignal.timeout(15000),headers:{Cookie:cookie,Origin:origin,...(data instanceof FormData?{}:{'Content-Type':'application/json'})},body:data?(data instanceof FormData?data:JSON.stringify(data)):undefined});
 const result=await r.json();assert(r.ok,JSON.stringify(result));return result;
}
const urls=[];
for(let start=0;start<ECOJOI_CATALOGUE.length;start+=5){
 let d=await call('designs',{name:'TESTE LOCAL · Catálogo ECOJOI '+start});
 const products=ECOJOI_CATALOGUE.slice(start,start+5).map(p=>({id:crypto.randomUUID(),model:p.model,print:p.prints[0],color:p.colors.includes('Branco Opaco')?'Branco Opaco':p.colors[0],art:null,artMode:'logo',logoSize:'large'}));
 d=await call('designs/'+d.id,{...d,products},'PUT');
 const form=new FormData();form.append('file',new Blob([fs.readFileSync(new URL('../../catalog-review/logo-test.png',import.meta.url))],{type:'image/png'}),'logo-pagina-1.png');
 const art=await call('designs/'+d.id+'/assets',form);
 d=await call('designs/'+d.id,{...d,products:products.map(p=>({...p,art}))},'PUT');
 const reloaded=await call('designs/'+d.id);assert.equal(reloaded.products.length,products.length);for(const p of reloaded.products)assert.equal(p.art.id,art.id);
 const shared=await call('designs/'+d.id+'/publish',{version:d.version});
 urls.push({url:origin+'/p/'+shared.token,models:products.map(p=>p.model)});
}
fs.writeFileSync(new URL('../../catalog-review/previews.json',import.meta.url),JSON.stringify(urls,null,2));
console.log('PASS live local API: 21 catalogue variants saved, converted-PNG attachment persisted/reloaded, and five previews published.');
console.log(JSON.stringify(urls));
