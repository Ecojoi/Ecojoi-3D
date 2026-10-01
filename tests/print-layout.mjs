import assert from 'node:assert/strict';
import {containRect,faceGeometry,printArea,templateFor} from '../lib/print-layout.ts';

const expectedTemplates=[
 ['GARRAFA ECOBIO 500 ML','SILK',190,145],
 ['GARRAFA ECOBIO 500 ML','DIGITAL 360',190,145],
 ['COPO ECO 450 ML','SILK',200,125],
 ['COPO ECO 600 ML','SILK',222,132],
 ['COPO ECO 250 ML','SILK',215,65],
 ['COPO ECO 450 ML','DIGITAL 360',223.818,152.58],
 ['COPO ECO 600 ML','DIGITAL 360',251.446,162.749],
 ['COPO VISUAL DRINK 500 ML','SILK',212,132],
 ['COPO LONG DRINK 330 ML','SILK',180,125],
 ['CANECA CHOPP 500 ML','SILK',180,98.862],
 ['TAÇA GIN 550 ML','SILK',308,38],
 ['TAÇA PRIME 170 ML','SILK',150,40],
 ['COPO DESCARTÁVEL 200 ML','SILK FRENTE',200,80],
];
for(const [model,process,widthMm,heightMm] of expectedTemplates){
 const rule=templateFor(model,process);
 assert(rule,`Gabarito ausente: ${model} / ${process}`);
 assert.equal(rule.widthMm,widthMm,`Largura incorreta: ${model} / ${process}`);
 assert.equal(rule.heightMm,heightMm,`Altura incorreta: ${model} / ${process}`);
}

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
geo.dispose();console.log('PASS: production template dimensions, artwork proportions and front/back projections are valid.');
