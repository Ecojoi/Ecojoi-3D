import * as THREE from "three";

export type PrintProfile = {points:[number,number][];printMin:number;twist?:boolean;handle?:boolean;band?:{bottom:number;top:number};flat?:{width:number;depth:number};ellipse?:number;bag?:boolean;lid?:"bucks"|"bottle";fullHeight?:number;lidRadius?:number;ridges?:boolean};

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

// Rectangular reference contours measured from the supplied PDFs (1:1).
// Process mapping confirmed by ECOJOI: rectangular = Silk, USIJET = Digital 360.
type Point=[number,number];
type Curve=[Point,Point,Point,Point];
type CurvedSheet={page:Point;top:Curve[];bottom:Curve[]};
export type ProductTemplate={source:string;widthMm:number;heightMm:number;productHeightMm:number;faceWidthMm?:number;sheet?:CurvedSheet};
// Inner cut contours, PDF points, origin at page top left. Bleed is excluded.
const USIJET_450:CurvedSheet={page:[715.3888,499.7754],top:[
 [[17.82,90.3837],[36.5216,85.7102],[55.1908,81.166],[74.0143,77.7542]],
 [[74.0143,77.7542],[119.3754,69.5326],[164.8647,63.5818],[210.348,59.2031]],
 [[210.348,59.2031],[287.242,51.8008],[362.3769,48.9154],[439.5339,54.1138]],
 [[439.5339,54.1138],[452.9313,55.0164],[466.34,55.9626],[479.7479,57.1262]],
 [[479.7479,57.1262],[551.8327,63.3831],[623.929,72.8432],[695.1504,90.2621]]
 ],bottom:[
 [[108.2605,484.1826],[137.4814,478.9572],[166.5816,474.6947],[195.3882,470.0507]],
 [[195.3882,470.0507],[222.4981,465.68],[249.4998,462.1727],[276.4477,459.7111]],
 [[276.4477,459.7111],[303.173,457.2699],[329.8459,455.6244],[356.5225,455.6485]],
 [[356.5225,455.6485],[381.526,455.6711],[406.4128,456.7786],[431.2431,458.7975]],
 [[431.2431,458.7975],[459.2514,461.0745],[487.1883,464.5116],[515.1404,468.8588]],
 [[515.1404,468.8588],[544.8203,473.4744],[574.7443,478.346],[604.8417,484.135]]
 ]};
const USIJET_600:CurvedSheet={page:[793.5,550.3611],top:[
 [[21.8007,112.685],[117.3591,87.574],[276.4261,70.0641],[395.805,70.0176]],
 [[395.805,70.0176],[514.6268,70.0633],[672.7552,87.3849],[768.4537,112.3069]]
 ],bottom:[
 [[118.9165,531.8951],[191.7485,513.7636],[308.0358,501.2168],[395.805,501.1735]],
 [[395.805,501.1735],[485.5283,501.2225],[604.9417,515.6202],[677.4863,533.1548]]
 ]};
