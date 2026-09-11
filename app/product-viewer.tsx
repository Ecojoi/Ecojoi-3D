"use client";
import {useEffect,useRef,useState} from "react";
import {Maximize,Minimize,RotateCcw,Rotate3D} from "lucide-react";
import {Button} from "@/components/ui/button";
import {COLORS,type Product} from "@/lib/catalog";
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {RoomEnvironment} from "three/addons/environments/RoomEnvironment.js";

type Profile={points:[number,number][];printMin:number;handle?:boolean;twist?:boolean};
// Preliminary normalized profiles. Replace with measured production profiles after validation.
export function modelProfile(name:string):Profile { name=name.toUpperCase();
 if(name.includes("TAÇA")||name==="TULIPA"){
  if(name==="TULIPA")return {points:[[.1,0],[.31,.025],[.32,.06],[.26,.15],[.23,.27],[.28,.55],[.41,.92],[.42,1.32],[.38,1.55]],printMin:.25};
  const gin=name.includes("GIN"),wine=name.includes("VINHO");
  if(gin){
   // Smooth bowl with a shared vertical tangent at its widest point. Both the
   // body and the artwork below use these same samples; dimensions remain approximate.
   const lower=new THREE.CubicBezierCurve(new THREE.Vector2(.04,.57),new THREE.Vector2(.04,.72),new THREE.Vector2(.56,.69),new THREE.Vector2(.56,1.05));
   const upper=new THREE.CubicBezierCurve(new THREE.Vector2(.56,1.05),new THREE.Vector2(.56,1.25),new THREE.Vector2(.49,1.42),new THREE.Vector2(.43,1.54));
   const bowl=[...lower.getPoints(64),...upper.getPoints(64).slice(1)].map(p=>[p.x,p.y] as [number,number]);
   return {points:[[.02,0],[.39,.02],[.41,.045],[.37,.07],[.045,.09],...bowl],printMin:.68};
  }
  return {points:[[.02,0],[.39,.02],[.41,.045],[.37,.07],[.045,.09],[.04,.57],[.09,.61],[.23,.66],[gin?.48:.36,.82],[gin?.56: .45,1.05],[gin?.54: .44,1.27],[wine?.3:.43,1.54]],printMin:.68};
 }
 if(name.includes("BALDE"))return {points:[[.02,0],[.62,.02],[.65,.08],[.84,1.2],[.87,1.23],[.86,1.26]],printMin:.1}; if(name.includes("GARRAFA"))return {points:[[.02,0],[.3,.025],[.34,.07],[.35,1.25],[.32,1.4],[.17,1.57],[.16,1.8],[.18,1.81]],printMin:.08};
 if(name.includes("CANECA")){const big=name.includes("500");return {points:[[.02,0],[.34,.015],[.38,.08],[.39,big?1.3:1.05],[.41,big?1.33:1.08]],printMin:.09,handle:true};}
 if(name==="SHOT")return {points:[[.02,0],[.23,.015],[.24,.08],[.3,.66],[.315,.68]],printMin:.08};
 if(name.includes("WHISKY"))return {points:[[.02,0],[.39,.02],[.4,.09],[.43,.85],[.445,.88]],printMin:.08};
 const h=name.includes("300")?1.12:name.includes("600")?1.72:name.includes("500")?1.55:name==="LONG DRINK"?1.65:1.35;
 return {points:[[.02,0],[.28,.018],[.3,.04],[.305,.1],[.34,h*.4],[.39,h*.82],[.405,h-.03],[.42,h],[.415,h+.025]],printMin:.09,twist:name.includes("TWISTER")};
}
export default function ProductViewer({product,token}:{product:Product;token?:string}){
 const host=useRef<HTMLDivElement>(null),wrapper=useRef<HTMLDivElement>(null),reset=useRef<()=>void>(()=>{});const [error,setError]=useState(""),[full,setFull]=useState(false),[loading,setLoading]=useState(true);
 useEffect(()=>{const el=host.current;if(!el)return;let disposed=false,renderer:THREE.WebGLRenderer|undefined,controls:OrbitControls|undefined,observer:ResizeObserver|undefined,frame=0,environment:THREE.WebGLRenderTarget|undefined;const textures:THREE.Texture[]=[];const scene=new THREE.Scene();setError("");setLoading(true);
 try{
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0xffffff);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;el.replaceChildren(renderer.domElement);renderer.domElement.setAttribute("aria-label","Modelo 3D interativo. Arraste para girar; use a roda do mouse para ampliar.");
 const camera=new THREE.PerspectiveCamera(32,1,.01,100);const profile=modelProfile(product.model),height=profile.points.at(-1)![1];
 camera.position.set(0,height*.75,height*3.7);controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,height*.49,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=height*1.8;controls.maxDistance=height*7;controls.maxPolarAngle=Math.PI*.88;controls.autoRotate=true;controls.autoRotateSpeed=.6;controls.addEventListener("start",()=>{if(controls)controls.autoRotate=false;});reset.current=()=>{camera.position.set(0,height*.75,height*3.7);controls?.target.set(0,height*.49,0);if(controls)controls.autoRotate=true;};
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();scene.add(new THREE.HemisphereLight(0xffffff,0xa6b0c2,2));
 const light=new THREE.DirectionalLight(0xffffff,4);light.position.set(-3,5,4);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-3;light.shadow.camera.right=3;light.shadow.camera.top=3;light.shadow.camera.bottom=-3;light.shadow.normalBias=.03;scene.add(light);
 const fill=new THREE.DirectionalLight(0xe5eeff,2);fill.position.set(3,2,-2);scene.add(fill);
 const col=COLORS.find(c=>c.name===product.color)||COLORS[2];const mat=new THREE.MeshPhysicalMaterial({color:col.hex,roughness:col.frosted?.66:col.opacity===1?.22:.12,metalness:col.metallic?.45:0,clearcoat:.8,clearcoatRoughness:.13,transmission:col.opacity===1?0:1-col.opacity,thickness:.055,ior:1.46,side:THREE.DoubleSide});
 const outer=profile.points.map(([r,y])=>new THREE.Vector2(r,y));const inner=profile.points.slice(1).reverse().map(([r,y])=>new THREE.Vector2(Math.max(.01,r-.018),Math.max(.03,y)));const geo=new THREE.LatheGeometry([...outer,...inner,new THREE.Vector2(.01,.035)],128);
 if(profile.twist){const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),y=pos.getY(i),angle=Math.atan2(z,x),s=1+.03*Math.sin(angle*12+y*2);pos.setXYZ(i,x*s,y,z*s);}geo.computeVertexNormals();}
 if(col.gradient){const gc=document.createElement("canvas");gc.width=8;gc.height=256;const gctx=gc.getContext("2d")!;const g=gctx.createLinearGradient(0,0,0,256);g.addColorStop(0,"#fafcfd");g.addColorStop(.25,"#fafcfd");g.addColorStop(.8,col.hex);g.addColorStop(1,col.hex);gctx.fillStyle=g;gctx.fillRect(0,0,8,256);const gt=new THREE.CanvasTexture(gc);gt.colorSpace=THREE.SRGBColorSpace;textures.push(gt);mat.color.set(0xffffff);mat.map=gt;}const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
 if(profile.handle){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(.36,height*.83,0),new THREE.Vector3(.74,height*.8,0),new THREE.Vector3(.78,height*.47,0),new THREE.Vector3(.68,height*.22,0),new THREE.Vector3(.36,height*.23,0)]);const handle=new THREE.Mesh(new THREE.TubeGeometry(curve,48,.045,12,false),mat);handle.castShadow=true;scene.add(handle);}
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x718099,opacity:.18}));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;floor.receiveShadow=true;scene.add(floor);
 if(product.art){const source=`/api/studio/assets/${product.art.id}${token?`?token=${encodeURIComponent(token)}`:""}`;new THREE.TextureLoader().load(source,(raw)=>{
  if(disposed){raw.dispose();return;}textures.push(raw);const canvas=document.createElement("canvas");canvas.width=2048;canvas.height=1024;const context=canvas.getContext("2d")!;const img=raw.image as HTMLImageElement;const ratio=Math.min(canvas.width/img.width,canvas.height/img.height);const w=img.width*ratio,h=img.height*ratio;context.drawImage(img,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(renderer!.capabilities.getMaxAnisotropy(),8);textures.push(tex);
  const points=Array.from({length:65},(_,i)=>{const y=profile.printMin+(height*.93-profile.printMin)*i/64;let a=outer[0],b=outer[1];for(let j=1;j<outer.length;j++){if(outer[j].y>=y){a=outer[j-1];b=outer[j];break;}}const t=(y-a.y)/Math.max(.0001,b.y-a.y);return new THREE.Vector2(a.x+(b.x-a.x)*t+.002,y);});if(points.length>=2){const printGeo=new THREE.LatheGeometry(points,128);if(profile.twist){const pos=printGeo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),y=pos.getY(i),s=1+.03*Math.sin(Math.atan2(z,x)*12+y*2);pos.setXYZ(i,x*s,y,z*s);}printGeo.computeVertexNormals();}const printMat=new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:.4,metalness:0,side:THREE.FrontSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});const printMesh=new THREE.Mesh(printGeo,printMat);scene.add(printMesh);}setLoading(false);
 },undefined,()=>{if(!disposed){setError("A arte não pôde ser carregada. Reabra a apresentação ou tente novamente.");setLoading(false);}});}else setLoading(false);
 const resize=()=>{if(!renderer)return;const w=el.clientWidth||600,h=el.clientHeight||480;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};observer=new ResizeObserver(resize);observer.observe(el);resize();const tick=()=>{if(disposed)return;controls?.update();renderer?.render(scene,camera);frame=requestAnimationFrame(tick);};tick();
 }catch{setError("Não foi possível iniciar o 3D. Use um navegador com WebGL e aceleração gráfica habilitados.");setLoading(false);}
 return ()=>{disposed=true;cancelAnimationFrame(frame);observer?.disconnect();controls?.dispose();textures.forEach(t=>t.dispose());const materials=new Set<THREE.Material>();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});materials.forEach(m=>m.dispose());environment?.dispose();renderer?.dispose();el.replaceChildren();};
 },[product.model,product.color,product.print,product.art?.id,token]);
 useEffect(()=>{const f=()=>setFull(!!document.fullscreenElement);document.addEventListener("fullscreenchange",f);return()=>document.removeEventListener("fullscreenchange",f);},[]);
 async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await wrapper.current?.requestFullscreen();}catch{setError("Tela cheia indisponível neste navegador.");}}
 return <div className="viewer-wrap" ref={wrapper}><div ref={host} className="viewer-canvas"/><div className="viewer-actions"><Button variant="outline" size="icon" aria-label="Restaurar visão" title="Restaurar visão" onClick={()=>reset.current()}><RotateCcw/></Button><Button variant="outline" size="icon" aria-label={full?"Sair da tela cheia":"Visualizar em tela cheia"} onClick={fullscreen}>{full?<Minimize/>:<Maximize/>}</Button></div>{loading&&<div className="viewer-loading" role="status">Carregando arte…</div>}{error&&<div className="viewer-error" role="alert">{error}</div>}<div className="viewer-hint"><Rotate3D size={14}/>Arraste para girar · role para ampliar</div></div>;
}

