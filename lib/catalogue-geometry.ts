import * as THREE from 'three';
import {catalogueProduct} from './ecojoi-catalog';
import type {PrintProfile} from './print-layout';
export function catalogueProfile(model:string):PrintProfile|undefined{
 const p=catalogueProduct(model.replace(/^COPO DESCARTÁVEL (110|200) ML$/,'COPO DESCARTÁVEL DE PAPEL $1 ML'));if(!p)return;
 const scale=1.6/p.height,h=1.6,top=p.mouth*scale/2,base=p.base*scale/2;
 if(p.kind==='strap')return {points:[[.016,0],[.016,h]],printMin:.04,flat:{width:.032,depth:.004},band:{bottom:.03,top:.97}};
 if(p.kind==='bag')return {points:[[.01,0],[base,.035],[top,h*.78]],printMin:.12,ellipse:.48,bag:true,band:{bottom:.13,top:.67}};
 if(p.kind==='gin'||p.kind==='flute'){
  const flute=p.kind==='flute',stem=h*(flute?.35:.43),bowlBase=stem+.035;
  const curve=new THREE.CubicBezierCurve(new THREE.Vector2(.027,bowlBase),new THREE.Vector2(top*.5,h*.52),new THREE.Vector2(top,h*(flute?.69:.67)),new THREE.Vector2(top,h*(flute?.87:.82)));
  const points=curve.getPoints(96).map(v=>[v.x,v.y] as [number,number]);
  return {points:[[.01,0],[base,.018],[base,.04],[.035,.065],[.026,stem],...points,[top,h]],printMin:h*.59,band:{bottom:flute?.64:.63,top:.94}};
 }
 const bodyH=p.kind==='bucks'?h-1.2*scale:p.kind==='bottle'?h*.84:h;
 const points:[number,number][]=[[.01,0],[base*.95,.015],[base,.04],[top,bodyH-.025],[top+.012,bodyH]];
 return {points,printMin:.09,handle:p.kind==='mug',lid:p.kind==='bucks'?'bucks':p.kind==='bottle'?'bottle':undefined,fullHeight:h,band:{bottom:.12,top:.91},ridges:p.kind==='disposable'};
}

export function catalogueBody(profile:PrintProfile){
 if(profile.flat){const g=new THREE.BoxGeometry(profile.flat.width,profile.points.at(-1)![1],profile.flat.depth*2);g.translate(0,profile.points.at(-1)![1]/2,0);return g;}
 const outer=profile.points.map(([r,y])=>new THREE.Vector2(r,y));
 const inner=profile.points.slice(1).reverse().map(([r,y])=>new THREE.Vector2(Math.max(.005,r-.012),Math.max(.03,y)));
 const geo=new THREE.LatheGeometry([...outer,...inner,new THREE.Vector2(.005,.03)],128);
 if(profile.ellipse)geo.scale(1,1,profile.ellipse);
 return geo;
}

export function addCatalogueDetails(scene:THREE.Scene,profile:PrintProfile,mat:THREE.MeshPhysicalMaterial){
 const [r,y]=profile.points.at(-1)!;
 const add=(g:THREE.BufferGeometry,m:THREE.Material,x=0,py=0,z=0)=>{const mesh=new THREE.Mesh(g,m);mesh.position.set(x,py,z);mesh.castShadow=true;scene.add(mesh);return mesh;};
 if(profile.lid){
  const cap=new THREE.MeshPhysicalMaterial({color:'#24201e',roughness:.35});
  const dh=(profile.fullHeight??y+.12)-y;
  if(profile.lid==='bucks'){
   add(new THREE.CylinderGeometry(r*1.03,r*1.03,dh*.28,96),cap,0,y+dh*.14);
   add(new THREE.CylinderGeometry(r*.86,r*.98,dh*.72,96),cap,0,y+dh*.64);
   const opening=add(new THREE.CircleGeometry(r*.16,32),new THREE.MeshBasicMaterial({color:'#050505'}),0,y+dh+.001,r*.55);opening.rotation.x=-Math.PI/2;
  }else{
   add(new THREE.CylinderGeometry(r*1.02,r*1.02,dh*.45,96),cap,0,y+dh*.225);
   add(new THREE.CylinderGeometry(r*.24,r*.24,dh*.33,48),cap,-r*.4,y+dh*.61,0);
   const flap=add(new THREE.CylinderGeometry(r*.82,r*.82,dh*.10,96),cap,r*.22,y+dh*.75,0);flap.rotation.z=-.27;
  }
 }
 if(profile.bag){
  for(const z of [-r*.36,r*.36]){
   const shape=new THREE.Shape();shape.moveTo(-r*.64,y*.96);shape.quadraticCurveTo(-r*.5,y*1.34,0,y*1.33);shape.quadraticCurveTo(r*.5,y*1.34,r*.64,y*.96);shape.lineTo(r*.4,y*.98);shape.quadraticCurveTo(r*.31,y*1.18,0,y*1.19);shape.quadraticCurveTo(-r*.31,y*1.18,-r*.4,y*.98);shape.closePath();
   add(new THREE.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.007,bevelThickness:.005,curveSegments:48}),mat,0,0,z);
   const gripCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-r*.24,y*1.275,z),new THREE.Vector3(0,y*1.305,z),new THREE.Vector3(r*.24,y*1.275,z)]);
   add(new THREE.TubeGeometry(gripCurve,32,.035,12,false),new THREE.MeshStandardMaterial({color:'#f7f4e8',roughness:.6}));
  }
 }
 if(profile.ridges){
  for(let i=0;i<6;i++){
   const py=y*(.09+i*.04),rr=profile.points[2][0]+(r-profile.points[2][0])*py/y;
   const ring=add(new THREE.TorusGeometry(rr,.004,6,96),mat,0,py);ring.rotation.x=Math.PI/2;
  }
 }
 if(profile.flat){
  const ring=add(new THREE.TorusGeometry(.045,.007,12,32),new THREE.MeshStandardMaterial({color:'#aab2b8',metalness:.8,roughness:.3}),0,.015);ring.position.y=-.03;
 }
}
