export async function renderPdfArtwork(file:File,pageNumber:number,signal:AbortSignal){
 const pdfjs=await import('pdfjs-dist');
 if(signal.aborted)throw new DOMException('Cancelado','AbortError');
 const base=`/pdfjs/${pdfjs.version}/`;
 pdfjs.GlobalWorkerOptions.workerSrc=base+'pdf.worker.min.mjs';
 const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),cMapUrl:base+'cmaps/',cMapPacked:true,standardFontDataUrl:base+'standard_fonts/',wasmUrl:base+'wasm/'});
 const abort=()=>{void task.destroy();};signal.addEventListener('abort',abort,{once:true});
 try{
  if(signal.aborted)throw new DOMException('Cancelado','AbortError');
  const doc=await task.promise;
  if(!Number.isInteger(pageNumber)||pageNumber<1||pageNumber>doc.numPages)throw Error('Escolha uma página válida.');
  const page=await doc.getPage(pageNumber),natural=page.getViewport({scale:1});
  const scale=Math.min(300/72,4096/Math.max(natural.width,natural.height));
  const viewport=page.getViewport({scale});
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.floor(viewport.width));canvas.height=Math.max(1,Math.floor(viewport.height));
  const canvasContext=canvas.getContext('2d',{alpha:true})!;
  await page.render({canvas,canvasContext,viewport,background:'rgba(0,0,0,0)'}).promise;
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Não foi possível converter a página.')),'image/png'));
  if(signal.aborted)throw new DOMException('Cancelado','AbortError');
  if(blob.size>15*1024*1024)throw Error('A página convertida excede 15 MB. Reduza a complexidade do PDF.');
  return {file:new File([blob],file.name.replace(/\.pdf$/i,'')+`-pagina-${pageNumber}.png`,{type:'image/png'}),pages:doc.numPages};
 }catch(e){
  if((e as Error).name==='PasswordException')throw Error('Este PDF está protegido por senha. Envie uma cópia sem proteção.');
  if((e as Error).name==='InvalidPDFException')throw Error('Não foi possível ler este PDF. Confira o arquivo e tente novamente.');
  throw e;
 }finally{signal.removeEventListener('abort',abort);await task.destroy();}
}
