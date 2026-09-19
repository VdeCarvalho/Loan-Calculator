const assert=require('node:assert/strict'),F=require('../dist/finance.js');
const loan=(p,n,r)=>({amount:p,duration:n,rate:r,durationUnit:'months',rateUnit:'years'});
const close=(a,b,tol=.005)=>assert(Math.abs(a-b)<=tol,`${a} != ${b}`);
function verify(raw,result){assert(!result.adaptedTerms);raw.forEach((l,i)=>{let pv=0;for(let m=l.duration;m>0;m--)pv=(pv+result.rows[m-1].payments[i])/(1+l.rate/1200);close(pv,l.amount,Math.max(.005,l.amount*1e-8));close(result.rows[l.duration-1].loanBalances[i],0);assert(result.rows.slice(l.duration).every(row=>row.payments[i]===0&&row.loanBalances[i]===0));});for(let m=0;m<result.rows.length;m++){const row=result.rows[m];assert(row.payments.every(p=>Number.isFinite(p)&&p>=0));raw.forEach((l,i)=>{const previous=m?result.rows[m-1].loanBalances[i]:l.amount;close(previous*(1+l.rate/1200)-row.payments[i],row.loanBalances[i],Math.max(.005,l.amount*1e-8));});}}
const raw=[loan(260000,144,12),loan(180000,288,8),loan(120000,432,4)],r=F.calculate(raw,true);verify(raw,r);assert(r.approximateSmooth);
// Independent sharp bounds for this phase model: first loan must be paid in
// phase 1; the first two contracts impose a lower bound on peak payment.
// Even deferring all of loan 3 to its last phase bounds the final payment.
const f=(rate,n)=>(1-Math.pow(1+rate,-n))/rate;
const peakBound=(180000+260000/f(.01,144)*f(8/1200,144))/f(8/1200,288);
const tailBound=120000*Math.pow(1+4/1200,288)/f(4/1200,144);
close(Math.max(...r.periods.map(p=>p.payment)),peakBound);close(Math.min(...r.periods.map(p=>p.payment)),tailBound);
const zero=[loan(100000,12,0),loan(1000,24,0)];const z=F.calculate(zero,true);verify(zero,z);close(z.rows[0].payment,100000/12);close(z.rows[12].payment,1000/12);
const rate=F.solveGlobal(zero,'rate',9000,true);assert(rate.approximateSmooth);assert(rate.solved.every((l,i)=>l.n===zero[i].duration));assert(rate.rows.every(row=>row.payment<=9000.005));close(Math.max(...rate.periods.map(p=>p.payment)),9000);assert.throws(()=>F.solveGlobal(zero,'rate',5000,true),/noRate/);
let seed=17;const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
for(let k=0;k<100;k++){const list=Array.from({length:1+Math.floor(rand()*6)},()=>loan(1000+Math.floor(rand()*200000),12*(1+Math.floor(rand()*40)),Math.floor(rand()*2000)/100));verify(list,F.calculate(list,true));}
for(const list of [[loan(260000,12000,0)],[loan(10000,1000,3.2)],[loan(10000,12,100),loan(20000,12000,100)]])verify(list,F.calculate(list,true));
console.log('PASS: phase-optimality bounds; 100 varied portfolios; zero/high rates; 1000/12000 months; original maturities; inverse-rate budget and impossible budget.');
