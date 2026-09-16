import { env } from "cloudflare:workers";
import { getEcojoiUser,isEcojoiAdmin } from "@/app/ecojoi-auth";
import { COLORS,MODELS,LEGACY_MODELS,PRINTS,colorsFor,requirements,type Design,type Product } from "@/lib/catalog";
const bindings=()=>env as unknown as {DB:D1Database;BUCKET:R2Bucket};
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
class HttpError extends Error {constructor(public status:number,message:string){super(message);}}
function fail(status:number,message:string):never{throw new HttpError(status,message);}
type Row={id:string;owner_id:string;name:string;products:string;created_at:number;updated_at:number;expires_at:number|null;revoked_at:number|null;token:string|null;version:number};
const unpack=(r:Row):Design=>({id:r.id,name:r.name,products:JSON.parse(r.products),createdAt:r.created_at,updatedAt:r.updated_at,expiresAt:r.expires_at,revokedAt:r.revoked_at,token:r.token,version:r.version});
async function owned(id:string,owner:string){const r=await bindings().DB.prepare("SELECT * FROM designs WHERE id=? AND owner_id=?").bind(id,owner).first<Row>();if(!r)fail(404,"Design não encontrado.");return r!;}
async function body(req:Request){if(Number(req.headers.get("content-length")||0)>150000)fail(413,"Dados muito grandes.");const text=await req.text();if(text.length>150000)fail(413,"Dados muito grandes.");try{return JSON.parse(text);}catch{fail(400,"Dados inválidos.");}}
function validateProducts(value:unknown):Product[]{
 if(!Array.isArray(value)||value.length>5)fail(400,"Configure no máximo 5 produtos.");
 const seen=new Set();return (value as Product[]).map(p=>{if(!p||typeof p.id!=="string"||!/^[-a-zA-Z0-9]{1,80}$/.test(p.id)||seen.has(p.id))fail(400,"Produto inválido.");seen.add(p.id);const current=(MODELS as readonly string[]).includes(p.model),legacy=(LEGACY_MODELS as readonly string[]).includes(p.model);if(!(PRINTS as readonly string[]).includes(p.print)||(!current&&!legacy)||(current?!colorsFor(p.print,p.model).includes(p.color):(typeof p.color!=="string"||p.color.length<1||p.color.length>100)))fail(400,"Configuração de produto inválida.");if(p.art && (typeof p.art.id!=="string"||!/^[-a-zA-Z0-9]{1,80}$/.test(p.art.id)))fail(400,"Arte inválida.");if(p.artMode!==undefined&&p.artMode!=="logo"&&p.artMode!=="template")fail(400,"Aplicação da arte inválida.");if(p.logoSize!==undefined&&!(["small","medium","large"] as const).includes(p.logoSize))fail(400,"Tamanho da arte inválido.");return {...(p.logoSize?{logoSize:p.logoSize}:{}),...(p.artMode?{artMode:p.artMode}:{}),id:p.id,print:p.print,model:p.model,color:p.color,art:p.art?{id:p.art.id,name:"",type:"",size:0}:null};});
}
async function route(req:Request,ctx:{params:Promise<{path:string[]}>}){
 try{
 const {path}=await ctx.params;const url=new URL(req.url);const db=bindings().DB;if(!db)fail(503,"Armazenamento indisponível. Tente novamente.");
 if(req.method!=="GET"){const origin=req.headers.get("origin");if(origin&&origin!==url.origin)fail(403,"Origem não autorizada.");}
 if(path[0]==="public"&&path[1]&&req.method==="GET"){
  const r=await db.prepare("SELECT * FROM designs WHERE token=? AND expires_at>? AND revoked_at IS NULL").bind(path[1],Date.now()).first<Row>();if(!r)fail(410,"Este link expirou ou não está disponível. Solicite um novo link ao seu vendedor.");return json(unpack(r!));
 }
 if(path[0]==="assets"&&path[1]&&req.method==="GET"){
  const a=await db.prepare("SELECT * FROM assets WHERE id=?").bind(path[1]).first<{id:string;owner_id:string;design_id:string;object_key:string;type:string}>();if(!a)fail(404,"Arte não encontrada.");
  const token=url.searchParams.get("token");let permitted=false;
  if(token){const r=await db.prepare("SELECT * FROM designs WHERE id=? AND token=? AND expires_at>? AND revoked_at IS NULL").bind(a!.design_id,token,Date.now()).first<Row>();permitted=!!r&&unpack(r).products.some(p=>p.art?.id===a!.id);}else{const u=await getEcojoiUser();permitted=!!u&&u.userId===a!.owner_id;}
  if(!permitted)fail(403,"Acesso não autorizado.");const object=await bindings().BUCKET.get(a!.object_key);if(!object)fail(404,"Arquivo indisponível.");return new Response(object!.body,{headers:{"Content-Type":a!.type,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"}});
 }
 const user=await getEcojoiUser();if(!user)fail(401,"Entre para acessar seus designs.");const owner=user!.userId;
 if(path[0]==="me"&&req.method==="GET")return json({name:user!.displayName,role:isEcojoiAdmin(user)?"admin":"user"});
 if(path[0]!=="designs")fail(404,"Página não encontrada.");
 if(!path[1]&&req.method==="GET"){const list=await db.prepare("SELECT * FROM designs WHERE owner_id=? ORDER BY created_at DESC").bind(owner).all<Row>();return json(list.results.map(unpack));}
 if(!path[1]&&req.method==="POST"){
  const b=await body(req);const name=typeof b.name==="string"?b.name.trim().slice(0,160):"";const id=crypto.randomUUID(),now=Date.now();await db.prepare("INSERT INTO designs (id,owner_id,name,products,created_at,updated_at,version) VALUES (?,?,?,'[]',?,?,1)").bind(id,owner,name,now,now).run();return json(unpack(await owned(id,owner)),201);
 }
 const id=path[1];const row=await owned(id,owner);
 if(!path[2]&&req.method==="GET")return json(unpack(row));
 if(!path[2]&&req.method==="PUT"){
  const b=await body(req);if(typeof b.name!=="string"||b.name.length>160||!Number.isInteger(b.version))fail(400,"Nome ou versão inválidos.");const products=validateProducts(b.products);
  for(const p of products){if(p.art){const a=await db.prepare("SELECT id,name,type,size FROM assets WHERE id=? AND design_id=? AND owner_id=?").bind(p.art.id,id,owner).first<{id:string;name:string;type:string;size:number}>();if(!a)fail(400,"A arte não pertence a este design.");p.art=a!;}}
  const result=await db.prepare("UPDATE designs SET name=?, products=?, updated_at=?, version=version+1 WHERE id=? AND owner_id=? AND version=?").bind(b.name,JSON.stringify(products),Date.now(),id,owner,b.version).run();if(!result.meta.changes)fail(409,"Este design foi alterado em outra aba. Reabra-o antes de salvar.");return json(unpack(await owned(id,owner)));
 }
 if((path[2]==="publish"||path[2]==="expire"||path[2]==="revoke")&&req.method==="POST"){
  const b=await body(req);if(b.version!==row.version)fail(409,"O design mudou. Reabra-o antes de publicar.");
  if(path[2]==="publish"){
   if(!requirements(unpack(row)).every(Boolean))fail(400,"Preencha o nome e envie uma arte para cada produto.");
   const token=crypto.randomUUID().replaceAll("-","")+crypto.randomUUID().replaceAll("-","");
   const result=await db.prepare("UPDATE designs SET token=?, expires_at=?, revoked_at=NULL, updated_at=?, version=version+1 WHERE id=? AND owner_id=? AND version=?").bind(token,Date.now()+30*86400000,Date.now(),id,owner,b.version).run();if(!result.meta.changes)fail(409,"O design mudou. Tente novamente.");
  }else if(path[2]==="revoke"){const result=await db.prepare("UPDATE designs SET revoked_at=?,updated_at=?,version=version+1 WHERE id=? AND owner_id=? AND version=?").bind(Date.now(),Date.now(),id,owner,b.version).run();if(!result.meta.changes)fail(409,"O design mudou. Tente novamente.");}else{const result=await db.prepare("UPDATE designs SET expires_at=?, updated_at=?, version=version+1 WHERE id=? AND owner_id=? AND version=?").bind(Date.now()-1,Date.now(),id,owner,b.version).run();if(!result.meta.changes)fail(409,"O design mudou. Tente novamente.");}
  return json(unpack(await owned(id,owner)));
 }
 if(path[2]==="assets"&&req.method==="POST"){
  const limit=15*1024*1024;if(Number(req.headers.get("content-length")||0)>limit+50000)fail(413,"Envie uma imagem de até 15 MB.");
  const form=await req.formData();const file=form.get("file");if(!(file instanceof File)||file.size<12||file.size>limit)fail(400,"Envie uma imagem PNG, JPG ou WebP de até 15 MB.");
  const data=await file.arrayBuffer();const v=new Uint8Array(data);let mime="";
  if(v[0]===137&&v[1]===80&&v[2]===78&&v[3]===71&&v[4]===13&&v[5]===10&&v[6]===26&&v[7]===10)mime="image/png";
  else if(v[0]===255&&v[1]===216&&v[2]===255)mime="image/jpeg";
  else if(String.fromCharCode(...v.slice(0,4))==="RIFF"&&String.fromCharCode(...v.slice(8,12))==="WEBP")mime="image/webp";
  if(!mime)fail(415,"Formato não suportado. Use PNG, JPG ou WebP.");
  const aid=crypto.randomUUID(),key=`art/${id}/${aid}`;const name=file.name.replace(/[\x00-\x1f]/g,"").slice(0,180);
  await bindings().BUCKET.put(key,data,{httpMetadata:{contentType:mime}});
  try{await db.prepare("INSERT INTO assets (id,design_id,owner_id,object_key,name,type,size,created_at) VALUES (?,?,?,?,?,?,?,?)").bind(aid,id,owner,key,name,mime,file.size,Date.now()).run();}catch(e){await bindings().BUCKET.delete(key);throw e;}
  return json({id:aid,name,type:mime,size:file.size},201);
 }
 fail(405,"Ação não permitida.");
 }catch(e){if(e instanceof HttpError)return json({error:e.message},e.status);console.error("studio_request_failed",e instanceof Error?e.message:"storage");return json({error:"Não foi possível concluir. Seus dados na tela foram preservados; tente novamente."},503);}
}
export const GET=route;export const POST=route;export const PUT=route;




