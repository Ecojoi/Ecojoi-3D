import type {Design} from './catalog';
// The API reconstructs product objects and enriches asset metadata. Neither
// property order nor read-only metadata is a user edit.
export function designSignature(d:Pick<Design,'name'|'products'>){
 return JSON.stringify([d.name,d.products.map(p=>[p.id,p.print,p.model,p.color,p.art?.id??null,p.artMode??'logo',p.logoSize??'large'])]);
}
