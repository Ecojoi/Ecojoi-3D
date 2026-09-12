import * as THREE from "three";

export type PrintProfile = {points:[number,number][];printMin:number;twist?:boolean};

export function radiusAt(profile:PrintProfile,y:number){
 for(let i=1;i<profile.points.length;i++){
  const [r1,y1]=profile.points[i-1], [r2,y2]=profile.points[i];
  if(y<=y2)return r1+(r2-r1)*(y-y1)/Math.max(.00001,y2-y1);
 }
 return profile.points.at(-1)![0];
}

// Production measurements supplied in GABARITO describe only the 450 ml cup.
// Other models retain normalized visual areas until their own templates exist.
export const CUP_450_TEMPLATE={width:235.8,height:138.5,top:3,bottom:3.5,seam:1.5};

export function printArea(profile:PrintProfile,model:string,faces:boolean){
 const height=profile.points.at(-1)![1];
 const gin=model.toUpperCase().includes("GIN");
 const bottom=gin?height*.62:profile.printMin+(height-profile.printMin)*.07;
 const top=gin?height*.89:height*.93;
 const minRadius=Math.min(...Array.from({length:65},(_,i)=>radiusAt(profile,bottom+(top-bottom)*i/64)));
 const radius=radiusAt(profile,(top+bottom)/2);
 return {bottom,top,width:faces?minRadius*1.4:2*Math.PI*radius,height:top-bottom};
}

export function containRect(imageWidth:number,imageHeight:number,width:number,height:number,padding=0){
 const scale=Math.min(width*(1-2*padding)/imageWidth,height*(1-2*padding)/imageHeight);
 const w=imageWidth*scale,h=imageHeight*scale;
 return {x:(width-w)/2,y:(height-h)/2,width:w,height:h};
}

// Front projection keeps the logo's aspect ratio legible from its corresponding
// face. The back uses the same mesh rotated 180 degrees, never a mirrored UV.
export function faceGeometry(profile:PrintProfile,area:ReturnType<typeof printArea>){
 const geo=new THREE.PlaneGeometry(area.width,area.height,64,64);
 const pos=geo.attributes.position;
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),y=pos.getY(i)+(area.bottom+area.top)/2;
  const r=radiusAt(profile,y)+.003;
  let z=Math.sqrt(Math.max(0,r*r-x*x)),px=x;
  if(profile.twist){const s=1+.03*Math.sin(Math.atan2(z,x)*12+y*2);px*=s;z*=s;}
  pos.setXYZ(i,px,y,z);
 }
 geo.computeVertexNormals();return geo;
}

export function wrapGeometry(profile:PrintProfile,area:ReturnType<typeof printArea>){
 const points=Array.from({length:129},(_,i)=>{
  const y=area.bottom+(area.top-area.bottom)*i/128;
  return new THREE.Vector2(radiusAt(profile,y)+.003,y);
 });
 // The middle of the uploaded sheet faces the initial camera. Seam stays behind.
 const geo=new THREE.LatheGeometry(points,192,Math.PI,Math.PI*2);
 const pos=geo.attributes.position;
 if(profile.twist){for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),z=pos.getZ(i),y=pos.getY(i),s=1+.03*Math.sin(Math.atan2(z,x)*12+y*2);
  pos.setXYZ(i,x*s,y,z*s);
 }geo.computeVertexNormals();}
 return geo;
}
