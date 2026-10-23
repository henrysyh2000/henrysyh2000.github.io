// Only stroke and the research-engine rod reference drive the kinematics.
// All other dimensions below define an illustrative solid teaching reconstruction.
export function makeGeometry(k,G,A=null,orders=null){
 const W=1000,H=650,base={x:-260,y:-68,w:520,d:136,r:10};
 const P=k.fitProjection([...k.boxCorners(base,-8,14),[-265,0,430],[300,0,430]],W,H,{pad:44,azimuth:64,elevation:25});
 const at=p=>k.iso(p,P),SLOT=['fill','s0','s1','s2','s3','top','crease','outline'];
 const fmt=n=>Number(n.toFixed(3));
 const wrap=(paths,tone='mid')=>`<g class="iso-solid"><path class="iso-fill" d="${paths.fill||''}"/>${[0,1,2,3].map(i=>`<path class="iso-shade" data-shade="${i}" d="${paths.shades?.[i]||''}"/>`).join('')}<path class="iso-top" d="${paths.top||''}"/><path class="iso-line iso-crease" data-tone="faint" d="${paths.crease||''}"/><path class="iso-line iso-edge" data-tone="${tone}" d="${paths.outline||''}"/></g>`;
 function ringPaths(a,b,ri,ro,F,P,options={}){const front=G.dot3(F.a,G.viewOf(P))>=0?b:a;return G.lathe([[a,ri],[a,ro],[b,ro],[b,ri],[a,ri]],F,P,{...options,hole:[front,ri],fill:'hull'});}
 const cached=new Map();
 const smoothLocal=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
 const raw=(id,paths,shape,tone,group,centre,move=[0,0,0],decoration='')=>({id,paths,shape,tone,group,centre:centre.map((v,i)=>v+move[i]),move,svg:wrap(paths,tone)+decoration});
 function solid(id,paths,shape,tone,group,centre,move,decoration){return raw(id,paths,shape,tone,group,centre,move,decoration)}
 function fixed(id,fn,move=[0,0,0]){if(!cached.has(id))cached.set(id,fn());const p=cached.get(id);return {...p,move,centre:p.centre.map((v,i)=>v+move[i])}}
 const Fz=(x=0,y=0,z=0)=>G.frameAlong([x,y,z],[0,0,1]);
 const Fx=(x=0,y=0,z=0)=>G.frameAlong([x,y,z],[1,0,0]);
 function disc(id,F,a,b,r,tone,group,move=[0,0,0]){return fixed(id,()=>solid(id,G.disc(a,b,r,F,P,{steps:56}),A?.disc(F,a,b,r),tone,group,G.pointOf(F,(a+b)/2,0,0)),move)}
 function ringPieces(id,F,a,b,ri,ro,tone,group,move=[0,0,0],ends=[true,true]){
  const V=G.viewOf(P),L=G.lightOf(P),near=G.angleToward(F,V),pieces=[];
  for(const [label,start] of [['near',near-Math.PI/2],['far',near+Math.PI/2]]){
   const n=56,ts=Array.from({length:n+1},(_,i)=>start+Math.PI*i/n),poly=[...ts.map(t=>[ro*Math.cos(t),ro*Math.sin(t)]),...ts.slice().reverse().map(t=>[ri*Math.cos(t),ri*Math.sin(t)])],buckets=[[],[],[],[],[]];
   const front=G.dot3(F.a,V)>=0?b:a,back=front===b?a:b;
   const caps=poly.map(([u,v])=>at([F.o[0]+F.a[0]*front+F.u[0]*u+F.v[0]*v,F.o[1]+F.a[1]*front+F.u[1]*u+F.v[1]*v,F.o[2]+F.a[2]*front+F.u[2]*u+F.v[2]*v]));
   if(ends[front===b?1:0])buckets[G.bandOf(G.dot3(G.mul3(F.a,front===b?1:-1),L))].push(k.pathOf(caps,true));
   let outline='';
   for(const [radius,sign] of [[ro,1],[ri,-1]]){
    if(ends[front===b?1:0])outline+=k.pathOf(ts.map(t=>at(G.pointOf(F,front,radius,t))));
    let run=[];const flush=()=>{if(run.length>1&&ends[back===b?1:0])outline+=k.pathOf(run);run=[]};
    for(let j=0;j<n;j++){
     const t=(ts[j]+ts[j+1])/2,normal=G.mul3(G.radialOf(F,t),sign),visible=G.dot3(normal,V)>0;
     if(visible){const q=[G.pointOf(F,a,radius,ts[j]),G.pointOf(F,a,radius,ts[j+1]),G.pointOf(F,b,radius,ts[j+1]),G.pointOf(F,b,radius,ts[j])].map(at);buckets[G.bandOf(G.dot3(normal,L))].push(k.pathOf(q,true));if(!run.length)run.push(at(G.pointOf(F,back,radius,ts[j])));run.push(at(G.pointOf(F,back,radius,ts[j+1])))}else flush();
    }flush();
   }
   const paths={fill:'',shades:buckets.slice(0,4).map(v=>v.join('')),top:buckets[4].join(''),crease:'',outline};
   const mid=start+Math.PI/2,rad=(ri+ro)/Math.PI;
   pieces.push(solid(id+'.'+label,paths,A?.prism(F,poly,a,b),tone,group,G.pointOf(F,(a+b)/2,rad,mid),move));
  }return pieces;
 }
 function ring(id,F,a,b,ri,ro,tone,group,move=[0,0,0],ends=[true,true]){return ['near','far'].map((label,i)=>fixed(id+'.'+label,()=>ringPieces(id,F,a,b,ri,ro,tone,group,[0,0,0],ends)[i],move));}
 function prism(id,F,poly,a,b,tone,group,decoration=''){return solid(id,G.prismOf(F,poly,a,b,P),A?.prism(F,poly,a,b),tone,group,G.pointOf(F,(a+b)/2,0,0),[0,0,0],decoration)}
 function slab(id,plan,z,h,tone='lo',group='fixture'){return fixed(id,()=>solid(id,k.slabOf(plan,z,h,P,8,1),A?.slab(plan,z,h,{},8),tone,group,[plan.x+plan.w/2,plan.y+plan.d/2,z+h/2]))}
 const arcSector=(ri,ro,a,b,n=60)=>[...Array.from({length:n+1},(_,i)=>{const t=a+(b-a)*i/n;return [ro*Math.cos(t),ro*Math.sin(t)]}),...Array.from({length:n+1},(_,i)=>{const t=b-(b-a)*i/n;return[ri*Math.cos(t),ri*Math.sin(t)]})];
 function skirt(id,x,a,b,move){return fixed(id,()=>{
  const poly=arcSector(35.6,39.2,a,b).map(([u,v])=>[x+u,v]);
  return solid(id,k.extrude(poly,-18,28,P,{convex:false}),A?.extruded(poly,-18,28),'hi','piston',[x,0,-4]);
 },move)}
 function ringsFor(x,i,pz,lift,apart){
  const out=[],F=Fz(x);const defs=[[24.15,25.25,'top'],[19.8,21,'second'],[13.3,14.75,'oil']];
  for(const [j,[a,b,name]] of defs.entries()){
   const n=apart,shift=(3-j)*29*smoothLocal((n-.3)/.7),ex=2.5*smoothLocal(n/.3);
   const id=`p${i}.ring.${name}`;
   // Ring opening precedes axial separation; at a minimum the bore clears the lands.
   out.push(...(apart===0?ring(id,F,a,b,38.55,39.7,'lo','rings',[0,0,pz+lift]):ringPieces(id,F,a,b,38.55+ex,39.7+ex,'lo','rings',[0,0,pz+lift+shift])));
   if(name==='oil'){
    for(const [q,level] of [[0,a+.15],[1,b-.35]])out.push(...(apart===0?ring(`${id}.rail.${q}`,F,level,level+.2,39.71,39.95,'mid','rings',[0,0,pz+lift]):ringPieces(`${id}.rail.${q}`,F,level,level+.2,39.71+ex,39.95+ex,'mid','rings',[0,0,pz+lift+shift])));
   }
  }return out;
 }
 function piston(p,apart){
  const {x,i,pinZ}=p,a=i===3?apart:0,lift=i===3?p.lift:0,m=[0,0,pinZ+lift],out=[];
  out.push(skirt(`p${i}.skirt.back`,x,Math.PI*1.15,Math.PI*1.85,m));
  for(const [j,[lo,hi]] of [[0,[10,13.25]],[1,[14.8,19.75]],[2,[21.05,24.1]],[3,[25.3,26.5]]])out.push(ring(`p${i}.land.${j}`,Fz(x),lo,hi,33.2,39.2,'hi','piston',m));
  for(const [j,[lo,hi]] of [[0,[-33.8,-15.5]],[1,[15.5,33.8]]])out.push(ring(`p${i}.boss.${j}`,Fx(x),lo,hi,7.10,12,'hi','pin',m));
  out.push(skirt(`p${i}.skirt.front`,x,Math.PI*.15,Math.PI*.85,m));
  out.push(disc(`p${i}.crown`,Fz(x),26.5,29,39.2,'hi','piston',m));
  // Crown bowl/valve-relief surface engraving, deliberately not a production dimension.
  out.push(fixed(`p${i}.crown.detail`,()=>{
    const F=Fz(x),d=G.circleOf(F,29.02,22,P),relief=[];
    for(const [dx,dy] of [[-18,-15],[18,-15],[-18,15],[18,15]])relief.push(`<path class="crown-relief" d="${G.circleOf(Fz(x+dx,dy),29.03,7.5,P)}"/>`);
    return {id:`p${i}.crown.detail`,paths:null,shape:null,tone:'hi',group:'piston',centre:[x,0,29.1],move:[0,0,0],svg:`<path class="crown-dish" d="${d}"/>${relief.join('')}`};
  },m));
  const pm=[i===3?p.pin*109:0,0,pinZ];
  // Full pin passes through actual annular eyes; its bore is hollow.
  for(const [j,[lo,hi]] of [[-34.6,-33.8],[-33.8,-15.5],[-15.5,-7],[-7,7],[7,15.5],[15.5,33.8],[33.8,34.6]].entries())out.push(ring(`p${i}.pin.${j}`,Fx(x),lo,hi,4.4,7.05,'mid','pin',pm,[lo===-34.6,hi===34.6]));
  for(const side of [-1,1])out.push(ring(`p${i}.clip.${side}`,Fx(x),side<0?-35:-0+34.5,side<0?-34.5:35,6.7,7.4,'lo','pin',[(i===3?side*p.clip*62:0),(i===3?p.clip*36:0),pinZ]));
  out.push(...ringsFor(x,i,pinZ,lift,i===3?p.rings:0));
  return out;
 }
 function rod(p){
  const {x,i,y,z,pinZ}=p,dy=-y,dz=pinZ-z,L=Math.hypot(dy,dz),v=[0,dy/L,dz/L],u=[0,v[2],-v[1]],F=G.frameOf([x,y,z],[1,0,0],u,v),out=[];
  // Continuous I-beam body. Its arc-shaped ends land on the annular eyes.
  const poly=[[-8,27.7],[-8.5,38],[-6,105],[-8,130.3],[8,130.3],[6,105],[8.5,38],[8,27.7]];
  out.push(prism(`r${i}.beam`,F,poly,-6,6,'mid','rod'));
  const inset=[[-4.6,34],[-3.7,40],[-3,104],[-4.2,126],[4.2,126],[3,104],[3.7,40],[4.6,34]];
  const face=inset.map(([a,b])=>G.pointOf(F,6.03,Math.hypot(a,b),Math.atan2(b,a)));
  out.push({id:`r${i}.recess`,paths:null,shape:null,group:'rod',centre:[x+6.03,(y+0)/2,(z+pinZ)/2],move:[0,0,0],svg:`<path class="rod-recess" d="${k.pathOf(face.map(at),true)}"/>`});
  out.push(ring(`r${i}.big`,Fx(x),-9,9,22.05,29,'mid','rod',[0,y,z]));
  out.push(ring(`r${i}.small`,Fx(x),-7,7,7.10,14,'mid','rod',[0,0,pinZ]));
  // Split line and bolt counterbores are on the big-end's front face.
  const boltPoints=[[-24,-5],[24,-5]].map(([a,b])=>G.pointOf(F,9.05,Math.hypot(a,b),Math.atan2(b,a)));
  out.push({id:`r${i}.cap-detail`,paths:null,shape:null,group:'rod',centre:[x+9.1,y,z],move:[0,0,0],svg:boltPoints.map(q=>{const t=at(q);return `<circle class="bolt-hole" cx="${t[0]}" cy="${t[1]}" r="${2.7*G.scaleOf(P)}"/>`;}).join('')});
  return out;
 }
 const webs=G.hullOf([...Array.from({length:33},(_,j)=>{const a=Math.PI+j*Math.PI/32;return[57*Math.cos(a),57*Math.sin(a)]}),...Array.from({length:25},(_,j)=>{const a=j*Math.PI/12;return[23*Math.cos(a),46.4+23*Math.sin(a)]})]);
 function scene(poses,apart=0){
  const out=[];
  for(const [i,[x,y]] of [[-226,-42],[-226,42],[226,-42],[226,42]].entries())out.push(disc(`stand.foot.${i}`,Fz(x,y),-8,0,10,'lo','fixture'));
  out.push(slab('stand.base',base,0,12));
  for(const x of [-211,211]){
   out.push(slab(`stand.pedestal.${x}`,{x:x-10,y:-28,w:20,d:56,r:3},12,50,'mid'));
   out.push(ring(`stand.bearing.${x}`,Fx(x,0,96),-10,10,22.05,34,'mid','fixture'));
  }
  const spans=[[-224,-221],[-221,-201],[-201,-178],[-110,-82],[-14,14],[82,110],[178,201],[201,221],[221,224]];
  spans.forEach(([a,b],i)=>out.push(disc(`crank.main.${i}`,Fx(0,0,96),a,b,22,'mid','crank')));
  for(const p of poses){
   const {x,i,t,y,z}=p,F=G.frameOf([0,0,96],[1,0,0],[0,Math.cos(t),-Math.sin(t)],[0,Math.sin(t),Math.cos(t)]);
   out.push(prism(`crank.web.${i}.back`,F,webs,x-34,x-12,'mid','crank'));
   for(const [j,[lo,hi]] of [[-12,-9],[-9,9],[9,12]].entries())out.push(disc(`crank.pin.${i}.${j}`,Fx(x),lo,hi,22,'hi','crank',[0,y,z]));
   out.push(prism(`crank.web.${i}.front`,F,webs,x+12,x+34,'mid','crank'));
   out.push(...rod(p),...piston(p,apart));
  }
  out.push(disc('crank.flange',Fx(0,0,96),224,233,43,'mid','crank'));
  out.push(disc('crank.nose',Fx(0,0,96),233,242,17,'hi','crank'));
  const F=Fx(0,0,96),bolts=G.dotsOf(F,233.1,31,6,P,{all:true});
  out.push({id:'crank.flange-holes',paths:null,shape:null,group:'crank',centre:[233.2,0,96],move:[0,0,0],svg:k.dotsSvg(bolts,{size:2.5})});
  const all=out.flat();
  all.forEach(it=>{it.key=k.depthOf(it.centre,P);if(it.shape){it.shape.name=it.id;it.shape.owner=it.id.startsWith('p')?(it.id.includes('.ring.')?it.id.split('.').slice(0,3).join('.'):it.id.includes('.pin.')?it.id.split('.').slice(0,2).join('.'):it.id.includes('.clip.')?it.id.split('.').slice(0,3).join('.'):it.id.split('.')[0]+'.casting'):(it.id.startsWith('crank')?'crank':it.id.split('.')[0]);it.shape.piece=it.group; if(A&&it.move.some(Boolean))it.shape=A.moved(it.shape,it.move);}});
  if(orders){
   const index=apart>0?Math.round(Math.max(0,Math.min(1,apart))*100):(((Math.round(poses[0].t*180/Math.PI)%360)+360)%360);
   const table=apart>0?orders.apart:orders.angles,rank=new Map((table[index]||table[0]).map((n,i)=>[orders.ids[n],i]));
   for(const it of all){if(rank.has(it.id))it.key=rank.get(it.id)*10;else{
    let host=it.id.replace('.crown.detail','.crown').replace('.recess','.beam').replace('.cap-detail','.big.near').replace('crank.flange-holes','crank.flange');
    it.key=(rank.get(host)??all.length)*10+1;
   }}
  }
  return all;
 }
 function markup(items){return items.slice().sort((a,b)=>a.key-b.key).map(it=>`<g id="${it.id}" data-part="${it.group}"${it.move.some(Boolean)?` transform="translate(${at(it.move)[0]-at([0,0,0])[0]} ${at(it.move)[1]-at([0,0,0])[1]})"`:''}>${it.svg}</g>`).join('')}
 return {W,H,P,at,scene,markup,wrap,slots:SLOT};
}
