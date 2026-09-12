import { headers } from "next/headers";
import { env } from "cloudflare:workers";
import {getChatGPTUser} from "@/app/chatgpt-auth";
import {authDb,COOKIE,digest,equal,getEcojoiUser,newSession,passwordHash} from "@/app/ecojoi-auth";
const json=(data:unknown,status=200,cookie?:string)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...(cookie?{"Set-Cookie":cookie}:{})}});
export async function POST(req:Request,ctx:{params:Promise<{action:string}>}){
 try{
  const url=new URL(req.url);if(req.headers.get("origin")!==url.origin)return json({error:"Origem não autorizada."},403);
  if(Number(req.headers.get("content-length")||0)>4096)return json({error:"Dados inválidos."},413);
  const raw=await req.text();if(raw.length>4096)return json({error:"Dados inválidos."},413);
  let b:Record<string,unknown>;try{b=JSON.parse(raw||"{}");}catch{return json({error:"Dados inválidos."},400);}
  if(!b||typeof b!=="object")return json({error:"Dados inválidos."},400);
  const {action}=await ctx.params;const db=authDb();
  if(action==="logout"){
   const h=await headers();const token=h.get("cookie")?.split(";").map(s=>s.trim()).find(s=>s.startsWith(COOKIE+"="))?.slice(COOKIE.length+1);
   if(token)await db.prepare("DELETE FROM ecojoi_sessions WHERE token_hash=?").bind(await digest(token)).run();
   return json({ok:true},200,`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  }
  if(!["login","activate","password"].includes(action))return json({error:"Página não encontrada."},404);
  const email=typeof b.email==="string"?b.email.trim().toLowerCase():"";
  const password=typeof b.password==="string"?b.password:"";
  if(password.length<12||password.length>128||email.length>254)return json({error:"Use uma senha entre 12 e 128 caracteres."},400);
  const now=Date.now(),window=Math.floor(now/900000);
  const ip=req.headers.get("cf-connecting-ip")||"unknown";
  const keys=[`ip:${await digest(ip)}:${window}`,`email:${await digest(email)}:${window}`];
  const counts=await db.batch(keys.map(key=>db.prepare("INSERT INTO ecojoi_auth_attempts (id,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=attempts+1 RETURNING attempts").bind(key,now+1800000)));
  if(counts.some((r,i)=>Number((r.results[0] as {attempts:number}).attempts)>(i===0?30:10)))return json({error:"Muitas tentativas. Aguarde 15 minutos."},429);
  await db.batch([db.prepare("DELETE FROM ecojoi_auth_attempts WHERE expires_at<?").bind(now),db.prepare("DELETE FROM ecojoi_sessions WHERE expires_at<?").bind(now)]);
  if(action==="activate"){
   const legacy=await getChatGPTUser();const ownerEmail=(env as unknown as {ECOJOI_OWNER_EMAIL?:string}).ECOJOI_OWNER_EMAIL;
   if(!ownerEmail||!legacy||legacy.email.toLowerCase()!==ownerEmail.toLowerCase())return json({error:"Ativação disponível apenas para o proprietário autenticado."},403);
   const salt=crypto.randomUUID(),hash=await passwordHash(password,salt),id=crypto.randomUUID();
   const result=await db.prepare("INSERT INTO ecojoi_accounts (id,owner_id,email,name,password_hash,salt,disabled) VALUES (?,?,?,?,?,?,0) ON CONFLICT(email) DO NOTHING").bind(id,legacy.userId,legacy.email.toLowerCase(),legacy.displayName,hash,salt).run();
   if(!result.meta.changes)return json({error:"A conta já foi ativada. Entre com sua senha."},409);
   return json({ok:true,email:legacy.email},201,await newSession(id));
  }
  if(action==="password"){
   const user=await getEcojoiUser();if(!user)return json({error:"Entre para alterar sua senha."},401);
   const account=await db.prepare("SELECT password_hash,salt FROM ecojoi_accounts WHERE id=?").bind(user.accountId).first<{password_hash:string;salt:string}>();
   if(!account||typeof b.currentPassword!=="string"||b.currentPassword.length>128||!equal(await passwordHash(b.currentPassword,account.salt),account.password_hash))return json({error:"Senha atual incorreta."},401);
   const salt=crypto.randomUUID(),hash=await passwordHash(password,salt);
   await db.batch([db.prepare("UPDATE ecojoi_accounts SET password_hash=?,salt=? WHERE id=?").bind(hash,salt,user.accountId),db.prepare("DELETE FROM ecojoi_sessions WHERE account_id=?").bind(user.accountId)]);
   return json({ok:true},200,await newSession(user.accountId));
  }
  const account=await db.prepare("SELECT id,password_hash,salt FROM ecojoi_accounts WHERE email=? AND disabled=0").bind(email).first<{id:string;password_hash:string;salt:string}>();
  const hash=await passwordHash(password,account?.salt||"ecojoi-nonexistent-account");
  if(!account||!equal(hash,account.password_hash))return json({error:"E-mail ou senha incorretos."},401);
  return json({ok:true},200,await newSession(account.id));
 }catch{return json({error:"Não foi possível entrar agora. Tente novamente."},503);}
}
