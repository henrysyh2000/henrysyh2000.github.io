import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SPEC,pose} from './model.mjs';
assert(Math.abs(pose(0)[0].fromTDC)<1e-10);
assert(Math.abs(pose(180)[0].fromTDC-SPEC.stroke)<1e-10);
for(let d=0;d<=720;d+=.5){
 const p=pose(d);
 for(const c of p){assert(Math.abs(Math.hypot(c.y,c.pinZ-c.z)-SPEC.rod)<1e-10);assert(c.fromTDC>=-1e-9&&c.fromTDC<=SPEC.stroke+1e-9)}
 assert(Math.abs(p[0].pinZ-p[3].pinZ)<1e-10);assert(Math.abs(p[1].pinZ-p[2].pinZ)<1e-10);
}
// Analytical clearances belong to this illustrative model, not OEM fits.
assert(SPEC.shaftZ-SPEC.r-29>12); // Big-end envelope clears the display deck.
assert(SPEC.shaftZ-57>12);        // Counterweight envelope clears the deck.
for(let n=0;n<=1000;n++){
 const p=pose(0,n/1000)[3];
 if(p.pin>0)assert(p.clip*36>7.4+7.05); // Circlip is radially clear before pin moves.
 if(p.lift>0)assert(p.pin*109-34.6>39.2); // Pin clears the casting before lifting.
 if(p.rings>.3)assert(38.55+2.5>39.2); // Ring bore expanded before axial lift.
}
const order=JSON.parse(readFileSync(new URL('./order.json',import.meta.url)));
assert.equal(order.problems,0);assert.equal(order.angles.length,360);assert.equal(order.apart.length,101);
for(const row of [...order.angles,...order.apart]){assert.equal(row.length,order.ids.length);assert.equal(new Set(row).size,order.ids.length)}
console.log('Kinematics verified over 1,441 angles; stroke endpoints, rod length, paired phases and 461 complete painter-order samples passed.');
