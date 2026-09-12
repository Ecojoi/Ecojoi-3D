import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as THREE from 'three';
import {MODEL_PRINT_BANDS,printArea,faceGeometry,wrapGeometry,containRect} from '../lib/print-layout.ts';
const source=fs.readFileSync(new URL('../app/product-viewer.tsx',import.meta.url),'utf8');
const functionSource=source.slice(source.indexOf('export function modelProfile'),source.indexOf('export default function ProductViewer')).replace('export function','function');
const js=ts.transpile(functionSource,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None});
const modelProfile=new Function('THREE',js+';return modelProfile;')(THREE);
const catalog=JSON.parse(fs.readFileSync(new URL('../lib/reference-catalog.json',import.meta.url),'utf8'));
assert.equal(Object.keys(MODEL_PRINT_BANDS).length,catalog.palettes.length);
let variants=0;
for(const entry of catalog.palettes){
 assert(MODEL_PRINT_BANDS[entry.model.toUpperCase()],entry.model);
 const profile=modelProfile(entry.model),height=profile.points.at(-1)[1];
 for(const print of entry.prints){
  const faces=print==='SILK FRENTE E VERSO',area=printArea(profile,entry.model,faces);
  assert(area.bottom>=profile.printMin&&area.top<height&&area.top>area.bottom,entry.model);
  const geo=faces?faceGeometry(profile,area):wrapGeometry(profile,area);
  const pos=geo.attributes.position;
  for(const value of pos.array)assert(Number.isFinite(value));
  for(const value of geo.attributes.normal.array)assert(Number.isFinite(value));
  for(let i=0;i<pos.count;i++)assert(pos.getY(i)>=area.bottom-1e-6&&pos.getY(i)<=area.top+1e-6);
  if(profile.handle&&!faces){
   for(let i=0;i<pos.count;i++){
    const theta=Math.atan2(pos.getX(i),pos.getZ(i));
    const distance=Math.abs(Math.atan2(Math.sin(theta-Math.PI/2),Math.cos(theta-Math.PI/2)));
    assert(distance>=.36-1e-5,'Ink intersects handle clearance');
   }
  }
  if(entry.model.includes('GARRAFA'))assert(area.top<1.25,'Ink crosses bottle shoulder');
  for(const [w,h] of [[2400,600],[600,2400],[1000,1000]]){
   const rect=containRect(w,h,area.width,area.height,.06);
   assert(Math.abs(rect.width/rect.height-w/h)<1e-10);
  }
  geo.dispose();variants++;
 }
 console.log('PASS '+entry.model+' ('+entry.prints.length+' processes)');
}
console.log('PASS '+catalog.palettes.length+' models / '+variants+' model-process combinations.');
