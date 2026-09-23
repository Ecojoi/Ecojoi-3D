import assert from 'node:assert/strict';
import {alphaBounds,templateFaces,canSplitTemplate} from '../lib/artwork-regions.ts';
import {containRect} from '../lib/print-layout.ts';
const pixels=new Uint8ClampedArray(100*100*4);
for(let y=30;y<70;y++)for(let x=40;x<60;x++)pixels[(y*100+x)*4+3]=255;
const crop=alphaBounds(pixels,100,100);
assert.deepEqual(crop,{x:39,y:29,width:22,height:42});
const full=containRect(100,100,200,200),fit=containRect(crop.width,crop.height,200,200);
assert(fit.height/crop.height>full.height/100,'Visible logo must enlarge');
assert(Math.abs(fit.width/fit.height-22/42)<1e-12,'Do not stretch artwork');
pixels[3]=1;
assert.equal(alphaBounds(pixels,100,100).x,0,'Preserve even faint edge detail');
assert.equal(alphaBounds(pixels,100,100).y,0);
assert.deepEqual(alphaBounds(new Uint8ClampedArray(16),2,2),{x:0,y:0,width:2,height:2});
assert.deepEqual(alphaBounds(new Uint8ClampedArray(16).fill(255),2,2),{x:0,y:0,width:2,height:2});
const [front,back]=templateFaces('Taça Prime',1500,400);
assert(Math.abs(front.width-571.6)<1e-9);
assert(Math.abs(back.x-928.4)<1e-9);
assert.equal(front.width,back.width);
assert.equal(back.x+back.width,1500);
assert.equal(front.height,400);
assert.deepEqual(templateFaces('TAÇA DE GIN',1500,400),[{x:0,y:0,width:750,height:400},{x:750,y:0,width:750,height:400}]);
assert.equal(templateFaces('TAÇA PRIME',1000,400)[0].width,500,'Legacy sheet convention preserved');
assert.equal(templateFaces('TAÇA PRIME',1501,400)[0].width,1501*57.16/150,'Allow export rounding');
console.log('PASS artwork framing: transparency, faint details, empty/opaque files, proportions, Prime panels and legacy sheets.');

const sheet=(w,h,opaque=false)=>{const d=new Uint8ClampedArray(w*h*4);if(opaque)d.fill(255);return d;};
const ink=(d,w,x0,y0,x1,y1,color=[30,30,30,255])=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)d.set(color,(y*w+x)*4);};
for(const model of ['TAÇA GIN 550 ML','COPO ECO 450 ML','TAÇA PRIME 170 ML','CANECA CHOPP 500 ML']){
 for(const opaque of [false,true]){
  const single=sheet(200,100,opaque);ink(single,200,60,20,140,80);
  assert.equal(canSplitTemplate(model,single,200,100),false,'Never bisect a centered logo');
  const separate=sheet(200,100,opaque);ink(separate,200,10,20,70,80);ink(separate,200,130,20,190,80);
  assert.equal(canSplitTemplate(model,separate,200,100),true,'Preserve real front/back panels');
  const oneSide=sheet(200,100,opaque);ink(oneSide,200,10,20,70,80);
  assert.equal(canSplitTemplate(model,oneSide,200,100),false,'Repeat one-sided logo in full');
 }
}
const white=sheet(200,100);ink(white,200,60,20,140,80,[255,255,255,255]);assert.equal(canSplitTemplate('COPO ECO 250 ML',white,200,100),false,'White ink crossing the seam is still real artwork');
const prime=sheet(1500,400);ink(prime,1500,20,20,550,380);ink(prime,1500,950,20,1480,380);assert(canSplitTemplate('TAÇA PRIME 170 ML',prime,1500,400));ink(prime,1500,740,50,760,350);assert(!canSplitTemplate('TAÇA PRIME 170 ML',prime,1500,400),'Do not discard artwork in Prime central gap');
console.log('PASS safe front/back separation: centered/single-sided logos, transparent/opaque sheets, white ink and Prime gap.');
