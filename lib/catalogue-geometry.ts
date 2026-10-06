import * as THREE from 'three';
import {catalogueProduct} from './ecojoi-catalog';
import type {PrintProfile} from './print-layout';

// Physical dimensions (cm) come from the ECOJOI 2026 catalogue.
// Normalized Three.js units preserve the measured height/diameter ratios.
// The silhouette, rim, cap and handle curves are visual reconstructions
// of the catalogue photographs, not a substitute for mould CAD geometry.
export function catalogueProfile(model:string):PrintProfile|undefined{
 const p=catalogueProduct(model.replace(/^COPO DESCARTÁVEL (110|200) ML$/,'COPO DESCARTÁVEL DE PAPEL $1 ML'));
 if(!p)return;
 const unit=1.6/p.height,h=1.6,top=p.mouth*unit/2,base=p.base*unit/2;

 if(p.kind==='strap')
  return {points:[[.016,0],[.016,h]],printMin:.04,flat:{width:.032,depth:.004},band:{bottom:.03,top:.97}};

 if(p.kind==='bag'){
  // Integrated die-cut handle, trapezoid body and flat printed faces.
  const width=p.mouth*unit;
  return {points:[[.01,0],[width*.32,.025],[width*.36,h*.16],[width*.49,h*.72],[width*.38,h*.83],[width*.21,h*.95]],
   printMin:.10,flat:{width:width*.60,depth:.085},bag:true,fullHeight:h,band:{bottom:.12,top:.66}};
 }

 if(p.kind==='gin'||p.kind==='flute'){
  const gin=p.kind==='gin',foot=base,stem=gin?h*.40:h*.36;
  const points:[number,number][]=[
   [.012,0],[foot*.86,.012],[foot,.030],[foot,.045],
   [foot*.37,.069],[.036,.095],[.030,stem-.035],[.041,stem]
  ];
  if(gin){
   points.push([.075,h*.47],[top*.53,h*.52],[top*.97,h*.63],[top*1.18,h*.72],
    [top*1.19,h*.78],[top*1.12,h*.85],[top*1.02,h*.94],[top+.007,h*.994],[top,h]);
   return {points,printMin:h*.58,band:{bottom:.62,top:.95}};
  }
  points.push([.069,h*.42],[top*.49,h*.54],[top*.73,h*.66],[top*.92,h*.82],
   [top*.99,h*.955],[top+.006,h*.994],[top,h]);
  return {points,printMin:h*.56,band:{bottom:.64,top:.94}};
 }

 if(p.kind==='bottle'){
  // Ecobio is a nearly straight cylindrical bottle with rounded bottom.
  // The 7 cm top dimension is the flip-top cap, not the diameter of the body.
  const body=base*1.006,shoulder=h*.846;
  const points:[number,number][]=[
   [.012,0],[base*.89,.010],[base,.045],[body,.085],
   [body,h*.40],[body,shoulder-.085],[body*.994,shoulder-.028],[body*.962,shoulder]
  ];
  return {points,printMin:.09,lid:'bottle',fullHeight:h,band:{bottom:.13,top:.91}};
 }

 if(p.kind==='mug'){
  // Chopp: parallel walls, wide reinforced foot, lip and rectangular handle.
  const points:[number,number][]=[
   [.012,0],[base*.91,.014],[base,.044],[base*.998,.07],
   [base*.997,h*.40],[top*.996,h*.94],
   [top+.007,h*.980],[top+.011,h*.987],[top,h]
  ];
  return {points,printMin:.09,handle:true,band:{bottom:.12,top:.92}};
 }

 const bodyH=p.kind==='bucks'?h-1.2*unit:h;
 const isDisposable=p.kind==='disposable',isPaper=p.kind==='paper';
 const points:[number,number][]=[
  [.012,0],[base*.91,.015],[base,.045],[base*.997,.069],
  [base+(top-base)*.20,bodyH*.23],
  [base+(top-base)*.57,bodyH*.60],
  [top*.995,bodyH-.055],
  [top,bodyH-.020],[top+.009,bodyH-.016],
  [top+.010,bodyH-.006],[top,bodyH]
 ];
 // Reusable ECO models have gently flared, smooth walls. Clear disposable
 // cups have a slightly stronger rolled lip and reinforced stacking foot.
 if(isDisposable){points[8][0]=top+.013;points[9][0]=top+.013;}
 if(isPaper){points[8][0]=top+.010;points[9][0]=top+.011;}
 const twist=p.model.startsWith('COPO TWISTER')||p.model.startsWith('COPO VISUAL DRINK');
 return {points,printMin:.09,handle:false,lid:p.kind==='bucks'?'bucks':undefined,
  fullHeight:h,lidRadius:p.kind==='bucks'?3.9*unit:undefined,
  band:{bottom:.12,top:.91},ridges:isDisposable,twist};
}

