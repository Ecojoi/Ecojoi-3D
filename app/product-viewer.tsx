"use client";
import {useEffect,useRef,useState} from "react";
import {Maximize,Minimize,RotateCcw,Rotate3D} from "lucide-react";
import {Button} from "@/components/ui/button";
import {COLORS,type Product} from "@/lib/catalog";
import * as THREE from "three";
import {printArea,containRect,faceGeometry,wrapGeometry} from "@/lib/print-layout";
import {alphaBounds,templateFaces} from "@/lib/artwork-regions";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {RoomEnvironment} from "three/addons/environments/RoomEnvironment.js";

type Profile={points:[number,number][];printMin:number;handle?:boolean;twist?:boolean;visualHeight?:number;lid?:"bucks"|"ecobio";disposable?:boolean};
// Perfis visuais derivados das proporções e medidas publicadas no Catálogo ECOJOI 2026.
// Os descartáveis 330/440/550/770 não têm cotas completas no catálogo; nesses quatro,
// a progressão dimensional é apenas visual até a produção fornecer as medidas.
export function modelProfile(name:string):Profile { name=name.toUpperCase();
 const cup=(bottomRadius:number,topRadius:number,height:number,extra:Partial<Profile>={}):Profile=>({points:[[.02,0],[Math.max(.02,bottomRadius-.025),.018],[bottomRadius,.055],[bottomRadius+.01,height*.12],[topRadius-.025,height*.84],[topRadius,height*.97],[topRadius+.006,height]],printMin:height*.08,...extra});
 switch(name){
  case "COPO ECO 250 ML COM TAMPA BUCKS":return cup(.30,.38,.83,{visualHeight:.95,lid:"bucks"});
  case "COPO ECO 250 ML":return cup(.30,.38,.83);
  case "COPO ECO 450 ML COM TAMPA BUCKS":return cup(.27,.38,1.45,{visualHeight:1.57,lid:"bucks"});
  case "COPO ECO 450 ML":return cup(.27,.38,1.45);
  case "COPO ECO 600 ML":return cup(.315,.42,1.54);
  case "GARRAFA ECOBIO 500 ML":return {points:[[.02,0],[.285,.02],[.30,.06],[.30,.18],[.305,1.62],[.31,1.74]],printMin:.12,visualHeight:2,lid:"ecobio"};
  case "COPO LONG DRINK 330 ML":return cup(.315,.325,1.08);
  case "CANECA CHOPP 500 ML":return {points:[[.02,0],[.39,.018],[.42,.07],[.43,1.03],[.435,1.08]],printMin:.12,handle:true};
  case "COPO TWISTER 500 ML":return cup(.315,.45,1.46);
  case "COPO VISUAL DRINK 500 ML":return {points:[[.02,0],[.305,.018],[.315,.06],[.34,.35],[.405,1.12],[.45,1.43],[.452,1.46]],printMin:.12};
  case "COPO DESCARTÁVEL 110 ML":return cup(.23,.31,.60,{disposable:true});
  case "COPO DESCARTÁVEL 200 ML":return cup(.25,.365,.78,{disposable:true});
  case "COPO DESCARTÁVEL 330 ML":return cup(.285,.395,.95,{disposable:true});
  case "COPO DESCARTÁVEL 440 ML":return cup(.30,.425,1.08,{disposable:true});
  case "COPO DESCARTÁVEL 550 ML":return cup(.315,.455,1.22,{disposable:true});
  case "COPO DESCARTÁVEL 770 ML":return cup(.34,.49,1.40,{disposable:true});
  case "TAÇA GIN 550 ML":{
   const lower=new THREE.CubicBezierCurve(new THREE.Vector2(.055,.62),new THREE.Vector2(.08,.78),new THREE.Vector2(.50,.88),new THREE.Vector2(.50,1.28));
   const upper=new THREE.CubicBezierCurve(new THREE.Vector2(.50,1.28),new THREE.Vector2(.50,1.58),new THREE.Vector2(.48,1.82),new THREE.Vector2(.50,2.0));
   const bowl=[...lower.getPoints(64),...upper.getPoints(64).slice(1)].map(p=>[p.x,p.y] as [number,number]);
   return {points:[[.02,0],[.34,.02],[.36,.045],[.32,.075],[.055,.10],[.05,.58],...bowl],printMin:.78};
  }
  case "TAÇA PRIME 170 ML":{
   const bowl=new THREE.CubicBezierCurve(new THREE.Vector2(.065,.92),new THREE.Vector2(.16,1.02),new THREE.Vector2(.27,1.55),new THREE.Vector2(.29,2.165)).getPoints(96).map(p=>[p.x,p.y] as [number,number]);
   return {points:[[.02,0],[.30,.02],[.32,.045],[.28,.075],[.045,.10],[.045,.86],...bowl],printMin:1.08};
  }
 }
 // Compatibilidade visual para designs antigos já salvos antes do catálogo 2026.
 if(name.includes("TAÇA")||name==="TULIPA"){
  const gin=name.includes("GIN");
  return {points:[[.02,0],[.39,.02],[.41,.045],[.37,.07],[.045,.09],[.04,.57],[.09,.61],[.23,.66],[gin?.48:.36,.82],[gin?.56:.45,1.05],[gin?.54:.44,1.27],[.43,1.54]],printMin:.68};
 }
 if(name.includes("BALDE"))return {points:[[.02,0],[.62,.02],[.65,.08],[.84,1.2],[.87,1.23],[.86,1.26]],printMin:.1};
 if(name.includes("GARRAFA"))return {points:[[.02,0],[.3,.025],[.34,.07],[.35,1.25],[.32,1.4],[.17,1.57],[.16,1.8],[.18,1.81]],printMin:.08};
 if(name.includes("CANECA"))return {points:[[.02,0],[.34,.015],[.38,.08],[.39,1.3],[.41,1.33]],printMin:.09,handle:true};
 if(name==="SHOT")return {points:[[.02,0],[.23,.015],[.24,.08],[.3,.66],[.315,.68]],printMin:.08};
 if(name.includes("WHISKY"))return {points:[[.02,0],[.39,.02],[.4,.09],[.43,.85],[.445,.88]],printMin:.08};
 const h=name.includes("300")?1.12:name.includes("600")?1.72:name.includes("500")?1.55:name.includes("LONG DRINK")?1.65:1.35;
 return {points:[[.02,0],[.28,.018],[.3,.04],[.305,.1],[.34,h*.4],[.39,h*.82],[.405,h-.03],[.42,h],[.415,h+.025]],printMin:.09,twist:name.includes("TWISTER")};
}
export default function ProductViewer({product,token}:{product:Product;token?:string}){
 const host=useRef<HTMLDivElement>(null),wrapper=useRef<HTMLDivElement>(null),reset=useRef<()=>void>(()=>{});const [error,setError]=useState(""),[full,setFull]=useState(false),[loading,setLoading]=useState(true);
 useEffect(()=>{const el=host.current;if(!el)return;let disposed=false,renderer:THREE.WebGLRenderer|undefined,controls:OrbitControls|undefined,observer:ResizeObserver|undefined,frame=0,environment:THREE.WebGLRenderTarget|undefined;const textures:THREE.Texture[]=[];const scene=new THREE.Scene();setError("");setLoading(true);
 try{
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0xffffff);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;el.replaceChildren(renderer.domElement);renderer.domElement.setAttribute("aria-label","Modelo 3D interativo. Arraste para girar; use a roda do mouse para ampliar.");
 const camera=new THREE.PerspectiveCamera(32,1,.01,100);const profile=modelProfile(product.model),bodyHeight=profile.points.at(-1)![1],height=profile.visualHeight??bodyHeight;
 camera.position.set(0,height*.75,height*3.7);controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,height*.49,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=height*1.8;controls.maxDistance=height*7;controls.maxPolarAngle=Math.PI*.88;controls.autoRotate=false;controls.autoRotateSpeed=.6;controls.addEventListener("start",()=>{if(controls)controls.autoRotate=false;});reset.current=()=>{camera.position.set(0,height*.75,height*3.7);controls?.target.set(0,height*.49,0);if(controls)controls.autoRotate=false;};
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();scene.add(new THREE.HemisphereLight(0xffffff,0xa6b0c2,2));
 const light=new THREE.DirectionalLight(0xffffff,4);light.position.set(-3,5,4);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-3;light.shadow.camera.right=3;light.shadow.camera.top=3;light.shadow.camera.bottom=-3;light.shadow.normalBias=.03;scene.add(light);
 const fill=new THREE.DirectionalLight(0xe5eeff,2);fill.position.set(3,2,-2);scene.add(fill);
 const col=COLORS.find(c=>c.name===product.color)||COLORS[2];const mat=new THREE.MeshPhysicalMaterial({color:col.hex,roughness:col.frosted?.66:col.opacity===1?.22:.12,metalness:col.metallic?.45:0,clearcoat:.8,clearcoatRoughness:.13,transmission:col.opacity===1?0:1-col.opacity,thickness:.055,ior:1.46,side:THREE.DoubleSide});
 const outer=profile.points.map(([r,y])=>new THREE.Vector2(r,y));const inner=profile.points.slice(1).reverse().map(([r,y])=>new THREE.Vector2(Math.max(.01,r-.018),Math.max(.03,y)));const geo=new THREE.LatheGeometry([...outer,...inner,new THREE.Vector2(.01,.035)],128);
 if(profile.twist){const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),y=pos.getY(i),angle=Math.atan2(z,x),s=1+.03*Math.sin(angle*12+y*2);pos.setXYZ(i,x*s,y,z*s);}geo.computeVertexNormals();}
 if(col.gradient){const gc=document.createElement("canvas");gc.width=8;gc.height=256;const gctx=gc.getContext("2d")!;const g=gctx.createLinearGradient(0,0,0,256);g.addColorStop(0,"#fafcfd");g.addColorStop(.25,"#fafcfd");g.addColorStop(.8,col.hex);g.addColorStop(1,col.hex);gctx.fillStyle=g;gctx.fillRect(0,0,8,256);const gt=new THREE.CanvasTexture(gc);gt.colorSpace=THREE.SRGBColorSpace;textures.push(gt);mat.color.set(0xffffff);mat.map=gt;}const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
 if(profile.lid){
  const topRadius=profile.points.at(-1)![0];
  const lidMat=new THREE.MeshPhysicalMaterial({color:profile.lid==="bucks"?0x34251e:0x16191c,roughness:.28,metalness:0,clearcoat:.35});
  if(profile.lid==="bucks"){
   const ring=new THREE.Mesh(new THREE.CylinderGeometry(topRadius*1.055,topRadius*1.055,.075,96),lidMat);ring.position.y=bodyHeight+.0375;ring.castShadow=true;scene.add(ring);
   const top=new THREE.Mesh(new THREE.CylinderGeometry(topRadius*.96,topRadius*.99,.035,96),lidMat);top.position.y=bodyHeight+.092;top.castShadow=true;scene.add(top);
  }else{
   const cap=new THREE.Mesh(new THREE.CylinderGeometry(topRadius*1.13,topRadius*1.13,.12,96),lidMat);cap.position.y=bodyHeight+.06;cap.castShadow=true;scene.add(cap);
   const neck=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.12,48),lidMat);neck.position.set(-.10,bodyHeight+.17,0);neck.castShadow=true;scene.add(neck);
   const flap=new THREE.Mesh(new THREE.BoxGeometry(.34,.055,.27),lidMat);flap.position.set(.10,bodyHeight+.205,-.02);flap.rotation.z=-.34;flap.castShadow=true;scene.add(flap);
   const hinge=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.30,32),lidMat);hinge.rotation.x=Math.PI/2;hinge.position.set(.20,bodyHeight+.145,0);scene.add(hinge);
  }
 }
 if(profile.handle){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(.36,height*.83,0),new THREE.Vector3(.74,height*.8,0),new THREE.Vector3(.78,height*.47,0),new THREE.Vector3(.68,height*.22,0),new THREE.Vector3(.36,height*.23,0)]);const handle=new THREE.Mesh(new THREE.TubeGeometry(curve,48,.045,12,false),mat);handle.castShadow=true;scene.add(handle);}
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x718099,opacity:.18}));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;floor.receiveShadow=true;scene.add(floor);
 if(product.art){const source=`/api/studio/assets/${product.art.id}${token?`?token=${encodeURIComponent(token)}`:""}`;new THREE.TextureLoader().load(source,(raw)=>{
  if(disposed){raw.dispose();return;}textures.push(raw);
  const twoFaces=product.print==="SILK FRENTE E VERSO";
  const frontOnly=product.print==="SILK FRENTE";
  const faces=twoFaces||frontOnly||product.artMode!=="template";
  const area=printArea(profile,product.model,faces);
  // Preserve the previously calibrated template width. Enlargement is for logos.
  if(twoFaces&&product.artMode==="template")area.width*=1.4/1.9;
  const canvas=document.createElement("canvas");
  // Pixel ratio follows the actual print surface, rather than stretching a
  // fixed 2:1 texture over every product.
  const aspect=area.width/area.height;
  canvas.width=Math.min(4096,Math.max(512,Math.round(1536*aspect)));
  canvas.height=Math.round(canvas.width/aspect);
  const context=canvas.getContext("2d")!;
  const img=raw.image as HTMLImageElement;
  const split=twoFaces&&product.artMode==="template";
  const isLogo=product.artMode!=="template";
  const regions=templateFaces(product.model,img.width,img.height);
  let sourceRegion=split?regions[0]:{x:0,y:0,width:img.width,height:img.height};
  if(isLogo){
   // Read a bounded mask to exclude transparent padding from logo sizing.
   // Opaque white backgrounds and template margins are deliberately preserved.
   try{
    const mask=document.createElement("canvas"),scale=Math.min(1,4096/Math.max(img.width,img.height));
    mask.width=Math.max(1,Math.round(img.width*scale));mask.height=Math.max(1,Math.round(img.height*scale));
    const ctx=mask.getContext("2d",{willReadFrequently:true})!;
    ctx.drawImage(img,0,0,mask.width,mask.height);
    const bounds=alphaBounds(ctx.getImageData(0,0,mask.width,mask.height).data,mask.width,mask.height);
    sourceRegion={x:bounds.x*img.width/mask.width,y:bounds.y*img.height/mask.height,width:bounds.width*img.width/mask.width,height:bounds.height*img.height/mask.height};
   }catch{/* Fall back to the complete image if pixel access is unavailable. */}
  }
  const rect=containRect(sourceRegion.width,sourceRegion.height,canvas.width,canvas.height,isLogo?.025:faces?.06:.012);
  if(isLogo){
   const scale=product.logoSize==="small"?.65:product.logoSize==="medium"?.82:1;
   rect.width*=scale;rect.height*=scale;
   rect.x=(canvas.width-rect.width)/2;rect.y=(canvas.height-rect.height)/2;
  }
  context.drawImage(img,sourceRegion.x,sourceRegion.y,sourceRegion.width,sourceRegion.height,rect.x,rect.y,rect.width,rect.height);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  tex.anisotropy=Math.min(renderer!.capabilities.getMaxAnisotropy(),8);textures.push(tex);
  const printGeo=faces?faceGeometry(profile,area):wrapGeometry(profile,area);
  const printMat=new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:.85,metalness:0,side:THREE.FrontSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  const printMesh=new THREE.Mesh(printGeo,printMat);scene.add(printMesh);
  if(twoFaces){
   let backMat=printMat;
   if(split){
    const backCanvas=document.createElement("canvas");backCanvas.width=canvas.width;backCanvas.height=canvas.height;
    const backRegion=regions[1];
    backCanvas.getContext("2d")!.drawImage(img,backRegion.x,backRegion.y,backRegion.width,backRegion.height,rect.x,rect.y,rect.width,rect.height);
    const backTexture=new THREE.CanvasTexture(backCanvas);backTexture.colorSpace=THREE.SRGBColorSpace;backTexture.anisotropy=tex.anisotropy;textures.push(backTexture);
    backMat=printMat.clone();backMat.map=backTexture;
   }
   const back=new THREE.Mesh(printGeo,backMat);back.rotation.y=Math.PI;scene.add(back);
  }
  setLoading(false);
 },undefined,()=>{if(!disposed){setError("A arte não pôde ser carregada. Reabra a apresentação ou tente novamente.");setLoading(false);}});}else setLoading(false);
 const resize=()=>{if(!renderer)return;const w=el.clientWidth||600,h=el.clientHeight||480;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};observer=new ResizeObserver(resize);observer.observe(el);resize();const tick=()=>{if(disposed)return;controls?.update();renderer?.render(scene,camera);frame=requestAnimationFrame(tick);};tick();
 }catch{setError("Não foi possível iniciar o 3D. Use um navegador com WebGL e aceleração gráfica habilitados.");setLoading(false);}
 return ()=>{disposed=true;cancelAnimationFrame(frame);observer?.disconnect();controls?.dispose();textures.forEach(t=>t.dispose());const materials=new Set<THREE.Material>();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});materials.forEach(m=>m.dispose());environment?.dispose();renderer?.dispose();el.replaceChildren();};
 },[product.model,product.color,product.print,product.art?.id,product.artMode,product.logoSize,token]);
 useEffect(()=>{const f=()=>setFull(!!document.fullscreenElement);document.addEventListener("fullscreenchange",f);return()=>document.removeEventListener("fullscreenchange",f);},[]);
 async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await wrapper.current?.requestFullscreen();}catch{setError("Tela cheia indisponível neste navegador.");}}
 return <div className="viewer-wrap" ref={wrapper}><div ref={host} className="viewer-canvas"/><div className="viewer-actions"><Button variant="outline" size="icon" aria-label="Restaurar visão" title="Restaurar visão" onClick={()=>reset.current()}><RotateCcw/></Button><Button variant="outline" size="icon" aria-label={full?"Sair da tela cheia":"Visualizar em tela cheia"} onClick={fullscreen}>{full?<Minimize/>:<Maximize/>}</Button></div>{loading&&<div className="viewer-loading" role="status">Carregando arte…</div>}{error&&<div className="viewer-error" role="alert">{error}</div>}<div className="viewer-hint"><Rotate3D size={14}/>Arraste para girar · role para ampliar</div></div>;
}

