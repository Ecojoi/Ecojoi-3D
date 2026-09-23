export type ArtworkRegion={x:number;y:number;width:number;height:number};

// Keep every nontransparent pixel, including light details and antialiasing.
// This only changes display framing; the uploaded artwork remains untouched.
export function alphaBounds(data:Uint8ClampedArray,width:number,height:number):ArtworkRegion {
 let left=width,top=height,right=-1,bottom=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  if(data[(y*width+x)*4+3]>0){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 }
 if(right<0)return {x:0,y:0,width,height};
 left=Math.max(0,left-1);top=Math.max(0,top-1);
 right=Math.min(width-1,right+1);bottom=Math.min(height-1,bottom+1);
 return {x:left,y:top,width:right-left+1,height:bottom-top+1};
}

export function templateFaces(model:string,width:number,height:number):[ArtworkRegion,ArtworkRegion]{
 // Prime's supplied sheet is 150 x 40 mm, with two 57.16 x 40 mm
 // panels at its outer edges. The central 35.68 mm is not artwork.
 // Other aspect ratios keep the established equal-half convention.
 const prime=["TAÇA PRIME","TAÇA PRIME 170 ML"].includes(model.toUpperCase())&&Math.abs(width/height-150/40)<.015;
 const faceWidth=prime?width*57.16/150:width/2;
 return [{x:0,y:0,width:faceWidth,height},{x:width-faceWidth,y:0,width:faceWidth,height}];
}

// Only split a two-face sheet when the separation is empty and both panels
// contain artwork. A single centered logo must never be sliced in half.
// This is display-only: no pixels or stored product settings are rewritten.
export function canSplitTemplate(model:string,data:Uint8ClampedArray,width:number,height:number):boolean {
 const [front,back]=templateFaces(model,width,height);
 let opaque=0;
 for(let i=3;i<data.length;i+=4)if(data[i]>8)opaque++;
 // On opaque exports, white page paper is not evidence of printed content.
 // On transparent exports, preserve white ink as real artwork.
 const ignorePaper=opaque>=width*height*.98;
 const margin=Math.max(1,Math.round(width*.005));
 const cutLeft=Math.floor(front.width)-margin,cutRight=Math.ceil(back.x)+margin;
 let left=false,right=false;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;
  if(data[i+3]<=8||(ignorePaper&&Math.min(data[i],data[i+1],data[i+2])>=245))continue;
  if(x>=cutLeft&&x<=cutRight)return false;
  if(x<cutLeft)left=true;else right=true;
 }
 return left&&right;
}
