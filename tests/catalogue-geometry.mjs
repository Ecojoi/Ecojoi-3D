import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as THREE from 'three';

function load(file,deps={}){
 const source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),exports={};
 new Function('require','exports',ts.transpile(source,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}))(name=>{
  assert(name in deps,'Unresolved dependency: '+name);return deps[name];
 },exports);
 return exports;
}
const catalog=load('lib/ecojoi-catalog.ts');
const geom=load('lib/catalogue-geometry.ts',{'three':THREE,'./ecojoi-catalog':catalog});
const layout=load('lib/print-layout.ts',{'three':THREE});
let checked=0;
for(const p of catalog.ECOJOI_CATALOGUE){
 const profile=geom.catalogueProfile(p.model);
 assert(profile,p.model+' has no geometry');
 const visualHeight=profile.fullHeight??profile.points.at(-1)[1];
 assert(Math.abs(visualHeight-1.6)<1e-6,p.model+' scaled total height');
 for(let i=1;i<profile.points.length;i++)
  assert(profile.points[i][1]>profile.points[i-1][1],p.model+' profile y must ascend');
 if(!['strap','bag','gin','flute'].includes(p.kind)){
  const expectedBase=p.base*(1.6/p.height)/2;
  assert(Math.abs(profile.points[2][0]-expectedBase)<1e-6,p.model+' base diameter');
  if(p.kind!=='bottle'){
   const expectedMouth=p.mouth*(1.6/p.height)/2;
   assert(Math.abs(profile.points.at(-1)[0]-expectedMouth)<1e-6,p.model+' mouth diameter');
  }
 }
 const body=geom.catalogueBody(profile);
 body.computeBoundingBox();
 assert(body.boundingBox.min.y>=-.08,p.model+' mesh below ground');
 assert(body.boundingBox.max.y>0,p.model+' has no height');
 for(const value of body.attributes.position.array)
  assert(Number.isFinite(value),p.model+' invalid position');
 for(const value of body.attributes.normal.array)
  assert(Number.isFinite(value),p.model+' invalid normal');
 const mat=new THREE.MeshPhysicalMaterial({color:'#ffffff'});
 const scene=new THREE.Scene();
 geom.addCatalogueDetails(scene,profile,mat);
 if(p.kind==='mug'){
  assert(profile.handle,p.model+' missing mug handle');
  assert(scene.children.some(o=>o.isMesh&&o.geometry.type==='ExtrudeGeometry'),
   p.model+' handle must be solid with an opening');
 }
 if(p.kind==='bottle'){
  assert(profile.lid==='bottle',p.model+' missing flip cap');
  assert(scene.children.length>=5,p.model+' flip cap incomplete');
 }
 if(p.kind==='bucks')assert(profile.lid==='bucks',p.model+' missing Bucks lid');
 if(p.kind==='paper')assert(profile.paperLid&&scene.children.length>=3,p.model+' missing black paper-cup lid');
 if(p.kind==='bag'){
  assert(profile.flat&&profile.bag,p.model+' missing flat bag geometry');
  assert(body.type==='ExtrudeGeometry',p.model+' should not be a cylindrical bag');
  assert(body.boundingBox.max.x-body.boundingBox.min.x>visualHeight,
   p.model+' bag should be wider than tall');
 }
 if(p.kind==='disposable')assert(profile.ridges,p.model+' missing foot reinforcement');
 if(p.kind==='cup')assert(profile.points[8][0]>profile.points[7][0],p.model+' missing rolled rim');
 const area=layout.printArea(profile,p.model,true,p.prints[0]);
 assert(area.height>0&&area.top>area.bottom,p.model+' invalid printable band');
 const preview=layout.faceGeometry(profile,area);
 for(const n of preview.attributes.position.array)
  assert(Number.isFinite(n),p.model+' invalid artwork location');
 preview.dispose();body.dispose();
 scene.traverse(x=>{if(x.isMesh){x.geometry.dispose();if(x.material!==mat)x.material.dispose();}});
 mat.dispose();checked++;
}
assert.equal(checked,21);
console.log('PASS 21 ECOJOI models: contours, catalogue dimensions, mugs, flip-top bottle, bags, lips and print placement.');
