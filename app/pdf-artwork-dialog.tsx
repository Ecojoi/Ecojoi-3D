"use client";
import {useEffect,useState} from 'react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {renderPdfArtwork} from '@/lib/pdf-artwork';
export default function PdfArtworkDialog({file,onClose,onApply}:{file:File;onClose:()=>void;onApply:(file:File)=>Promise<boolean>}){
 const [page,setPage]=useState(1),[pages,setPages]=useState(0),[result,setResult]=useState<File|null>(null),[url,setUrl]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();let objectUrl='';setLoading(true);setResult(null);setUrl('');setError('');
  renderPdfArtwork(file,page,controller.signal).then(r=>{if(controller.signal.aborted)return;objectUrl=URL.createObjectURL(r.file);setUrl(objectUrl);setResult(r.file);setPages(r.pages);}).catch(e=>{if(!controller.signal.aborted)setError((e as Error).message||'Não foi possível abrir o PDF.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[file,page]);
 return <Dialog open onOpenChange={open=>{if(!open&&!busy)onClose();}}><DialogContent className="pdf-import-dialog"><DialogHeader><DialogTitle>Importar arte em PDF</DialogTitle><DialogDescription>Confira a página antes de aplicar. Ela será salva como PNG para a visualização 3D. O PDF original permanece no seu computador.</DialogDescription></DialogHeader><p className="pdf-file-name">{file.name}</p>{pages>1&&<label className="field">Página (1 a {pages})<Input type="number" min={1} max={pages} value={page} disabled={busy} onChange={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=1&&n<=pages)setPage(n);}}/></label>}{loading?<p role="status">Preparando a página…</p>:error?<p className="login-error" role="alert">{error}</p>:<div className="pdf-import-preview"><img src={url} alt={`Prévia da página ${page} do PDF`}/></div>}<p className="pdf-import-note">Use a arte final, sem cotas ou linhas de gabarito. Na próxima etapa, confira e remova o fundo claro antes de aplicar.</p><DialogFooter><Button variant="outline" disabled={busy} onClick={onClose}>Cancelar</Button><Button className="primary" disabled={loading||!result||busy} onClick={async()=>{if(!result)return;setBusy(true);setError('');try{if(await onApply(result))onClose();else setError('Não foi possível anexar. Confira a conexão e tente novamente. Sua página permanece pronta para envio.');}catch(e){setError((e as Error).message||'Falha no envio. Tente novamente.');}finally{setBusy(false);}}}>{busy?'Enviando…':`Usar página ${page}`}</Button></DialogFooter></DialogContent></Dialog>;
}
