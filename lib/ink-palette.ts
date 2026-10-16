export function inkKey(r:number,g:number,b:number){return (r>>4)*256+(g>>4)*16+(b>>4);}
export function analyzeInks(data:Uint8ClampedArray){
 const bins=new Map<number,{count:number;r:number;g:number;b:number}>();
 for(let i=0;i<data.length;i+=4){if(data[i+3]<16)continue;const key=inkKey(data[i],data[i+1],data[i+2]);const bin=bins.get(key)||{count:0,r:0,g:0,b:0};bin.count++;bin.r+=data[i];bin.g+=data[i+1];bin.b+=data[i+2];bins.set(key,bin);}
 return [...bins.entries()].sort((a,b)=>b[1].count-a[1].count||a[0]-b[0]).slice(0,4).map(([key,v])=>({key,color:'#'+[v.r,v.g,v.b].map(c=>Math.round(c/v.count).toString(16).padStart(2,'0')).join('')}));
}
// Excess source colors always use slot zero, the most frequent original ink.
export function applyInks(data:Uint8ClampedArray,keys:number[],colors:string[]){
 const rgb=colors.map(c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)));
 for(let i=0;i<data.length;i+=4){if(!data[i+3])continue;const index=keys.indexOf(inkKey(data[i],data[i+1],data[i+2]));const c=rgb[index<0?0:index]||rgb[0];if(c){data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];}}
}
