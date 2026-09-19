(function(root){
  'use strict';
  const factor=(r,n)=>r===0?n:-Math.expm1(-n*Math.log1p(r))/r;
  const monthlyRate=(rate,unit)=>unit==='years'?rate/1200:rate/100;
  function normalize(loans){
    if(!loans.length)throw Error('invalid');
    return loans.map(l=>{
      const p=Number(l.amount),duration=Number(l.duration),rate=Number(l.rate);
      const n=duration*(l.durationUnit==='years'?12:1),r=monthlyRate(rate,l.rateUnit);
      if(!['years','months'].includes(l.durationUnit)||!['years','months'].includes(l.rateUnit)||!String(l.amount).trim()||!String(l.duration).trim()||!String(l.rate).trim()||!Number.isFinite(p)||p<=0||p>1e12||!Number.isInteger(duration)||duration<=0||n>12000||!Number.isFinite(rate)||rate<0||rate>100||Math.abs(rate*100-Math.round(rate*100))>1e-7)throw Error('invalid');
      return {p,n,r,a:p/factor(r,n)};
    });
  }
  function calculate(raw,smooth=false){
    return schedule(normalize(raw),smooth);
  }
  function schedule(loans,smooth=false){
    try{return originalSchedule(loans,smooth);}catch(error){
      if(!smooth||error.message!=='infeasible')throw error;
      // Explicit refinancing scenario: retain principals and rates, extend
      // shorter contracts to the longest term instead of allowing refunds.
      const N=Math.max(...loans.map(l=>l.n));
      const adapted=loans.map(l=>({...l,n:N,a:l.p/factor(l.r,N)}));
      const result=originalSchedule(adapted,false);
      result.adaptedTerms=true;
      result.originalTerms=loans.map(l=>l.n);
      result.effectiveTerms=adapted.map(l=>l.n);
      return result;
    }
  }
  function originalSchedule(loans,smooth=false){
    const N=Math.max(...loans.map(l=>l.n));
    // The largest loan among those ending last absorbs the payment steps.
    const candidates=loans.map((l,i)=>({l,i})).filter(x=>x.l.n===N).sort((a,b)=>b.l.p-a.l.p);
    const anchor=candidates[0].i,main=loans[anchor];
    const constant=(main.p+loans.reduce((sum,l,i)=>sum+(i===anchor?0:l.a*factor(main.r,l.n)),0))/factor(main.r,N);
    const balances=loans.map(l=>l.p),rows=[];
    let hasNegativeAmortization=false;
    for(let m=1;m<=N;m++){
      const payments=loans.map(l=>m<=l.n?l.a:0);
      if(smooth)payments[anchor]=constant-payments.reduce((s,p,i)=>s+(i===anchor?0:p),0);
      let interest=0,principal=0;
      for(let i=0;i<loans.length;i++){
        const l=loans[i];if(m>l.n)continue;
        const intr=balances[i]*l.r;
        // A non-negative payment may be below interest: the unpaid interest
        // is capitalized and repaid during the later payment step.
        if(smooth&&i===anchor&&payments[i]<-1e-7)throw Error('infeasible');
        if(smooth&&i===anchor&&payments[i]<0)payments[i]=0;
        // Adjust final installment only for floating-point residuals.
        if(m===l.n)payments[i]=balances[i]+intr;
        const capital=payments[i]-intr;
        if(capital<-1e-7)hasNegativeAmortization=true;
        // Remaining present value avoids accumulated floating-point error
        // for very long terms and large rates.
        balances[i]=smooth&&i===anchor
          ? constant*factor(l.r,N-m)-loans.reduce((s,other,j)=>s+(j===anchor?0:other.a*factor(l.r,Math.max(0,other.n-m))),0)
          : l.a*factor(l.r,l.n-m);
        if(balances[i]<-0.01||!Number.isFinite(balances[i]))throw Error('infeasible');
        if(Math.abs(balances[i])<1e-7)balances[i]=0;
        interest+=intr;principal+=capital;
      }
      rows.push({month:m,payments,payment:payments.reduce((a,b)=>a+b,0),interest,principal,balance:balances.reduce((a,b)=>a+b,0),loanBalances:[...balances]});
    }
    const totalPrincipal=loans.reduce((s,l)=>s+l.p,0),total=rows.reduce((s,r)=>s+r.payment,0);
    const periods=[];
    for(const row of rows){const previous=periods[periods.length-1];if(previous&&Math.abs(previous.payment-row.payment)<.005)previous.end=row.month;else periods.push({start:row.month,end:row.month,payment:row.payment});}
    return {rows,periods,total,totalPrincipal,interest:total-totalPrincipal,months:N,anchor,hasNegativeAmortization};
  }
  function solve(raw,target){
    if(!['duration','rate','amount'].includes(target))throw Error('invalid');
    if(!raw.length)throw Error('invalid');
    const solved=raw.map(l=>{
      const read=(key,positive=true)=>{const value=Number(l[key]);if(l[key]===undefined||!String(l[key]).trim()||!Number.isFinite(value)||(positive?value<=0:value<0))throw Error('invalid');return value;};
      if(!['years','months'].includes(l.durationUnit)||!['years','months'].includes(l.rateUnit))throw Error('invalid');
      const a=read('payment');if(a>1e12)throw Error('invalid');
      let p=target==='amount'?0:read('amount'),n=target==='duration'?0:read('duration')*(l.durationUnit==='years'?12:1),r=target==='rate'?0:monthlyRate(read('rate',false),l.rateUnit);
      if(p>1e12||(target!=='duration'&&(!Number.isInteger(Number(l.duration))||n>12000))||(target!=='rate'&&(Number(l.rate)>100||Math.abs(Number(l.rate)*100-Math.round(Number(l.rate)*100))>1e-7)))throw Error('invalid');
      if(target==='amount')p=a*factor(r,n);
      if(target==='duration'){
        if(a<=p*r)throw Error('noPayoff');
        const exact=r===0?p/a:-Math.log((a-p*r)/a)/Math.log1p(r);
        if(!Number.isFinite(exact)||exact>12000+1e-8)throw Error('termLimit');
        n=Math.max(1,Math.ceil(exact-1e-9));
      }
      if(target==='rate'){
        const zero=p/n,tolerance=Math.max(1e-10,zero*1e-12);
        if(a<zero-tolerance)throw Error('noRate');
        if(Math.abs(a-zero)>tolerance){let lo=0,hi=a/p;for(let k=0;k<100;k++){const mid=(lo+hi)/2;if(p/factor(mid,n)>a)hi=mid;else lo=mid;}r=(lo+hi)/2;}
      }
      if(!Number.isFinite(p)||p<=0||p>1e12)throw Error('invalid');
      return {p,n,r,a};
    });
    const N=Math.max(...solved.map(l=>l.n)),rows=[];
    // Backward present values keep long amortization schedules numerically stable.
    const paths=solved.map(l=>{
      const last=target==='duration'?(l.r===0?l.p-l.a*(l.n-1):l.a/l.r*(-Math.expm1((l.n-1)*Math.log1p(l.r)+Math.log((l.a-l.p*l.r)/l.a)))*(1+l.r)):l.a;
      if(!Number.isFinite(last)||last<=0||last>l.a+.01)throw Error('invalid');
      const balances=Array(l.n+1);balances[l.n]=0;
      for(let m=l.n;m>=1;m--)balances[m-1]=(balances[m]+(m===l.n?last:l.a))/(1+l.r);
      if(Math.abs(balances[0]-l.p)>Math.max(.01,l.p*1e-9))throw Error('invalid');
      return {last,balances};
    });
    for(let m=1;m<=N;m++){
      let interest=0,principal=0,balance=0;
      const payments=solved.map((l,i)=>{if(m>l.n)return 0;const path=paths[i],payment=m===l.n?path.last:l.a,intr=path.balances[m-1]*l.r;interest+=intr;principal+=payment-intr;balance+=path.balances[m];return payment;});
      rows.push({month:m,payments,payment:payments.reduce((s,p)=>s+p,0),interest,principal,balance,loanBalances:paths.map(path=>path.balances[Math.min(m,path.balances.length-1)])});
    }
    const totalPrincipal=solved.reduce((s,l)=>s+l.p,0),total=rows.reduce((s,r)=>s+r.payment,0),periods=[];
    for(const row of rows){const previous=periods[periods.length-1];if(previous&&Math.abs(previous.payment-row.payment)<.005)previous.end=row.month;else periods.push({start:row.month,end:row.month,payment:row.payment});}
    return {rows,periods,total,totalPrincipal,interest:total-totalPrincipal,months:N,solved:solved.map((l,i)=>({...l,last:paths[i].last}))};
  }
  function solveGlobal(raw,target,payment,smooth=false){
    const a=Number(payment);
    if(!raw.length||!String(payment).trim()||!Number.isFinite(a)||a<=0||a>1e12)throw Error('invalidSolver');
    // Validate only the known fields using neutral values for the unknown.
    const known=normalize(raw.map(l=>({...l,amount:target==='amount'?1:l.amount,duration:target==='duration'?1:l.duration,durationUnit:target==='duration'?'months':l.durationUnit,rate:target==='rate'?0:l.rate})));
    if(target==='duration'){
      const interest=known.reduce((s,l)=>s+l.p*l.r,0);
      if(a<=interest)throw Error('noPayoff');
      const cost=n=>known.reduce((s,l)=>s+l.p/factor(l.r,n),0);
      if(cost(12000)>a+Math.max(1e-8,a*1e-12))throw Error('termLimit');
      let lo=0,hi=12000;for(let i=0;i<100;i++){const mid=(lo+hi)/2;if(cost(mid)>a)lo=mid;else hi=mid;}
      const exact=(lo+hi)/2,weights=known.map(l=>l.p/factor(l.r,exact));
      const r=solve(raw.map((l,i)=>({...l,payment:weights[i]})),'duration');
      r.globalPayment=a;r.globalRule='commonDuration';return r;
    }
    const N=Math.max(...known.map(l=>l.n));
    if(target==='amount'&&smooth){
      // Allocate the budget equally to active contracts, then discount each
      // contract's payments at its own rate to find its initial principal.
      const payments=Array.from({length:N},(_,m)=>{const active=known.filter(l=>m<l.n).length;return known.map(l=>m<l.n?a/active:0);});
      const paths=known.map((l,i)=>{const balances=Array(N+1).fill(0);for(let m=l.n;m>0;m--)balances[m-1]=(balances[m]+payments[m-1][i])/(1+l.r);if(!Number.isFinite(balances[0])||balances[0]<=0||balances[0]>1e12)throw Error('invalidSolver');return balances;});
      let hasNegativeAmortization=false;
      const rows=payments.map((parts,m)=>{const loanBalances=paths.map(path=>path[m+1]),interest=known.reduce((s,l,i)=>s+paths[i][m]*l.r,0),payment=parts.reduce((s,p)=>s+p,0);if(known.some((l,i)=>parts[i]<paths[i][m]*l.r-1e-7))hasNegativeAmortization=true;return {month:m+1,payments:parts,payment,interest,principal:payment-interest,balance:loanBalances.reduce((s,b)=>s+b,0),loanBalances};});
      const totalPrincipal=paths.reduce((s,path)=>s+path[0],0),total=rows.reduce((s,row)=>s+row.payment,0);
      return {rows,periods:[{start:1,end:N,payment:a}],total,totalPrincipal,interest:total-totalPrincipal,months:N,hasNegativeAmortization,globalPayment:a,globalRule:'flexibleAmounts',solved:known.map((l,i)=>({...l,p:paths[i][0],a:payments[0][i],last:payments[l.n-1][i]}))};
    }
    let loans;
    if(target==='rate'){
      const amount=known.reduce((s,l)=>s+l.p,0);
      const cost=r=>smooth?amount/factor(r,N):known.reduce((s,l)=>s+l.p/factor(r,l.n),0);
      const tolerance=Math.max(1e-8,a*1e-12);
      if(a<cost(0)-tolerance)throw Error('noRate');
      let rate=0;
      if(a>cost(0)+tolerance){let lo=0,hi=a/Math.min(...known.map(l=>l.p));for(let i=0;i<100;i++){const mid=(lo+hi)/2;if(cost(mid)>a)hi=mid;else lo=mid;}rate=(lo+hi)/2;}
      loans=known.map(l=>({...l,r:rate,a:l.p/factor(rate,l.n)}));
    }else if(target==='amount'){
      // Equal principal shares, explicitly stated in the UI.
      let coefficient;
      if(smooth){const anchor=known.findIndex(l=>l.n===N),main=known[anchor];coefficient=(1+known.reduce((s,l,i)=>s+(i===anchor?0:l.a*factor(main.r,l.n)),0))/factor(main.r,N);}
      else coefficient=known.reduce((s,l)=>s+l.a,0);
      const principal=a/coefficient;
      if(!Number.isFinite(principal)||principal<=0||principal>1e12)throw Error('invalidSolver');
      loans=known.map(l=>({...l,p:principal,a:principal/factor(l.r,l.n)}));
    }else throw Error('invalidSolver');
    const result=schedule(loans,smooth);
    result.solved=loans.map((l,i)=>({...l,n:result.effectiveTerms?.[i]??l.n,last:result.rows[(result.effectiveTerms?.[i]??l.n)-1].payments[i]}));
    result.globalPayment=a;result.globalRule=target==='rate'?'commonRate':'equalAmounts';
    return result;
  }
  root.LoanMath={factor,monthlyRate,normalize,calculate,solve,solveGlobal};
  if(typeof module!=='undefined')module.exports=root.LoanMath;
})(typeof globalThis!=='undefined'?globalThis:window);
