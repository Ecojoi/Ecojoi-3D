import {authDb,digest,passwordHash} from "@/app/ecojoi-auth";

const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
export async function POST(req:Request){
 try{
  if(req.headers.get("origin")!==new URL(req.url).origin)return reply({error:"Origem não autorizada."},403);
  if(Number(req.headers.get("content-length")||0)>4096)return reply({error:"Dados inválidos."},413);
  const raw=await req.text();
  if(raw.length>4096)return reply({error:"Dados inválidos."},413);
  let data:unknown;
  try{data=JSON.parse(raw);}catch{return reply({error:"Dados inválidos."},400);}
  if(!data||typeof data!=="object"||Array.isArray(data))return reply({error:"Dados inválidos."},400);
  const {token,password}=data as {token?:unknown;password?:unknown};
  if(typeof token!=="string"||!/^[a-f0-9]{64}$/.test(token))return reply({error:"Link de recuperação inválido ou expirado."},400);
  if(typeof password!=="string"||password.length<12||password.length>128)return reply({error:"Use uma senha entre 12 e 128 caracteres."},400);
  const db=authDb(),now=Date.now(),window=Math.floor(now/900000);
  const ip=req.headers.get("cf-connecting-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]||"unknown";
  const key="reset-confirm-ip:"+await digest(ip)+":"+window;
  const row=await db.prepare("INSERT INTO ecojoi_auth_attempts (id,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=attempts+1 RETURNING attempts").bind(key,now+1800000).first<{attempts:number}>();
  if(!row||Number(row.attempts)>12)return reply({error:"Muitas tentativas. Aguarde 15 minutos."},429);

  const salt=crypto.randomUUID(),hashedPassword=await passwordHash(password,salt);
  // DELETE ... RETURNING consumes a valid recovery token once, including across concurrent requests.
  const reset=await db.prepare("DELETE FROM ecojoi_password_resets WHERE token_hash=? AND expires_at>? AND account_id IN (SELECT id FROM ecojoi_accounts WHERE disabled=0) RETURNING account_id").bind(await digest(token),now).first<{account_id:string}>();
  if(!reset)return reply({error:"Link de recuperação inválido ou expirado. Solicite outro."},400);
  await db.batch([
   db.prepare("UPDATE ecojoi_accounts SET password_hash=?,salt=? WHERE id=? AND disabled=0").bind(hashedPassword,salt,reset.account_id),
   db.prepare("DELETE FROM ecojoi_sessions WHERE account_id=?").bind(reset.account_id),
   db.prepare("DELETE FROM ecojoi_password_resets WHERE account_id=?").bind(reset.account_id),
  ]);
  return reply({message:"Senha redefinida. Entre com a nova senha."});
 }catch{
  return reply({error:"Não foi possível redefinir a senha agora."},503);
 }
}
