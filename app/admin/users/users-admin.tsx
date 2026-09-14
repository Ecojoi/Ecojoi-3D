"use client";
import {useState,useEffect,type FormEvent} from 'react';
import {ArrowLeft,Users,Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
type User={id:string;name:string;email:string;role:'admin'|'user';disabled:number};
export default function UsersAdmin(){
 const [users,setUsers]=useState<User[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('');
 async function load(){
  setLoading(true);try{const r=await fetch('/api/admin/users',{cache:'no-store'});const b=await r.json() as User[] & {error?:string};if(!r.ok)throw Error(b.error||"Não foi possível carregar os usuários.");setUsers(b);setError('');}catch(e){setError((e as Error).message||'Não foi possível carregar os usuários.');}finally{setLoading(false);}
 }
 useEffect(()=>{void load();},[]);
 async function create(e:FormEvent){
  e.preventDefault();setError('');setSuccess('');
  if(password!==confirmation){setError('As senhas não coincidem.');return;}
  setBusy(true);
  try{
   const r=await fetch('/api/admin/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,password})});const b=await r.json() as User & {error?:string};
   if(!r.ok)throw Error(b.error||'Não foi possível cadastrar.');
   setUsers(prev=>[...prev,b].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')));
   setSuccess(`Usuário ${b.name} cadastrado. Ele já pode entrar com o e-mail ${b.email} e a senha definida.`);
   setName('');setEmail('');setPassword('');setConfirmation('');
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <main className="users-admin"><a className="back-link" href="/"><ArrowLeft size={16}/>Voltar aos designs</a><header><span className="brand-icon"><Users size={22}/></span><div><h1>Usuários</h1><p>Administração de acesso ao ECOJOI Studio 3D.</p></div></header>{error&&<div className="error-banner" role="alert">{error}</div>}{success&&<p className="user-success" role="status">{success}</p>}<div className="users-columns"><section className="panel"><h2>Cadastrar usuário</h2><p>Defina os dados de acesso e compartilhe a senha diretamente com o usuário. Não há envio automático de e-mail.</p><form onSubmit={create}><label className="field">Nome<Input value={name} onChange={e=>setName(e.target.value)} required maxLength={120} autoComplete="off" disabled={busy}/></label><label className="field">E-mail<Input value={email} onChange={e=>setEmail(e.target.value)} type="email" required maxLength={254} autoComplete="off" disabled={busy}/></label><label className="field">Senha inicial<Input value={password} onChange={e=>setPassword(e.target.value)} type="password" required minLength={12} maxLength={128} autoComplete="new-password" disabled={busy}/><small>No mínimo 12 caracteres. O usuário pode alterá-la depois de entrar.</small></label><label className="field">Confirmar senha<Input value={confirmation} onChange={e=>setConfirmation(e.target.value)} type="password" required minLength={12} maxLength={128} autoComplete="new-password" disabled={busy}/></label><Button className="primary" disabled={busy||loading} type="submit">{busy?<><Loader2 size={16} className="spin"/>Cadastrando…</>:'Cadastrar usuário'}</Button></form></section><section className="panel"><div className="section-heading"><h2>Usuários cadastrados</h2><Button variant="outline" onClick={()=>void load()} disabled={loading||busy}>Atualizar</Button></div>{loading?<p role="status">Carregando usuários…</p>:<ul className="users-list">{users.map(user=><li key={user.id}><strong>{user.name}</strong><span>{user.email}</span><small>{user.role==='admin'?'Administrador':'Usuário'} · {user.disabled?'Inativo':'Ativo'}</small></li>)}</ul>}</section></div></main>;
}