function sampleCurves(curves:Curve[]){
 const points:Point[]=[];
 for(const [a,b,c,d] of curves)for(let i=0;i<=32;i++){const t=i/32,s=1-t;points.push([s*s*s*a[0]+3*s*s*t*b[0]+3*s*t*t*c[0]+t*t*t*d[0],s*s*s*a[1]+3*s*s*t*b[1]+3*s*t*t*c[1]+t*t*t*d[1]]);}
 const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
 return {points,lengths,length:lengths.at(-1)!};
}
function pointAlong(samples:ReturnType<typeof sampleCurves>,u:number):Point{
 const distance=Math.max(0,Math.min(1,u))*samples.length;
 for(let i=1;i<samples.points.length;i++)if(samples.lengths[i]>=distance){const t=(distance-samples.lengths[i-1])/Math.max(1e-9,samples.lengths[i]-samples.lengths[i-1]),a=samples.points[i-1],b=samples.points[i];return [a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];}
 return samples.points.at(-1)!;
}
function digitalTemplate(model:string):ProductTemplate|undefined{
 const sheet=model==='COPO ECO 600 ML'?USIJET_600:['COPO ECO 450 ML','COPO ECO 450 ML COM TAMPA BUCKS'].includes(model)?USIJET_450:undefined;
 if(!sheet)return;
 const a=sampleCurves(sheet.top),b=sampleCurves(sheet.bottom),top=pointAlong(a,.5),bottom=pointAlong(b,.5);
 return {source:sheet===USIJET_450?'FACA 450 USIJET.pdf':'FACA 600 USIJET.pdf',sheet,widthMm:(a.length+b.length)/2*25.4/72,heightMm:Math.hypot(top[0]-bottom[0],top[1]-bottom[1])*25.4/72,productHeightMm:model.includes('BUCKS')?157:sheet===USIJET_450?145:154};
}
export function matchesSheet(rule:ProductTemplate,w:number,h:number){return !!rule.sheet&&Math.abs((w/h)/(rule.sheet.page[0]/rule.sheet.page[1])-1)<.005;}
export function applySheetUV(geometry:THREE.BufferGeometry,rule:ProductTemplate){
 if(!rule.sheet)return;
 const {sheet}=rule,top=sampleCurves(sheet.top),bottom=sampleCurves(sheet.bottom),uv=geometry.attributes.uv;
 for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i),a=pointAlong(top,u),b=pointAlong(bottom,u);uv.setXY(i,(a[0]*v+b[0]*(1-v))/sheet.page[0],1-(a[1]*v+b[1]*(1-v))/sheet.page[1]);}
 uv.needsUpdate=true;
}
const TEMPLATES:Record<string,ProductTemplate>={
 "COPO ECO 250 ML":{source:"Copo Eco 250ml.pdf",widthMm:205,heightMm:65,productHeightMm:83},
 "COPO ECO 250 ML COM TAMPA BUCKS":{source:"Copo Eco 250ml.pdf",widthMm:205,heightMm:65,productHeightMm:95},
 "COPO ECO 450 ML":{source:"Planilha GABARITO 450 ml",widthMm:234.3,heightMm:132,productHeightMm:145},
 "COPO ECO 450 ML COM TAMPA BUCKS":{source:"Planilha GABARITO 450 ml",widthMm:234.3,heightMm:132,productHeightMm:157},
 "COPO ECO 600 ML":{source:"Gabarito Eco 600ml.pdf",widthMm:222,heightMm:132,productHeightMm:154},
 "TAÇA GIN 550 ML":{source:"Gabarito taça gin.pdf",widthMm:308,heightMm:35,productHeightMm:200},
 "COPO LONG DRINK 330 ML":{source:"Long Drink.pdf",widthMm:170,heightMm:125,productHeightMm:150},
 "TAÇA PRIME 170 ML":{source:"Taça Prime Gabarito.pdf",widthMm:150,heightMm:40,faceWidthMm:57.16,productHeightMm:216.5},
};
export function templateFor(model:string,process?:string):ProductTemplate|undefined {
 if(process==='DIGITAL 360')return digitalTemplate(model.toUpperCase());
 if(!process||!['SILK','SILK FRENTE','SILK FRENTE E VERSO','SILK 360'].includes(process))return;
 return TEMPLATES[model.toUpperCase()];
}