export function catalogueBody(profile:PrintProfile){
 if(profile.bag){
  // Make a solid flat-sided shopping bag with a REAL opening instead of
  // the previous round lathed vessel with decorative fake handles.
  const h=profile.points.at(-1)![1]/.95;
  const w=profile.points[3][0]/.49*2;
  const shape=new THREE.Shape();
  shape.moveTo(-w*.34,0);
  shape.quadraticCurveTo(0,-.035,w*.34,0);
  shape.quadraticCurveTo(w*.38,h*.14,w*.44,h*.40);
  shape.lineTo(w*.49,h*.72);
  shape.quadraticCurveTo(w*.48,h*.78,w*.37,h*.83);
  shape.quadraticCurveTo(w*.29,h*.95,w*.20,h*.965);
  shape.quadraticCurveTo(0,h*.992,-w*.20,h*.965);
  shape.quadraticCurveTo(-w*.29,h*.95,-w*.37,h*.83);
  shape.quadraticCurveTo(-w*.48,h*.78,-w*.49,h*.72);
  shape.lineTo(-w*.44,h*.40);
  shape.quadraticCurveTo(-w*.38,h*.14,-w*.34,0);
  const hole=new THREE.Path();
  hole.absellipse(0,h*.855,w*.16,h*.061,0,Math.PI*2,true);
  shape.holes.push(hole);
  const depth=(profile.flat?.depth??.085)*2;
  const geometry=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSegments:2,bevelThickness:.012,bevelSize:.012,curveSegments:36});
  geometry.translate(0,0,-depth/2);
  return geometry;
 }
 if(profile.flat){
  const g=new THREE.BoxGeometry(profile.flat.width,profile.points.at(-1)![1],profile.flat.depth*2);
  g.translate(0,profile.points.at(-1)![1]/2,0);
  return g;
 }
 const outer=profile.points.map(([r,y])=>new THREE.Vector2(r,y));
 const inner=profile.points.slice(1).reverse().map(([r,y])=>new THREE.Vector2(Math.max(.005,r-.013),Math.max(.025,y)));
 return new THREE.LatheGeometry([...outer,...inner,new THREE.Vector2(.005,.025)],160);
}

