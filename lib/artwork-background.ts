/** Remove a solid light background without resampling or changing dark artwork. */
export function removeLightBackground(source: Uint8ClampedArray, width: number, height: number, tolerance = 30, all = false) {
 const count = width * height;
 if (!Number.isInteger(count) || count < 1 || source.length !== count * 4) throw new Error('Imagem inválida.');
 const pixels = new Uint8ClampedArray(source), mask = new Uint8Array(count);
 const limit = Math.max(0, Math.min(100, tolerance));
 const matches = (n: number) => { const i=n*4; return source[i+3]===0 || Math.min(source[i],source[i+1],source[i+2])>=255-limit; };
 if (all) { for(let n=0;n<count;n++) if(matches(n)) mask[n]=1; }
 else {
  const queue=new Uint32Array(count);let head=0,tail=0;
  const add=(n:number)=>{if(!mask[n]&&matches(n)){mask[n]=1;queue[tail++]=n;}};
  for(let x=0;x<width;x++){add(x);add((height-1)*width+x);}
  for(let y=0;y<height;y++){add(y*width);add(y*width+width-1);}
  while(head<tail){const n=queue[head++],x=n%width;if(x>0)add(n-1);if(x<width-1)add(n+1);if(n>=width)add(n-width);if(n<count-width)add(n+width);}
 }
 let removed=0,visible=0;
 for(let n=0;n<count;n++){const i=n*4;if(mask[n]){if(pixels[i+3])removed++;pixels[i+3]=0;}else if(pixels[i+3])visible++;}
 return {pixels,removed,visible};
}
