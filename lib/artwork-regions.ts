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
 const prime=model.toUpperCase()==="TAÇA PRIME"&&Math.abs(width/height-150/40)<.015;
 const faceWidth=prime?width*57.16/150:width/2;
 return [{x:0,y:0,width:faceWidth,height},{x:width-faceWidth,y:0,width:faceWidth,height}];
}
