import { headers } from "next/headers";
import { env } from "cloudflare:workers";
export const COOKIE="__Host-ecojoi_session";
export const authDb=()=> (env as unknown as {DB:D1Database}).DB;
export const digest=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))),v=>v.toString(16).padStart(2,"0")).join("");
export async function passwordHash(password:string,salt:string){
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
 return Array.from(new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:new TextEncoder().encode(salt),iterations:100000},key,256)),v=>v.toString(16).padStart(2,"0")).join("");
}
export function equal(a:string,b:string){let different=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)different|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return different===0;}
export async function getEcojoiUser(){
 const h=await headers();const token=h.get("cookie")?.split(";").map(s=>s.trim()).find(s=>s.startsWith(COOKIE+"="))?.slice(COOKIE.length+1);
 if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
 return authDb().prepare("SELECT a.owner_id AS userId,a.email,a.name AS displayName,a.id AS accountId FROM ecojoi_sessions s JOIN ecojoi_accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>? AND a.disabled=0").bind(await digest(token),Date.now()).first<{userId:string;email:string;displayName:string;accountId:string}>();
}
export async function newSession(accountId:string){
 const token=crypto.randomUUID().replaceAll("-","")+crypto.randomUUID().replaceAll("-","");
 await authDb().prepare("INSERT INTO ecojoi_sessions (token_hash,account_id,expires_at) VALUES (?,?,?)").bind(await digest(token),accountId,Date.now()+28800000).run();
 return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`;
}
