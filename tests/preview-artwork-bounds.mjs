import assert from 'node:assert/strict';
import {previewArtworkBounds} from '../lib/artwork-regions.ts';

const image=(w,h,color=[0,0,0,0])=>{
 const pixels=new Uint8ClampedArray(w*h*4);
 for(let i=0;i<w*h;i++)pixels.set(color,i*4);
 return pixels;
};
const paint=(data,width,x0,y0,x1,y1,color)=>{
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)data.set(color,(y*width+x)*4);
};
const whole={x:0,y:0,width:200,height:100};

// Opaque image from a white PDF page: paper is not part of the logo.
let data=image(200,100,[255,255,255,255]);
paint(data,200,80,30,120,70,[25,25,25,255]);
assert.deepEqual(previewArtworkBounds(data,200,100),{x:79,y:29,width:42,height:42});

// White ink on a transparent PNG must remain printable.
data=image(200,100);
paint(data,200,80,30,120,70,[255,255,255,255]);
assert.deepEqual(previewArtworkBounds(data,200,100),{x:79,y:29,width:42,height:42});

// An intentional dark/colored background is never cropped.
data=image(200,100,[35,20,80,255]);
paint(data,200,80,30,120,70,[255,255,255,255]);
assert.deepEqual(previewArtworkBounds(data,200,100),whole);

// Two separate front/back panels must be measured independently.
// Rendering the back with the front's crop or rectangle distorts its scale.
data=image(200,100,[255,255,255,255]);
paint(data,200,10,20,70,80,[15,15,15,255]);
paint(data,200,130,35,160,65,[15,15,15,255]);
assert.deepEqual(previewArtworkBounds(data,200,100,{x:0,y:0,width:100,height:100}),{x:9,y:19,width:62,height:62});
assert.deepEqual(previewArtworkBounds(data,200,100,{x:100,y:0,width:100,height:100}),{x:129,y:34,width:32,height:32});

// Empty/white files do not cause zero-size regions.
data=image(200,100,[255,255,255,255]);
assert.deepEqual(previewArtworkBounds(data,200,100),whole);
console.log('PASS: preview framing with white margins, transparent white ink, colored backgrounds and independent front/back faces.');