export function addCatalogueDetails(scene:THREE.Scene,profile:PrintProfile,mat:THREE.MeshPhysicalMaterial){
 const [r,y]=profile.points.at(-1)!;
 const add=(g:THREE.BufferGeometry,m:THREE.Material,x=0,py=0,z=0)=>{
  const mesh=new THREE.Mesh(g,m);mesh.position.set(x,py,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh;
 };
 if(profile.lid){
  const cap=new THREE.MeshPhysicalMaterial({color:'#242424',roughness:.56,metalness:0});
  const dark=new THREE.MeshStandardMaterial({color:'#0e0e0f',roughness:.9});
  const total=(profile.fullHeight??y+.25)-y;
  if(profile.lid==='bucks'){
   const R=profile.lidRadius??r*1.02;
   add(new THREE.CylinderGeometry(R,R*.99,total*.28,96),cap,0,y+total*.14);
   add(new THREE.CylinderGeometry(R*.87,R*.95,total*.62,96),cap,0,y+total*.56);
   add(new THREE.CylinderGeometry(R*.80,R*.84,total*.08,96),cap,0,y+total*.91);
   const sip=add(new THREE.CircleGeometry(R*.12,40),dark,0,y+total*.954,R*.48);
   sip.rotation.x=-Math.PI/2;
  }else{
   // Ecobio: wide black horizontal cap, raised drinking nozzle and
   // hinged flip-cover photographed open in the company catalogue.
   const R=(profile.lidRadius??r*1.16);
   add(new THREE.CylinderGeometry(R*.99,R,total*.43,96),cap,0,y+total*.22);
   add(new THREE.CylinderGeometry(R*.96,R*.99,total*.12,96),cap,0,y+total*.48);
   const neckX=-R*.40;
   add(new THREE.CylinderGeometry(R*.23,R*.24,total*.56,64),cap,neckX,y+total*.79);
   const drink=add(new THREE.CircleGeometry(R*.17,48),dark,neckX,y+total*1.09);
   drink.rotation.x=-Math.PI/2;
   // The open lid is an elongated rounded cover connected to the rear hinge.
   const hingeX=R*.67,hingeY=y+total*.57;
   add(new THREE.SphereGeometry(R*.16,24,16),cap,hingeX,hingeY,0);
   const flip=add(new THREE.CapsuleGeometry(R*.30,total*1.27,8,24),cap,hingeX+total*.43,hingeY+total*.73,0);
   flip.rotation.z=-.48;
   add(new THREE.SphereGeometry(R*.10,16,12),cap,R*.96,y+total*.22,0);
  }
 }
 if(profile.handle){
  // A squared-off open handle (PS Cristal / Chopp), not the generic arc.
  const outer=new THREE.Shape();
  outer.moveTo(r*.91,y*.24);
  outer.bezierCurveTo(r*1.12,y*.23,r*1.17,y*.19,r*1.34,y*.19);
  outer.bezierCurveTo(r*1.72,y*.18,r*1.79,y*.27,r*1.80,y*.37);
  outer.lineTo(r*1.80,y*.77);
  outer.bezierCurveTo(r*1.79,y*.90,r*1.66,y*.90,r*1.41,y*.88);
  outer.bezierCurveTo(r*1.21,y*.85,r*1.13,y*.82,r*.91,y*.84);
  outer.lineTo(r*.91,y*.24);
  const opening=new THREE.Path();
  opening.moveTo(r*1.14,y*.34);
  opening.bezierCurveTo(r*1.25,y*.30,r*1.43,y*.30,r*1.57,y*.31);
  opening.bezierCurveTo(r*1.65,y*.32,r*1.67,y*.38,r*1.67,y*.43);
  opening.lineTo(r*1.67,y*.70);
  opening.bezierCurveTo(r*1.65,y*.79,r*1.54,y*.78,r*1.41,y*.77);
  opening.bezierCurveTo(r*1.29,y*.75,r*1.20,y*.74,r*1.14,y*.75);
  opening.lineTo(r*1.14,y*.34);
  outer.holes.push(opening);
  const depth=.10;
  const g=new THREE.ExtrudeGeometry(outer,{depth,bevelEnabled:true,bevelSize:.011,bevelThickness:.01,bevelSegments:3,curveSegments:20});
  g.translate(0,0,-depth/2);
  add(g,mat);
 }
 if(profile.bag){
  // Reinforced handle inset on each side of the die-cut opening.
  const h=profile.points.at(-1)![1]/.95,w=profile.points[3][0]/.49*2;
  const opening=new THREE.EllipseCurve(0,h*.855,w*.16,h*.061,0,2*Math.PI,false,0);
  const points=opening.getPoints(96).map(v=>new THREE.Vector3(v.x,v.y,0));
  const ring=new THREE.CatmullRomCurve3(points,true);
  const insert=new THREE.MeshStandardMaterial({color:'#e5e6df',roughness:.62});
  const inset=new THREE.TubeGeometry(ring,128,.021,8,true);
  add(inset,insert,0,0,(profile.flat?.depth??.085)+.014);
  add(inset.clone(),insert,0,0,-(profile.flat?.depth??.085)-.014);
 }
 if(profile.ridges){
  const bottomR=profile.points[2][0];
  for(const py of [y*.042,y*.074]){
   const rr=bottomR+(r-bottomR)*py/y;
   const ring=add(new THREE.TorusGeometry(rr,.006,8,96),mat,0,py);
   ring.rotation.x=Math.PI/2;
  }
 }
 if(profile.flat&&!profile.bag){
  const ring=add(new THREE.TorusGeometry(.045,.007,12,32),
   new THREE.MeshStandardMaterial({color:'#aab2b8',metalness:.8,roughness:.3}),0,.015);
  ring.rotation.x=Math.PI/2;
  ring.position.y=-.03;
 }
}
