import fs from 'node:fs';
import {createHash} from 'node:crypto';
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
let calibrated=0;
for(const p of entries.ECOJOI_CATALOGUE){
 const profile=geometry.catalogueProfile(p.model),rule=layout.templateFor(p.model,'SILK FRENTE E VERSO');
 if(!rule)continue;calibrated++;
 const units=(profile.fullHeight??profile.points.at(-1)[1])/rule.productHeightMm;
 for(const faces of [true,false]){
  const area=layout.printArea(profile,p.model,faces,'SILK FRENTE E VERSO');
  assert(Math.abs(area.height/units-rule.heightMm)<1e-6,p.model+' exact template height');
  assert(area.bottom>=profile.printMin&&area.top<profile.points.at(-1)[1],p.model+' body boundary');
  assert(area.width/units<=rule.widthMm+1e-6,p.model+' width cannot exceed template');
  const geo=faces?layout.faceGeometry(profile,area):layout.wrapGeometry(profile,area);
  for(const n of geo.attributes.position.array)assert(Number.isFinite(n));geo.dispose();
  for(const [w,h] of [[1200,300],[300,1200],[800,800]]){const box=layout.containRect(w,h,area.width,area.height,.025);assert(box.x>=0&&box.y>=0);assert(box.x+box.width<=area.width+1e-8&&box.y+box.height<=area.height+1e-8);assert(Math.abs(box.width/box.height-w/h)<1e-9);}
 }
}
assert.equal(calibrated,8);console.log('PASS 8 model-specific Silk references: dimensions, body limits and proportional fit.');
for(const model of ['COPO ECO 450 ML','COPO ECO 450 ML COM TAMPA BUCKS']){
 const rule=layout.templateFor(model,'SILK');assert.equal(rule.widthMm,200);assert.equal(rule.heightMm,125);assert.equal(rule.source,'GABARITO COPO ECO 450ML.pdf');
}
const imported=JSON.parse(fs.readFileSync(new URL('../docs/gabaritos-import-2026-09-25.json',import.meta.url),'utf8'));
assert.equal(imported.length,8);
for(const entry of imported){const data=fs.readFileSync(new URL('../public'+entry.file,import.meta.url));assert.equal(data.subarray(0,5).toString(),'%PDF-');assert.equal(createHash('sha256').update(data).digest('hex'),entry.sha256);}
for(const product of entries.ECOJOI_CATALOGUE){const rule=layout.templateFor(product.model,'SILK');if(rule)assert(imported.some(f=>f.file===rule.pdfPath&&f.status==='linked-silk'));}
assert.equal(layout.templateFor('CANECA CHOPP 500 ML','SILK'),undefined,'Do not guess unspecified mug capacity');
console.log('PASS imported original PDFs: byte integrity, linked downloads and Eco 450 useful area.');
for(const model of ['COPO ECO 450 ML','COPO ECO 450 ML COM TAMPA BUCKS','COPO ECO 600 ML']){
 const rule=layout.templateFor(model,'DIGITAL 360'),silk=layout.templateFor(model,'SILK'),profile=geometry.catalogueProfile(model);
 assert(rule.sheet&&!silk.sheet);assert(rule.source.includes('USIJET'));
 assert(layout.matchesSheet(rule,...rule.sheet.page));assert(!layout.matchesSheet(rule,1000,1000));
 const area=layout.printArea(profile,model,false,'DIGITAL 360');assert(area.bottom>=profile.printMin&&area.top<profile.points.at(-1)[1]);
 const g=layout.wrapGeometry(profile,area),positions=g.attributes.position.array.slice();layout.applySheetUV(g,rule);
 assert.deepEqual(g.attributes.position.array,positions,'UV calibration does not alter cup geometry');
 for(const value of g.attributes.uv.array)assert(Number.isFinite(value)&&value>=0&&value<=1,'UV stays inside the supplied page');
 const sample=new THREE.BufferGeometry();sample.setAttribute('uv',new THREE.Float32BufferAttribute([0,1,.5,1,1,1,0,0,.5,0,1,0],2));layout.applySheetUV(sample,rule);
 const uv=sample.attributes.uv;assert(uv.getY(1)>uv.getY(0)&&uv.getY(1)>uv.getY(2),'upper curved edge retained');assert(uv.getY(4)>uv.getY(3)&&uv.getY(4)>uv.getY(5),'lower curved edge retained');assert(uv.getY(1)>uv.getY(4),'top and bottom not inverted');
 g.dispose();sample.dispose();
}
assert.equal(layout.templateFor('TAÇA GIN 550 ML','DIGITAL 360'),undefined);
console.log('PASS USIJET 450/600 Digital process isolation, full-page detection, curved UVs and unchanged model geometry.');
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
