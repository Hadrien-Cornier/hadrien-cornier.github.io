import test from 'node:test';
import assert from 'node:assert/strict';
import {BASIS,SIGMA,sampleOffsets,jointTargets,fingerShape} from '../assets/papers-eigendexplore.js';

test('correlated exploration preserves independent noise and the initial total variance',()=>{
 assert.ok(Math.abs(Math.hypot(...BASIS)-1)<1e-12);
 // Sigma^2/2 I + 3 Sigma^2/2 ee^T has the same trace as Sigma^2 I.
 const diagonal=BASIS.map(e=>SIGMA**2/2+3*SIGMA**2/2*e**2);
 assert.ok(Math.abs(diagonal.reduce((a,b)=>a+b,0)-3*SIGMA**2)<1e-12);
 // Every direction retains non-zero independent exploration.
 for(const vector of [[1,0,0],[0,1,0],[0,0,1],[1,-1,0]]){
  const variance=SIGMA**2/2*vector.reduce((s,v)=>s+v*v,0)+3*SIGMA**2/2*vector.reduce((s,v,i)=>s+v*BASIS[i],0)**2;
  assert.ok(variance>0);
 }
});
test('sampling creates measured correlation rather than only a label change',()=>{
 const statistics=mode=>{
  const sum=[0,0,0],square=[0,0,0];let cross=0;
  for(let k=1;k<=50000;k++){const a=sampleOffsets(k*7919,mode);a.forEach((v,i)=>{sum[i]+=v;square[i]+=v*v;});cross+=a[0]*a[1];}
  return {trace:square.reduce((s,v,i)=>s+v/50000-(sum[i]/50000)**2,0),cross:cross/50000-sum[0]*sum[1]/50000**2};
 };
 const independent=statistics('independent'),structured=statistics('structured');
 assert.ok(Math.abs(independent.trace-3*SIGMA**2)<.008);
 assert.ok(Math.abs(structured.trace-3*SIGMA**2)<.008);
 assert.ok(Math.abs(independent.cross)<.003);
 assert.ok(structured.cross>.03);
});
test('joint targets stay bounded and independent joint changes alter only that finger',()=>{
 for(let seed=1;seed<300;seed++)for(const mode of ['independent','structured'])assert.ok(jointTargets(seed,mode).every(v=>v>=-1&&v<=1));
 assert.deepEqual(jointTargets(91,'structured'),jointTargets(91,'structured'));
 const before=[-.18,.1,-.05].map(fingerShape),after=[-.18,.8,-.05].map(fingerShape);
 assert.deepEqual(before[0],after[0]);assert.deepEqual(before[2],after[2]);assert.notDeepEqual(before[1],after[1]);
});
