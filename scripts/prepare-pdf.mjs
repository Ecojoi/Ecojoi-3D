import {mkdir,copyFile,cp,readFile} from 'node:fs/promises';
const source=new URL('../node_modules/pdfjs-dist/',import.meta.url);
const {version}=JSON.parse(await readFile(new URL('package.json',source),'utf8'));
const target=new URL(`../public/pdfjs/${version}/`,import.meta.url);
await mkdir(target,{recursive:true});
await copyFile(new URL('build/pdf.worker.min.mjs',source),new URL('pdf.worker.min.mjs',target));
for(const folder of ['cmaps','standard_fonts','wasm'])await cp(new URL(folder,source),new URL(folder,target),{recursive:true});
await copyFile(new URL('LICENSE',source),new URL('LICENSE',target));
