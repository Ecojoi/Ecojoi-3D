"use client";
import {useEffect,useState} from 'react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {Slider} from '@/components/ui/slider';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {removeLightBackground} from '@/lib/artwork-background';

export default function ArtworkBackgroundDialog({file,onClose,onApply}:{file:File;onClose:()=>void;onApply:(file:File)=>Promise<boolean>}) {
 const [source,setSource]=useState<ImageData|null>(null),[original,setOriginal]=useState(''),[url,setUrl]=useState('');
 const [remove,setRemove]=useState(true),[tolerance,setTolerance]=useState(30),[all,setAll]=useState(false);
 const [result,setResult]=useState<File|null>(null),[working,setWorking]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[note,setNote]=useState('');
 useEffect(()=>{let cancelled=false;const originalUrl=URL.createObjectURL(file);setOriginal(originalUrl);
  (async()=>{const image=await createImageBitmap(file);try{if(image.width*image.height>16777216||Math.max(image.width,image.height)>8192)throw new Error('A imagem excede 16 megapixels ou 8192 pixels por lado. Reduza-a antes de enviar.');const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Não foi possível preparar a imagem.');ctx.drawImage(image,0,0);if(!cancelled)setSource(ctx.getImageData(0,0,canvas.width,canvas.height));}finally{image.close();}})().catch(e=>{if(!cancelled){setError((e as Error).message);setWorking(false);}});
  return()=>{cancelled=true;URL.revokeObjectURL(originalUrl);};
 },[file]);
 useEffect(()=>{if(!source)return;let cancelled=false,previewUrl='';setWorking(true);setResult(null);setError('');
  const timer=setTimeout(()=>{try{
   const processed=remove?removeLightBackground(source.data,source.width,source.height,tolerance,all):null;
   if(processed&&!processed.visible)throw new Error('A remoção apagou toda a arte. Diminua a intensidade ou desative a remoção.');
   setNote(remove?(processed!.removed?'O quadriculado indica as áreas transparentes.':'Nenhum fundo claro foi encontrado com este ajuste. Fundos coloridos ou quadriculados desenhados na imagem não são removidos por esta opção.'):'O fundo original será mantido no PNG.');
   const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Não foi possível preparar a imagem.');const output=ctx.createImageData(source.width,source.height);output.data.set(processed?.pixels||source.data);ctx.putImageData(output,0,0);
   canvas.toBlob(blob=>{if(cancelled)return;if(!blob||blob.size>15*1024*1024){setError('O PNG ultrapassa 15 MB ou não pôde ser gerado. Reduza a imagem.');setWorking(false);return;}previewUrl=URL.createObjectURL(blob);setUrl(previewUrl);setResult(new File([blob],file.name.replace(/\.[^.]+$/,'')+(remove?'-sem-fundo':'')+'.png',{type:'image/png'}));setWorking(false);},'image/png');
  }catch(e){if(!cancelled){setError((e as Error).message);setWorking(false);}}},100);
  return()=>{cancelled=true;clearTimeout(timer);if(previewUrl)URL.revokeObjectURL(previewUrl);};
 },[source,remove,tolerance,all,file.name]);
 const change=(fn:()=>void)=>{setWorking(true);setResult(null);fn();};
 return <Dialog open onOpenChange={open=>{if(!open&&!busy)onClose();}}><DialogContent className="artwork-background-dialog"><DialogHeader><DialogTitle>Preparar logo em PNG</DialogTitle><DialogDescription>Confira a transparência antes de aplicar no produto. O arquivo original no seu computador permanece intacto.</DialogDescription></DialogHeader>
  <label className="background-toggle"><Switch checked={remove} disabled={busy} onCheckedChange={v=>change(()=>setRemove(v))} aria-label="Remover fundo claro"/><span>Remover fundo claro</span></label>
  {remove&&<><Select value={all?'all':'edges'} disabled={busy} onValueChange={v=>change(()=>setAll(v==='all'))}><SelectTrigger aria-label="Área de remoção"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="edges">Fundo ligado às bordas</SelectItem><SelectItem value="all">Todos os tons claros, inclusive dentro da logo</SelectItem></SelectContent></Select><label className="field">Intensidade: {tolerance}<Slider aria-label="Intensidade da remoção" min={5} max={100} step={5} value={[tolerance]} disabled={busy} onValueChange={v=>change(()=>setTolerance(v[0]))}/></label></>}
  <div className="background-comparison"><figure><figcaption>Original</figcaption><div>{original&&<img src={original} alt="Arte original"/>}</div></figure><figure><figcaption>PNG para aplicar</figcaption><div>{!working&&!error&&url&&<img src={url} alt="Arte após preparação do fundo"/>}{working&&<span role="status">Preparando…</span>}</div></figure></div>
  {error?<p role="alert" className="login-error">{error}</p>:<p className="background-note" role="status">{note}</p>}
  <p className="background-note">Preserve os detalhes brancos que fazem parte da logo. Para QR Code, confira o contraste e a leitura na cor final do produto.</p>
  <DialogFooter><Button variant="outline" disabled={busy} onClick={onClose}>Cancelar</Button><Button className="primary" disabled={working||busy||!result} onClick={async()=>{if(!result)return;setBusy(true);try{if(await onApply(result))onClose();else setError('Não foi possível anexar. Tente novamente.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>{busy?'Enviando…':'Aplicar PNG'}</Button></DialogFooter>
 </DialogContent></Dialog>;
}
