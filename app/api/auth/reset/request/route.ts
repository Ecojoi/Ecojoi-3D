import {env} from "cloudflare:workers";
import {authDb,digest} from "@/app/ecojoi-auth";

const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const message="Se existir uma conta ativa com este e-mail, você receberá um link para redefinir a senha.";
type EmailConfig={RESEND_API_KEY?:string;ECOJOI_RESET_FROM?:string};

export async function POST(req:Request){
 try{
  const origin=new URL(req.url).origin;
  if(req.headers.get("origin")!==origin)return reply({error:"Origem não autorizada."},403);
  if(Number(req.headers.get("content-length")||0)>4096)return reply({error:"Dados inválidos."},413);
  const raw=await req.text();
  if(raw.length>4096)return reply({error:"Dados inválidos."},413);
  let data:unknown;
  try{data=JSON.parse(raw);}catch{return reply({error:"Dados inválidos."},400);}
  if(!data||typeof data!=="object"||Array.isArray(data))return reply({error:"Dados inválidos."},400);
  const {email:rawEmail}=data as Record<string,unknown>;
  const email=typeof rawEmail==="string"?rawEmail.trim().toLowerCase():"";
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return reply({error:"Informe um e-mail válido."},400);

  const config=env as unknown as EmailConfig;
  if(!config.RESEND_API_KEY||!config.ECOJOI_RESET_FROM)return reply({error:"Recuperação por e-mail indisponível. Contate o administrador da ECOJOI."},503);
  const now=Date.now(),window=Math.floor(now/900000);
  const ip=req.headers.get("cf-connecting-ip")||"unknown";
  const db=authDb();
  const keys=["reset-ip:"+await digest(ip)+":"+window,"reset-email:"+await digest(email)+":"+window];
  const attempts=await db.batch(keys.map(key=>db.prepare("INSERT INTO ecojoi_auth_attempts (id,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=attempts+1 RETURNING attempts").bind(key,now+1800000)));
  if(attempts.some((record,index)=>Number((record.results[0] as {attempts:number}).attempts)>(index===0?10:3)))return reply({error:"Muitas solicitações. Tente novamente em 15 minutos."},429);
  const account=await db.prepare("SELECT id,email FROM ecojoi_accounts WHERE email=? AND disabled=0").bind(email).first<{id:string;email:string}>();
  if(!account)return reply({message});

  const random=crypto.getRandomValues(new Uint8Array(32));
  const token=Array.from(random,n=>n.toString(16).padStart(2,"0")).join("");
  const hash=await digest(token);
  await db.batch([
   db.prepare("DELETE FROM ecojoi_password_resets WHERE expires_at<?").bind(now),
   db.prepare("DELETE FROM ecojoi_password_resets WHERE account_id=?").bind(account.id),
   db.prepare("INSERT INTO ecojoi_password_resets (token_hash,account_id,expires_at,created_at) VALUES (?,?,?,?)").bind(hash,account.id,now+20*60000,now),
  ]);

  // Never construct a reset URL from an untrusted Host header.
  const link="https://3d.ecojoi.com.br/redefinir-senha?token="+token;
  try{
   const sent=await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{"Authorization":"Bearer "+config.RESEND_API_KEY,"Content-Type":"application/json","User-Agent":"ecojoi-studio-3d/1.0"},
    body:JSON.stringify({
     from:config.ECOJOI_RESET_FROM,
     to:[account.email],
     subject:"Redefinição de senha | ECOJOI Studio 3D",
     text:"Recebemos um pedido para redefinir a senha do ECOJOI Studio 3D.\n\nAbra o link abaixo em até 20 minutos:\n"+link+"\n\nSe você não solicitou a alteração, ignore esta mensagem.",
    }),
    signal:AbortSignal.timeout(12000),
   });
   if(!sent.ok)throw new Error("Provider failure");
  }catch{
   await db.prepare("DELETE FROM ecojoi_password_resets WHERE token_hash=?").bind(hash).run();
   console.error("Falha no envio do e-mail de recuperação.");
  }
  return reply({message});
 }catch{
  return reply({error:"Não foi possível processar a solicitação agora."},503);
 }
}
