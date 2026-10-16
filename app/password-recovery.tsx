"use client";

import {useState,type FormEvent} from "react";
import {KeyRound,Loader2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";

export default function PasswordRecovery({mode,token=""}:{mode:"request"|"confirm";token?:string}){
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [confirmation,setConfirmation]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 async function submit(event:FormEvent){
  event.preventDefault();
  setError("");
  if(mode==="confirm"&&password!==confirmation){setError("As senhas não coincidem.");return;}
  if(mode==="confirm"&&!/^[a-f0-9]{64}$/.test(token)){setError("Link inválido ou expirado. Solicite outro.");return;}
  setBusy(true);
  try{
   const response=await fetch(mode==="request"?"/api/auth/reset/request":"/api/auth/reset/confirm",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(mode==="request"?{email}:{token,password}),
   });
   const data=await response.json() as {error?:string;message?:string};
   if(!response.ok)throw new Error(data.error||"Não foi possível concluir.");
   setSuccess(data.message||"Solicitação concluída.");
   setPassword("");
   setConfirmation("");
  }catch(cause){
   setError((cause as Error).message);
  }finally{setBusy(false);}
 }
 const request=mode==="request";
 const validToken=/^[a-f0-9]{64}$/.test(token);
 return <main className="ecojoi-login">
  <div className="login-brand"><img className="login-identity" src="/brand/ecojoi-identidade.jpeg" width={590} height={340} alt="ECOJOI — Seja eco com ECOJOI"/><strong className="login-studio-title">Studio 3D</strong></div>
  <section className="login-card">
   <div className="login-symbol"><KeyRound size={24}/></div>
   <h1>{request?"Esqueceu sua senha?":"Redefinir senha"}</h1>
   <p>{request?"Informe o e-mail da sua conta. Enviaremos um link válido por 20 minutos.":"Crie uma nova senha com pelo menos 12 caracteres."}</p>
   {success?<p className="user-success" role="status">{success}</p>:
    <form onSubmit={submit}>
     {request?<label className="field">E-mail<Input type="email" required maxLength={254} autoComplete="email" placeholder="voce@ecojoi.com.br" value={email} disabled={busy} onChange={event=>setEmail(event.target.value)}/></label>:
     <><label className="field">Nova senha<Input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={password} disabled={busy} onChange={event=>setPassword(event.target.value)}/></label><label className="field">Confirmar nova senha<Input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={confirmation} disabled={busy} onChange={event=>setConfirmation(event.target.value)}/></label></>}
     {error&&<p className="login-error" role="alert">{error}</p>}
     <Button type="submit" className="primary login-submit" disabled={busy||(!request&&!validToken)}>{busy?<><Loader2 size={18} className="spin"/>Aguarde…</>:request?"Enviar link de recuperação":"Salvar nova senha"}</Button>
    </form>}
   {(!request&&!validToken)&&<p className="login-error" role="alert">O link está incompleto. Solicite um novo e-mail de recuperação.</p>}
   <p className="login-help"><a href="/login">Voltar ao login</a>{!request&&<> · <a href="/esqueci-senha">Solicitar outro link</a></>}</p>
  </section>
  <footer>ECOJOI · Amostras virtuais 3D</footer>
 </main>;
}
