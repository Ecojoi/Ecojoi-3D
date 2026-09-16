import source from './reference-catalog.json';
export const PRINTS = ["DIGITAL 360", "SILK 360", "SILK FRENTE", "SILK FRENTE E VERSO"] as const;
export const MODELS=source.palettes.map(p=>p.model).sort((a,b)=>a.localeCompare(b,'pt-BR'));
export const LEGACY_MODELS=["COPO ECOLOGIC 300 ML","COPO ECOLOGIC 400 ML","COPO ECOLOGIC 500 ML","COPO ECOLOGIC 600 ML","COPO WHISKY","GARRAFA WATER BIO","LONG DRINK","SHOT","TAÇA DE GIN","TAÇA DE VINHO 400 ML","Taça Premium 2.0","TAÇA PRIME","TULIPA","TWISTER 600 ML","USUAL DRINK 400 ML","BALDE ECOLOGIC 5 L","CANECA DE CHOPP 300 ML","CANECA DE CHOPP 500 ML"] as const;
export function modelsFor(print:string){return MODELS.filter(m=>source.palettes.find(p=>p.model===m)?.prints.includes(print));}
export function colorsFor(print:string,model:string){const p=source.palettes.find(p=>p.model===model&&p.prints.includes(print));return p?p.indices.map(i=>source.names[i]):[];}
export function colorMaterial(name:string){
 const n=name.toUpperCase();
 const hex=n.includes('TIFFANY')||n.includes('TIFANY')?'#27cbc3':n.includes('MARINHO')?'#18345f':n.includes('MILITAR')?'#59663f':n.includes('BANDEIRA')?'#168345':n.includes('VERDE PADRÃO')?'#36a852':n.includes('CINZA')?'#4f555d':n.includes('KRAFT')?'#a98253':n==='NATURAL'?'#d9c6a3':n==='BEGE'||n.includes('BEGE OPACO')?'#d3bc8b':n.includes('MARROM')?'#5b3a29':n.includes('DOURADO')?'#c5a248':n.includes('PRATA')?'#bec3cc':n.includes('AMARELO')?'#e5ed25':n.includes('AZUL')?'#2068e6':n.includes('LARANJA')?'#ff7f28':n.includes('ROSA')?'#ec359a':n.includes('ROXO')?'#963fcd':n.includes('VERMELHO')?'#db293d':n.includes('VERDE')?'#62d847':n.includes('PRETO')?'#15171a':n.includes('FUMÊ')?'#535763':'#f3f7f9';
 const opaque=/OPACO|BRANCO$|PRETO$|KRAFT|NATURAL|BEGE$|MARROM$|MARINHO|MILITAR|PADRÃO|BANDEIRA|DOURADO|PRATA/.test(n);
 const clear=n==='CRISTAL';
 const translucent=!opaque&&(clear||/NEON|FUMÊ|VERMELHO$/.test(n));
 const opacity=opaque?1:clear?.18:translucent?.52:.78;
 return {name,hex,opacity,gradient:false,frosted:false,metallic:/DOURADO|PRATA/.test(n),glitter:false};
}
export const COLORS=source.names.map(colorMaterial);
export type Asset = {id:string;name:string;size:number;type:string};
export type Product = {id:string;print:string;model:string;color:string;art:Asset|null;artMode?:"logo"|"template";logoSize?:"small"|"medium"|"large"};
export type Design = {id:string;name:string;products:Product[];createdAt:number;updatedAt:number;expiresAt:number|null;revokedAt:number|null;token:string|null;version:number};
export function status(d:Design,now=Date.now()){return !d.token?"Rascunho":d.revokedAt?"Revogado":d.expiresAt && d.expiresAt>now?"Ativo":"Expirado";}
export function requirements(d:Design){return [d.name.trim().length>0,d.products.length>0,d.products.length>0&&d.products.every(p=>p.print&&p.model&&p.color),d.products.length>0&&d.products.every(p=>p.art)];}
export function formatDate(t:number|null){return t?new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo"}).format(t):"—";}
