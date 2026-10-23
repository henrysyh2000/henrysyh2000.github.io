import {writeFileSync,readFileSync} from 'node:fs';
import * as k from '/Users/henryshen/.codex/skills/anatomy/kit/iso-kit.mjs';
import * as G from '/Users/henryshen/.codex/skills/anatomy/kit/lathe.mjs';
import * as A from '/Users/henryshen/.codex/skills/anatomy/kit/audit.mjs';
import {makeGeometry} from './geometry.mjs';
import {pose} from './model.mjs';
const geo=makeGeometry(k,G,A),ids=geo.scene(pose()).filter(it=>it.shape).map(it=>it.id),indices=new Map(ids.map((id,i)=>[id,i])),orders={ids,angles:[],apart:[],sampling:'1 degree crank sweep; 0.01 separation sweep; true-shape ray casting at 1 viewBox px; not a mathematical proof between samples'};
let cycles=0;
function solve(deg,apart){
 const items=geo.scene(pose(deg,apart),apart),R=A.recorder(geo.P);
 for(const it of items)if(it.shape)R.put({name:it.id,key:it.key,piece:it.group,at:it.centre,shapes:[R.solid(it.shape)]});
 const settled=A.settle(R,geo.P,{step:1});
 const dep=A.depthOrder(R.items,geo.P,{overlaps:settled.overlaps,solved:settled.solved});
 if(dep.problems.length){cycles+=dep.problems.length;console.log('PROBLEM',deg,apart,dep.problems.map(p=>[p.front,p.back,p.cycle]));}
 return R.items.slice().sort((a,b)=>a.key-b.key).map(it=>indices.get(it.name));
}
if(process.argv.includes('--apart-only'))orders.angles=JSON.parse(readFileSync('_tools/gti/pistons/order.json','utf8')).angles;
else for(let deg=0;deg<360;deg++){orders.angles.push(solve(deg,0));if(deg%60===0)console.log('angle',deg)}
for(let n=0;n<=100;n++){orders.apart.push(solve(0,n/100));if(n%20===0)console.log('apart',n)}
orders.problems=cycles;writeFileSync('_tools/gti/pistons/order.json',JSON.stringify(orders));console.log('Order samples complete; problems',cycles);
if(cycles)process.exitCode=1;
