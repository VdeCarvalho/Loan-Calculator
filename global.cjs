const assert=require('node:assert/strict'),F=require('../dist/finance.js');
const loan=(p,n,r)=>({amount:p,duration:n,durationUnit:'months',rate:r,rateUnit:'years'});
const close=(a,b,tol=.001)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
let count=0;
function check(raw,target,payment,smooth=false){const r=F.solveGlobal(raw,target,payment,smooth);close(r.rows.at(-1).balance,0);close(r.rows.reduce((s,x)=>s+x.principal,0),r.totalPrincipal);for(const row of r.rows){close(row.payment,row.principal+row.interest);close(row.balance,row.loanBalances.reduce((s,x)=>s+x,0));}if(smooth)r.rows.forEach(row=>close(row.payment,payment));else if(target==='duration'){r.rows.slice(0,-1).forEach(row=>close(row.payment,payment));assert(r.rows.at(-1).payment<=payment+.001);}else close(r.rows[0].payment,payment);count++;return r;}
let r=check([loan(12000,0,0),loan(24000,0,0)],'duration',1000);assert.equal(r.months,36);assert(r.solved.every(l=>l.n===36));
r=check([loan(260000,0,14),loan(180000,0,8)],'duration',5000);assert(r.solved.every(l=>l.n===r.months));
check([loan(1000,0,1),loan(2000,0,2)],'duration',10000);
r=check([loan(10000,12,0),loan(20000,24,0)],'rate',2000);close(r.solved[0].r,r.solved[1].r,1e-12);
r=check([loan(10000,12,0),loan(20000,24,0)],'rate',1500,true);close(r.solved[0].r,r.solved[1].r,1e-12);
r=check([loan(12000,12,0),loan(24000,24,0)],'rate',2000);close(r.solved[0].r,0);
r=check([loan(0,12,5),loan(0,24,10)],'amount',1000);close(r.solved[0].p,r.solved[1].p);
r=check([loan(0,12,5),loan(0,24,10)],'amount',1000,true);assert(r.solved[0].p!==r.solved[1].p);
r=check([loan(0,12,12),loan(0,24,8),loan(0,36,4)],'amount',2000,true);
for(let i=0;i<3;i++){const l=r.solved[i];let balance=l.p;for(let m=0;m<l.n;m++)balance=balance*(1+l.r)-r.rows[m].payments[i];close(balance,0);assert(r.rows.slice(l.n).every(row=>row.payments[i]===0&&row.loanBalances[i]===0));}
close(r.rows[0].payments[0],2000/3);close(r.rows[12].payments[1],1000);close(r.rows[24].payments[2],2000);
assert(r.rows.every(row=>row.payments.every(p=>p>=0)));close(r.total,72000);
console.log(JSON.stringify({exampleTotalPrincipal:r.totalPrincipal,totalInterest:r.interest,principals:r.solved.map(l=>l.p)}));
for(const target of ['duration','rate','amount'])assert.throws(()=>F.solveGlobal([loan(1000,12,5)],target,''));
assert.throws(()=>F.solveGlobal([loan(12000,12,0),loan(12000,12,0)],'rate',1000),/noRate/);
assert.throws(()=>F.solveGlobal([loan(1000,12,12),loan(1000,12,12)],'duration',20),/noPayoff/);
assert.throws(()=>F.solveGlobal([loan(1000,12,0)],'duration',.01),/termLimit/);
console.log(`PASS: ${count} global-payment schedules, common term/rate, equal principal shares, smoothing, zero interest and invalid cases.`);
