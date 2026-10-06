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


// Crop only the image used by the 3D preview, never the uploaded original.
// Opaque white PDF/page margins are excluded only when nearly all panel edges
// are white. Transparent white ink and non-white backgrounds remain intact.
export function previewArtworkBounds(data:Uint8ClampedArray,width:number,height:number,region:ArtworkRegion={x:0,y:0,width,height}):ArtworkRegion {
 const x0=Math.max(0,Math.floor(region.x)),x1=Math.min(width,Math.ceil(region.x+region.width));
 const y0=Math.max(0,Math.floor(region.y)),y1=Math.min(height,Math.ceil(region.y+region.height));
 if(x1<=x0||y1<=y0)return region;
 const paper=(x:number,y:number)=>{const i=(y*width+x)*4;return data[i+3]>=250&&data[i]>=245&&data[i+1]>=245&&data[i+2]>=245;};
 let paperEdges=0,edgeCount=0;
 for(let x=x0;x<x1;x++){paperEdges+=Number(paper(x,y0))+Number(paper(x,y1-1));edgeCount+=2;}
 for(let y=y0+1;y<y1-1;y++){paperEdges+=Number(paper(x0,y))+Number(paper(x1-1,y));edgeCount+=2;}
 const ignorePaper=paperEdges/Math.max(1,edgeCount)>=.96;
 let left=x1,top=y1,right=-1,bottom=-1;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
  const i=(y*width+x)*4;
  if(data[i+3]===0||(ignorePaper&&paper(x,y)))continue;
  left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
 }
 if(right<left)return region;
 left=Math.max(x0,left-1);right=Math.min(x1-1,right+1);
 top=Math.max(y0,top-1);bottom=Math.min(y1-1,bottom+1);
 return {x:left,y:top,width:right-left+1,height:bottom-top+1};
}
