const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const F=require('../dist/finance.js');
const loan=(amount,duration,rate=0,durationUnit='months',rateUnit='years')=>({amount,duration,rate,durationUnit,rateUnit});
function close(a,b,tol=1e-6){assert(Math.abs(a-b)<tol,`${a} != ${b}`)}
let cases=0;
function check(loans,smooth){const r=F.calculate(loans,smooth);close(r.rows.at(-1).balance,0);close(r.rows.reduce((s,r)=>s+r.principal,0),r.totalPrincipal,.001);close(r.total,r.totalPrincipal+r.interest,.001);for(const row of r.rows){close(row.payment,row.interest+row.principal,.001);assert(row.balance>=-.001);assert(row.payments.every(p=>p>=-.001));if(smooth&&!r.approximateSmooth)close(row.payment,r.rows[0].payment,.001)}for(let i=0;i<loans.length;i++){let balance=Number(loans[i].amount);const n=Number(loans[i].duration)*(loans[i].durationUnit==='years'?12:1);const rate=F.monthlyRate(loans[i].rate,loans[i].rateUnit);for(let m=0;m<n;m++)balance=balance*(1+rate)-r.rows[m].payments[i];close(balance,0,.001);assert(r.rows.slice(n).every(row=>row.payments[i]===0));}cases++;return r;}
let r=check([loan(1200,12)],false);close(r.rows[0].payment,100);close(r.interest,0);
r=check([loan(100000,360,6)],false);close(r.rows[0].payment,599.5505251527569);
const pair=[loan(260000,300,2),loan(40000,240,1.5)];r=check(pair,false);assert.deepEqual(r.periods.map(p=>[p.start,p.end]),[[1,240],[241,300]]);
const s=check(pair,true);assert(s.interest>=0);assert.equal(s.periods.length,1);

const screenshotCase=check([loan(260000,300,14),loan(180000,15,8,'years')],true);
assert.equal(screenshotCase.hasNegativeAmortization,true);
assert.equal(screenshotCase.periods.length,1);


close(screenshotCase.rows[179].loanBalances[1],0);
close(screenshotCase.rows[299].loanBalances[0],0);
console.log(JSON.stringify({monthly:screenshotCase.rows[0].payment,total:screenshotCase.total,interest:screenshotCase.interest,firstPayments:screenshotCase.rows[0].payments,month180Balances:screenshotCase.rows[179].loanBalances}));
check([loan(240000,25,2,'years'),loan(40000,20,1.5,'years')],true);
r=check([loan(1200,12),loan(2400,24)],true);close(r.rows[0].payment,150);
check([loan(600,12,1.5),loan(20000,120,3.2),loan(1000,60,0)],true);
check([loan(260000,1000,3.2)],false);
check([loan(260000,12000,0)],false);
close(F.calculate([loan(10000,24,1,'months','months')]).total,F.calculate([loan(10000,24,12)]).total);
r=check([loan(1000,24),loan(100000,12)],true);assert(r.approximateSmooth);close(r.rows[0].payment,100000/12,.001);close(r.rows[12].payment,1000/12,.001);
r=check([loan(260000,12,12,'years'),loan(180000,24,8,'years'),loan(120000,36,4,'years')],true);
assert(r.approximateSmooth);assert(!r.adaptedTerms);assert.equal(r.periods.length,2);close(r.rows[143].loanBalances[0],0);close(r.rows[287].loanBalances[1],0);close(r.rows[431].loanBalances[2],0);
console.log(JSON.stringify({adaptedPayment:r.rows[0].payment,months:r.months,total:r.total}));
for(const l of [loan(0,12),loan(1000,1.2),loan(1000,12001),loan(1000,12,-1),loan(1000,12,1.123),loan('',12),loan(10,1,Infinity)])assert.throws(()=>F.calculate([l]),/invalid/);
const context={Intl};vm.createContext(context);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../dist/i18n.js'),'utf8')+';globalThis.data={LANGUAGES,CURRENCIES,KEYS,SOLVER_KEYS,GLOBAL_KEYS,I18N,NOTES}',context);const d=context.data;assert.equal(d.LANGUAGES.length,11);assert.equal(d.CURRENCIES.length,30);for(const [language]of d.LANGUAGES){assert.equal(Object.keys(d.I18N[language]).length,d.KEYS.length+d.SOLVER_KEYS.length+d.GLOBAL_KEYS.length+7);assert(d.NOTES[language].length===4);for(const key of [...d.KEYS,...d.SOLVER_KEYS,...d.GLOBAL_KEYS,'loan','periodInterest','negativeAmortization','flexibleAmounts','approximateLabel','approximateNotice','smoothMethod'])assert(d.I18N[language][key],`${language}.${key}`);}
console.log(`PASS: ${cases} schedules, reference annuity, monthly/annual equivalence, smoothing, deadlines, 1000/12000 months, invalid inputs, 11 complete locales and 30 currencies.`);
