import assert from 'node:assert/strict';
import {containRect,faceGeometry,printArea} from '../lib/print-layout.ts';
const profile={points:[[.04,.57],[.56,1.05],[.43,1.54]],printMin:.68};
const area=printArea(profile,'TAÇA DE GIN',true);
for(const [w,h] of [[2000,500],[500,2000],[800,800]]){
 const box=containRect(w,h,1200,600,.06);
 assert(Math.abs(box.width/box.height-w/h)<1e-10);
 assert(box.x>=0&&box.y>=0&&box.x+box.width<=1200&&box.y+box.height<=600);
}
const geo=faceGeometry(profile,area),p=geo.attributes.position,uv=geo.attributes.uv;
for(let i=0;i<p.count;i++){
 assert(Number.isFinite(p.getZ(i))&&p.getZ(i)>0);
 assert(Math.abs(p.getX(i)-(uv.getX(i)-.5)*area.width)<1e-6);
 assert(Math.abs(p.getY(i)-(area.bottom+uv.getY(i)*area.height))<1e-6);
}
const original=p.array.slice();geo.rotateY(Math.PI);
for(let i=0;i<p.count;i++){
 assert(Math.abs(p.getX(i)+original[i*3])<1e-6);
 assert(Math.abs(p.getZ(i)+original[i*3+2])<1e-6);
}
geo.dispose();console.log('PASS: landscape, portrait and square art stay proportional and within bounds; front projection is undistorted; rear is exactly opposite.');
