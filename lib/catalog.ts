import source from './reference-catalog.json';
import previousCatalogue from './catalogue-compatibility.json';
import {ECOJOI_CATALOGUE,catalogueProduct} from './ecojoi-catalog';
export const ACTIVE_PRINTS = ["DIGITAL 360", "SILK 360", "SILK FRENTE E VERSO", "SILK", "PERSONALIZAÇÃO FRENTE", "SUBLIMAÇÃO"] as const;
export const PRINTS = ["SILK FRENTE", ...ACTIVE_PRINTS] as const;
export const ACTIVE_MODELS=ECOJOI_CATALOGUE.map(p=>p.model);
export const MODELS=[...new Set([...ACTIVE_MODELS,...source.palettes.map(p=>p.model),...previousCatalogue.palettes.map(p=>p.model)])].sort((a,b)=>a.localeCompare(b,'pt-BR'));
export function modelsFor(print:string,legacyModel?:string){const active=ECOJOI_CATALOGUE.filter(p=>p.prints.includes(print)||previousCatalogue.palettes.some(old=>old.model===p.model&&old.prints.includes(print))).map(p=>p.model);if(legacyModel&&!active.includes(legacyModel)&&[...source.palettes,...previousCatalogue.palettes].some(p=>p.model===legacyModel&&p.prints.includes(print)))active.push(legacyModel);return active;}
export function printsFor(existing?:{model:string;print:string}){return [...new Set([...ACTIVE_PRINTS,...(existing?[existing.print]:[])])];}
export function colorsFor(print:string,model:string){const active=catalogueProduct(model);const prior=previousCatalogue.palettes.find(p=>p.model===model&&p.prints.includes(print));if(active||prior)return [...new Set([...(active?.prints.includes(print)?active.colors:[]),...(prior?prior.indices.map(i=>previousCatalogue.names[i]):[])])];const p=source.palettes.find(p=>p.model===model&&p.prints.includes(print));return p?p.indices.map(i=>source.names[i]):[];}
export function displayColorsFor(print:string,model:string,selected?:string){const colors=colorsFor(print,model),seen=new Set<string>();return colors.filter(c=>{const key=c.toUpperCase();if(selected&&colors.includes(selected)&&key===selected.toUpperCase())return c===selected;if(seen.has(key))return false;seen.add(key);return true;});}
export function colorMaterial(name:string){
 const n=name.toUpperCase();
 const hex=n.includes('TIFANY')?'#27cbc3':n.includes('ROSA GOLD')||n.includes('ROSE GOLD')?'#c8907d':n.includes('BEBÊ')?(n.includes('AZUL')?'#9bcde9':'#f4b2c9'):n.includes('DOURADO')?'#c5a248':n.includes('PRATA')?'#bec3cc':n.includes('PÉROLA')?'#f3eada':n.includes('AMARELO')?'#e5ed25':n.includes('AZUL')?'#2068e6':n.includes('LARANJA')?'#ff7f28':n.includes('ROSA')?'#ec359a':n.includes('ROXO')?'#963fcd':n.includes('VERMELHO')?'#db293d':n.includes('VERDE ESCURO')?'#126747':n.includes('VERDE')?'#62d847':n.includes('PRETO')?'#15171a':n.includes('FUMÊ')?'#535763':'#f3f7f9';
 const gradient=n.includes('DEGRADÊ'),frosted=n.includes('FOSCO')||n==='EFEITO GELADO';
 const clear=['CRISTAL','TRANSPARENTE','TRANSLÚCIDO','EFEITO GELADO'].includes(n);
 const opacity=n.includes('OPACO')?1:clear?.22:gradient?.75:.65;
 return {name,hex,opacity,gradient,frosted,metallic:/DOURADO|PRATA|GOLD/.test(n),glitter:n.includes('BRILHANTES')};
}
// Labels and compatibility are observed. Display colors and material settings are estimates pending physical calibration.
const catalogueColors=[...new Set([...ECOJOI_CATALOGUE.flatMap(p=>p.colors),...previousCatalogue.names])].filter(n=>!source.names.includes(n));
function catalogueMaterial(name:string){const c=colorMaterial(name),n=name.toUpperCase();
 const extra:Record<string,string>={'PRETA':'#15171a','NATURAL':'#efe9d5','BEGE':'#c8b184','BEGE OPACO':'#c8b184','KRAFT':'#b38a54','AZUL MARINHO':'#152843','AZUL TIFFANY':'#27cbc3','AZUL CELESTE OPACO':'#46aadd','VERDE MILITAR':'#535c3d','VERDE PADRÃO':'#258e49','VERDE BANDEIRA':'#128c48','CINZA CHUMBO':'#51575b','MARROM':'#674630','MARROM OPACO':'#674630','VERMELHO ROSÊ':'#8e1f38'};
 return {...c,hex:extra[n]??c.hex,opacity:/NEON|CRISTAL|FUMÊ/.test(n)?c.opacity:1};
}
export const COLORS=[...source.names.map(colorMaterial),...catalogueColors.map(catalogueMaterial)];
export type Asset = {id:string;name:string;size:number;type:string};
export type Product = {id:string;print:string;model:string;color:string;art:Asset|null;artMode?:"logo"|"template";logoSize?:"small"|"medium"|"large"};
export type Design = {id:string;name:string;products:Product[];createdAt:number;updatedAt:number;expiresAt:number|null;revokedAt:number|null;token:string|null;version:number};
export function status(d:Design,now=Date.now()){return !d.token?"Rascunho":d.revokedAt?"Revogado":d.expiresAt && d.expiresAt>now?"Ativo":"Expirado";}
export function requirements(d:Design){return [d.name.trim().length>0,d.products.length>0,d.products.length>0&&d.products.every(p=>p.print&&p.model&&p.color),d.products.length>0&&d.products.every(p=>p.art)];}
export function formatDate(t:number|null){return t?new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo"}).format(t):"—";}


