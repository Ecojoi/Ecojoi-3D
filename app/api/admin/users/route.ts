import {authDb,getEcojoiUser,isEcojoiAdmin,passwordHash} from '@/app/ecojoi-auth';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function authorize(){const user=await getEcojoiUser();return !user?json({error:'Entre para continuar.'},401):!isEcojoiAdmin(user)?json({error:'Acesso exclusivo do administrador.'},403):null;}
export async function GET(){
 try{
  const denied=await authorize();if(denied)return denied;
  const rows=await authDb().prepare('SELECT id,name,email,disabled FROM ecojoi_accounts ORDER BY name COLLATE NOCASE,email').all<{id:string;name:string;email:string;disabled:number}>();
  return json(rows.results.map(row=>({...row,role:isEcojoiAdmin(row)?'admin':'user'})));
 }catch{return json({error:'Não foi possível carregar os usuários. Tente novamente.'},503);}
}
export async function POST(req:Request){
 try{
  if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Origem não autorizada.'},403);
  const denied=await authorize();if(denied)return denied;
  if(Number(req.headers.get('content-length')||0)>4096)return json({error:'Dados muito grandes.'},413);
  const raw=await req.text();if(raw.length>4096)return json({error:'Dados muito grandes.'},413);
  let data:Record<string,unknown>;try{data=JSON.parse(raw);}catch{return json({error:'Dados inválidos.'},400);}
  if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(k=>!['name','email','password'].includes(k)))return json({error:'Dados inválidos.'},400);
  const name=typeof data.name==='string'?data.name.trim():'';
  const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
  const password=typeof data.password==='string'?data.password:'';
  if(!name||name.length>120||/[\x00-\x1f\x7f]/.test(name))return json({error:'Informe um nome com até 120 caracteres.'},400);
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({error:'Informe um e-mail válido.'},400);
  if(password.length<12||password.length>128)return json({error:'Use uma senha entre 12 e 128 caracteres.'},400);
  const salt=crypto.randomUUID(),hash=await passwordHash(password,salt),id=crypto.randomUUID();
  // Each login retains its own immutable owner id. Client-supplied roles and IDs
  // are never accepted. Existing accounts/passwords are never overwritten.
  const result=await authDb().prepare('INSERT INTO ecojoi_accounts (id,owner_id,email,name,password_hash,salt,disabled) VALUES (?,?,?,?,?,?,0) ON CONFLICT(email) DO NOTHING').bind(id,crypto.randomUUID(),email,name,hash,salt).run();
  if(!result.meta.changes)return json({error:'Este e-mail já está cadastrado.'},409);
  return json({id,name,email,role:'user',disabled:0},201);
 }catch{return json({error:'Não foi possível cadastrar. Confira a lista antes de tentar novamente.'},503);}
}