// Individually reviewed safe bands on the existing normalized models, not mm.
// Keep bottle shoulders, stems, feet, rims and handle attachments unprinted.
export const MODEL_PRINT_BANDS:Record<string,{bottom:number;top:number}>={
 "COPO ECOLOGIC 300 ML":{bottom:.14,top:.91},
 "COPO ECOLOGIC 400 ML":{bottom:.13,top:.92},
 "COPO ECOLOGIC 500 ML":{bottom:.12,top:.92},
 "COPO ECOLOGIC 600 ML":{bottom:.11,top:.92},
 "COPO WHISKY":{bottom:.17,top:.89},
 "GARRAFA WATER BIO":{bottom:.10,top:.68},
 "LONG DRINK":{bottom:.12,top:.92},
 "SHOT":{bottom:.19,top:.88},
 "TAÇA DE GIN":{bottom:.62,top:.89},
 "TAÇA DE VINHO 400 ML":{bottom:.56,top:.87},
 "TAÇA PREMIUM 2.0":{bottom:.56,top:.88},
 "TAÇA PRIME":{bottom:.56,top:.88},
 "TULIPA":{bottom:.38,top:.90},
 "TWISTER 600 ML":{bottom:.12,top:.91},
 "USUAL DRINK 400 ML":{bottom:.14,top:.91},
 "BALDE ECOLOGIC 5 L":{bottom:.16,top:.88},
 "CANECA DE CHOPP 300 ML":{bottom:.17,top:.88},
 "CANECA DE CHOPP 500 ML":{bottom:.15,top:.89},
};

export function printArea(profile:PrintProfile,model:string,faces:boolean,process?:string){
 const height=profile.points.at(-1)![1];
 const band=profile.band??MODEL_PRINT_BANDS[model.toUpperCase()];
 let bottom=band?height*band.bottom:profile.printMin+(height-profile.printMin)*.07;
 let top=height*(band?.top??.93);
 const template=templateFor(model,process);
 const unitsPerMm=template?(profile.fullHeight??height)/template.productHeightMm:0;
 if(template){
  // Center on the existing printable body, constrained by rim/stem geometry.
  // PDF contours give dimensions, not a measured vertical registration point.
  const maxTop=height-.025,safeHeight=Math.min(template.heightMm*unitsPerMm,maxTop-profile.printMin);
  bottom=Math.max(profile.printMin,Math.min((top+bottom-safeHeight)/2,maxTop-safeHeight));
  top=bottom+safeHeight;
 }
 const minRadius=Math.min(...Array.from({length:65},(_,i)=>radiusAt(profile,bottom+(top-bottom)*i/64)));
 const radius=radiusAt(profile,(top+bottom)/2);
 let gap=profile.handle?.72:.06;
 let sweep=2*Math.PI-gap;
 if(template&&!faces&&!template.sheet){sweep=Math.min(sweep,template.widthMm*unitsPerMm/radius);gap=2*Math.PI-sweep;}
 const start=profile.handle?Math.PI/2+gap/2:Math.PI+gap/2;
 const faceWidth=template?Math.min(minRadius*1.9,(template.faceWidthMm??template.widthMm/2)*unitsPerMm):minRadius*1.9;
 return {bottom,top,width:profile.flat?profile.flat.width:faces?faceWidth:sweep*radius,height:top-bottom,start,sweep};
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
  let z=profile.flat?profile.flat.depth+.002:Math.sqrt(Math.max(0,r*r-x*x))*(profile.ellipse??1),px=x;
  if(profile.twist){const s=1+.03*Math.sin(Math.atan2(z,x)*12+y*2);px*=s;z*=s;}
  pos.setXYZ(i,px,y,z);
 }
 geo.computeVertexNormals();return geo;
}

export function wrapGeometry(profile:PrintProfile,area:ReturnType<typeof printArea>){
 if(profile.flat)return faceGeometry(profile,area);
 const points=Array.from({length:129},(_,i)=>{
  const y=area.bottom+(area.top-area.bottom)*i/128;
  return new THREE.Vector2(radiusAt(profile,y)+.003,y);
 });
 // The middle of the uploaded sheet faces the initial camera. Seam stays behind.
 const geo=new THREE.LatheGeometry(points,192,area.start,area.sweep);
 if(profile.ellipse)geo.scale(1,1,profile.ellipse);
 const pos=geo.attributes.position;
 if(profile.twist){for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),z=pos.getZ(i),y=pos.getY(i),s=1+.03*Math.sin(Math.atan2(z,x)*12+y*2);
  pos.setXYZ(i,x*s,y,z*s);
 }geo.computeVertexNormals();}
 return geo;
}
