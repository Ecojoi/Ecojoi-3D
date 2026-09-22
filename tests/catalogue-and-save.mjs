import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as THREE from 'three';
function moduleAt(file,deps={}){const source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),exports={};new Function('require','exports',ts.transpile(source,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}))(name=>{assert(name in deps,'Unresolved '+name);return deps[name];},exports);return exports;}
const entries=moduleAt('lib/ecojoi-catalog.ts');
const legacy=JSON.parse(fs.readFileSync(new URL('../lib/reference-catalog.json',import.meta.url),'utf8'));
const catalog=moduleAt('lib/catalog.ts',{'./ecojoi-catalog':entries,'./reference-catalog.json':{default:legacy},'./catalogue-compatibility.json':{default:JSON.parse(fs.readFileSync(new URL('../lib/catalogue-compatibility.json',import.meta.url),'utf8'))}});
const layout=moduleAt('lib/print-layout.ts',{'three':THREE});
const geometry=moduleAt('lib/catalogue-geometry.ts',{'three':THREE,'./ecojoi-catalog':entries});
assert.equal(entries.ECOJOI_CATALOGUE.length,21);
assert.equal(new Set(entries.ECOJOI_CATALOGUE.map(p=>p.model)).size,21);
for(const p of entries.ECOJOI_CATALOGUE){
 const profile=geometry.catalogueProfile(p.model);assert(profile,p.model);
 const body=geometry.catalogueBody(profile);for(const n of body.attributes.position.array)assert(Number.isFinite(n));body.dispose();
 for(const print of p.prints){
  assert(catalog.modelsFor(print).includes(p.model));assert(catalog.colorsFor(print,p.model).length);const colors=catalog.displayColorsFor(print,p.model);assert.equal(new Set(colors.map(c=>c.toUpperCase())).size,colors.length);
  const area=layout.printArea(profile,p.model,true);assert(area.top>area.bottom&&area.bottom>=profile.printMin);
  for(const make of [layout.faceGeometry,layout.wrapGeometry]){const g=make(profile,area);for(const n of g.attributes.position.array)assert(Number.isFinite(n));for(const n of g.attributes.normal.array)assert(Number.isFinite(n));g.dispose();}
 }
}
for(const p of legacy.palettes)for(const print of p.prints){assert(!catalog.modelsFor(print).includes(p.model));assert(catalog.modelsFor(print,p.model).includes(p.model));assert.deepEqual(catalog.colorsFor(print,p.model),p.indices.map(i=>legacy.names[i]));}
console.log('PASS 21 catalogue products: colors, geometry and printable areas; all legacy choices remain editable but hidden for new layouts.');

const {designSignature:signature}=moduleAt('lib/design-signature.ts');
const studio=fs.readFileSync(new URL('../app/studio.tsx',import.meta.url),'utf8');
const saveSource=studio.slice(studio.indexOf('  if(saveTask.current)return'),studio.indexOf('\n },[]);',studio.indexOf(' const save=useCallback')));
const saveJS=ts.transpile('async function save(){'+saveSource+'}',{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None});
const product={id:'p1',print:'SILK',model:'COPO ECO 450 ML',color:'Branco Opaco',art:null,artMode:'logo',logoSize:'large'};
const initial={id:'d1',name:'Teste PDF',products:[],version:1,updatedAt:0};
const current={current:{...initial,products:[product]}},saved={current:signature(initial)},version={current:1},saveTask={current:null};
let calls=0,concurrent=false,persisted;
async function api(path,method,data){assert.equal(method,'PUT');assert(++calls<5,'Save must terminate, not loop on key order');await Promise.resolve();persisted={...data,products:data.products.map(p=>({logoSize:p.logoSize,artMode:p.artMode,id:p.id,print:p.print,model:p.model,color:p.color,art:p.art?{...p.art,name:'enriched.png',size:1500}:null})),version:data.version+1,updatedAt:Date.now()};if(concurrent){concurrent=false;current.current={...current.current,name:'Edit made while saving'};}return persisted;}
const save=new Function('saveTask','current','signature','saved','setSaveState','api','version','setDesign','setError',saveJS+';return save;')(saveTask,current,signature,saved,()=>{},api,version,()=>{},()=>{});
await save();assert.equal(calls,1);assert.equal(signature(current.current),signature(persisted));
current.current={...current.current,products:[{...product,art:{id:'asset-pdf',name:'logo-pagina-1.png',type:'image/png',size:99}}]};
await save();assert.equal(calls,2);assert.equal(persisted.products[0].art.id,'asset-pdf');
current.current={...current.current,name:'Before concurrent change'};concurrent=true;await save();assert.equal(calls,4);assert.equal(persisted.name,'Edit made while saving');
await save();assert.equal(calls,4);
console.log('PASS actual Studio save loop: PDF attachment completes despite server field ordering and metadata; concurrent edits persist; clean state makes no extra requests.');
