import source from './reference-catalog.json';
export const PRINTS = ["DIGITAL 360", "SILK 360", "SILK FRENTE E VERSO"] as const;
export const MODELS=source.palettes.map(p=>p.model).sort((a,b)=>a.localeCompare(b,'pt-BR'));
export function modelsFor(print:string){return MODELS.filter(m=>source.palettes.find(p=>p.model===m)?.prints.includes(print));}
export function colorsFor(print:string,model:string){const p=source.palettes.find(p=>p.model===model&&p.prints.includes(print));return p?p.indices.map(i=>source.names[i]):[];}
export function colorMaterial(name:string){
 const n=name.toUpperCase();
 const hex=n.includes('TIFANY')?'#27cbc3':n.includes('ROSA GOLD')||n.includes('ROSE GOLD')?'#c8907d':n.includes('BEBÊ')?(n.includes('AZUL')?'#9bcde9':'#f4b2c9'):n.includes('DOURADO')?'#c5a248':n.includes('PRATA')?'#bec3cc':n.includes('PÉROLA')?'#f3eada':n.includes('AMARELO')?'#e5ed25':n.includes('AZUL')?'#2068e6':n.includes('LARANJA')?'#ff7f28':n.includes('ROSA')?'#ec359a':n.includes('ROXO')?'#963fcd':n.includes('VERMELHO')?'#db293d':n.includes('VERDE ESCURO')?'#126747':n.includes('VERDE')?'#62d847':n.includes('PRETO')?'#15171a':n.includes('FUMÊ')?'#535763':'#f3f7f9';
 const gradient=n.includes('DEGRADÊ'),frosted=n.includes('FOSCO')||n==='EFEITO GELADO';
 const clear=['CRISTAL','TRANSPARENTE','TRANSLÚCIDO','EFEITO GELADO'].includes(n);
 const opacity=n.includes('OPACO')?1:clear?.22:gradient?.75:.65;
 return {name,hex,opacity,gradient,frosted,metallic:/DOURADO|PRATA|GOLD/.test(n),glitter:n.includes('BRILHANTES')};
}
// Labels and compatibility are observed. Display colors and material settings are estimates pending physical calibration.
export const COLORS=source.names.map(colorMaterial);
export type Asset = {id:string;name:string;size:number;type:string};
export type Product = {id:string;print:string;model:string;color:string;art:Asset|null;artMode?:"logo"|"template"};
export type Design = {id:string;name:string;products:Product[];createdAt:number;updatedAt:number;expiresAt:number|null;revokedAt:number|null;token:string|null;version:number};
export function status(d:Design,now=Date.now()){return !d.token?"Rascunho":d.revokedAt?"Revogado":d.expiresAt && d.expiresAt>now?"Ativo":"Expirado";}
export function requirements(d:Design){return [d.name.trim().length>0,d.products.length>0,d.products.length>0&&d.products.every(p=>p.print&&p.model&&p.color),d.products.length>0&&d.products.every(p=>p.art)];}
export function formatDate(t:number|null){return t?new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo"}).format(t):"—";}


