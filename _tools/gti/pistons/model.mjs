export const SPEC=Object.freeze({stroke:92.8,rod:144,r:46.4,phases:[0,180,180,0],centres:[-144,-48,48,144],shaftZ:96});
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const smooth=(v)=>{v=clamp(v);return v*v*(3-2*v)};
export function pose(degrees=35,apart=0){
 const a=degrees*Math.PI/180;
 return SPEC.centres.map((x,i)=>{
  const t=a+SPEC.phases[i]*Math.PI/180,y=SPEC.r*Math.sin(t),z=SPEC.shaftZ+SPEC.r*Math.cos(t);
  const pinZ=z+Math.sqrt(SPEC.rod**2-y**2),phi=Math.asin(-y/SPEC.rod);
  return {x,i,t,y,z,pinZ,phi,fromTDC:SPEC.shaftZ+SPEC.r+SPEC.rod-pinZ,
   clip:smooth(apart/.2),pin:smooth((apart-.15)/.25),lift:smooth((apart-.4)/.25)*70,
   rings:smooth((apart-.65)/.35)};
 });
}
