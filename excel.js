(function(root){
  'use strict';

  // A small, dependency-free XLSX writer. The workbook uses uncompressed ZIP
  // entries, so downloads work offline and on GitHub Pages without a CDN.
  const enc=new TextEncoder();
  const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const col=n=>{let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;};
  const ref=(c,r)=>col(c)+r;
  const quote=s=>"'"+s.replace(/'/g,"''")+"'";
  const sum=x=>x.length?'SUM('+x.join(',')+')':'0';
  const rounded=n=>Number.isFinite(n)?String(n):'0';
  const numberInput=value=>Number(String(value).trim().replace(/[٠-٩۰-۹०-९০-৯]/g,c=>{
    const n=c.charCodeAt(0);return String(n-(n>=0x9e6?0x9e6:n>=0x966?0x966:n>=0x6f0?0x6f0:0x660));
  }).replace(/[٫,]/g,'.'));

  const copy={
    en:['Study','Calculation','Solver','Input values','Result','Monthly rate','Loan term (months)','First monthly payment','Lowest monthly payment','Highest monthly payment','Start month','End month','Number of months','Optimized payment allocation','The optimized allocation is fixed in this export. Recalculate on the website after changing inputs.','Present value','Difference','Iteration','Lower bound','Upper bound','Trial value','Calculated value','Input payment','Annual rate','Monthly rate (%)','Years','Months','Loan payment','No monthly schedule is included.'],
    pt:['Estudo','Cálculo','Solução','Dados de entrada','Resultado','Taxa mensal','Prazo (meses)','Primeira mensalidade','Menor mensalidade','Maior mensalidade','Mês inicial','Mês final','Número de meses','Distribuição otimizada','A distribuição otimizada fica fixa nesta exportação. Recalcule no site após mudar as entradas.','Valor presente','Diferença','Iteração','Limite inferior','Limite superior','Valor testado','Valor calculado','Mensalidade informada','Taxa anual','Taxa mensal (%)','Anos','Meses','Parcela do empréstimo','A tabela mensal não está incluída.'],
    fr:['Étude','Calcul','Résolution','Données saisies','Résultat','Taux mensuel','Durée (mois)','Première mensualité','Mensualité minimale','Mensualité maximale','Premier mois','Dernier mois','Nombre de mois','Répartition optimisée','La répartition optimisée est figée dans ce fichier. Relancez le calcul sur le site après toute modification.','Valeur actuelle','Écart','Itération','Borne basse','Borne haute','Valeur testée','Valeur calculée','Mensualité saisie','Taux annuel','Taux mensuel (%)','Années','Mois','Versement du prêt','Aucun échéancier mensuel inclus.'],
    es:['Estudio','Cálculo','Solución','Datos de entrada','Resultado','Tasa mensual','Plazo (meses)','Primera cuota','Cuota mínima','Cuota máxima','Mes inicial','Mes final','Número de meses','Asignación optimizada','La asignación optimizada queda fija en este archivo. Vuelve a calcular en el sitio después de cambiar datos.','Valor presente','Diferencia','Iteración','Límite inferior','Límite superior','Valor probado','Valor calculado','Cuota introducida','Tasa anual','Tasa mensual (%)','Años','Meses','Pago del préstamo','No se incluye una tabla mensual.'],
    ru:['Отчёт','Расчёт','Решение','Исходные данные','Результат','Месячная ставка','Срок (месяцы)','Первый платёж','Минимальный платёж','Максимальный платёж','Первый месяц','Последний месяц','Число месяцев','Оптимальное распределение','Распределение зафиксировано при экспорте. После изменения данных пересчитайте на сайте.','Текущая стоимость','Разница','Итерация','Нижняя граница','Верхняя граница','Проверка','Расчёт','Заданный платёж','Годовая ставка','Месячная ставка (%)','Годы','Месяцы','Платёж по кредиту','Помесячная таблица не включена.'],
    zh:['贷款研究','计算','求解','输入数据','结果','月利率','期限（月）','首月还款','最低月供','最高月供','起始月','结束月','月数','优化分配','本文件中的优化分配已固定。修改输入后请在网站重新计算。','现值','差额','迭代','下界','上界','测试值','计算值','输入月供','年利率','月利率 (%)','年','月','贷款还款','不包含逐月明细。'],
    hi:['अध्ययन','गणना','हल','दर्ज मान','परिणाम','मासिक दर','अवधि (महीने)','पहली किस्त','न्यूनतम किस्त','अधिकतम किस्त','आरंभ महीना','अंतिम महीना','महीनों की संख्या','अनुकूलित आवंटन','इस निर्यात में आवंटन स्थिर है। इनपुट बदलने के बाद वेबसाइट पर फिर गणना करें।','वर्तमान मूल्य','अंतर','चरण','निचली सीमा','ऊपरी सीमा','परीक्षण मान','गणना मान','दर्ज किस्त','वार्षिक दर','मासिक दर (%)','वर्ष','महीने','ऋण किस्त','मासिक तालिका शामिल नहीं है।'],
    ar:['دراسة','الحساب','الحل','المدخلات','النتيجة','المعدل الشهري','المدة بالأشهر','القسط الأول','أقل قسط','أعلى قسط','شهر البداية','شهر النهاية','عدد الأشهر','التوزيع المحسن','التوزيع المحسن ثابت في هذا الملف. أعد الحساب في الموقع بعد تعديل المدخلات.','القيمة الحالية','الفرق','الخطوة','الحد الأدنى','الحد الأعلى','القيمة المختبرة','القيمة المحسوبة','القسط المدخل','المعدل السنوي','المعدل الشهري (%)','سنوات','أشهر','قسط القرض','لم يدرج الجدول الشهري.'],
    bn:['সমীক্ষা','হিসাব','সমাধান','ইনপুট','ফলাফল','মাসিক হার','মেয়াদ (মাস)','প্রথম কিস্তি','সর্বনিম্ন কিস্তি','সর্বোচ্চ কিস্তি','শুরুর মাস','শেষ মাস','মাসের সংখ্যা','অনুকূল বণ্টন','এই ফাইলে বণ্টন স্থির। ইনপুট বদলালে ওয়েবসাইটে আবার হিসাব করুন।','বর্তমান মূল্য','পার্থক্য','ধাপ','নিম্ন সীমা','উচ্চ সীমা','পরীক্ষার মান','হিসাবের মান','দেওয়া কিস্তি','বার্ষিক হার','মাসিক হার (%)','বছর','মাস','ঋণের কিস্তি','মাসিক সারণি নেই।'],
    id:['Studi','Perhitungan','Penyelesaian','Nilai masukan','Hasil','Bunga bulanan','Tenor (bulan)','Cicilan pertama','Cicilan terendah','Cicilan tertinggi','Bulan awal','Bulan akhir','Jumlah bulan','Alokasi optimal','Alokasi optimal tetap pada ekspor ini. Hitung ulang di situs setelah mengubah masukan.','Nilai kini','Selisih','Iterasi','Batas bawah','Batas atas','Nilai uji','Nilai hitung','Cicilan masukan','Bunga tahunan','Bunga bulanan (%)','Tahun','Bulan','Cicilan pinjaman','Tabel bulanan tidak disertakan.'],
    ur:['مطالعہ','حساب','حل','داخل کردہ اعداد','نتیجہ','ماہانہ شرح','مدت (ماہ)','پہلی قسط','کم ترین قسط','زیادہ ترین قسط','پہلا ماہ','آخری ماہ','ماہ کی تعداد','بہتر تقسیم','اس فائل میں تقسیم مقرر ہے۔ ان پٹ بدلنے کے بعد ویب سائٹ پر دوبارہ حساب کریں۔','موجودہ قدر','فرق','مرحلہ','زیریں حد','بالائی حد','آزمائشی قدر','حساب شدہ قدر','درج قسط','سالانہ شرح','ماہانہ شرح (%)','سال','ماہ','قرض کی قسط','ماہانہ جدول شامل نہیں۔']
  };
  const labels=lang=>copy[lang]||copy.en;

  class Sheet{
    constructor(name){this.name=name;this.cells=new Map();this.widths={0:23,1:20,2:18,3:18,4:19,5:18,6:18,7:18,8:18};}
    set(c,r,value,style=0){this.cells.set(ref(c,r),{c,r,value,style});return ref(c,r);}
    str(c,r,v,style=0){return this.set(c,r,{type:'s',value:v},style);}
    num(c,r,v,style=0){return this.set(c,r,{type:'n',value:v},style);}
    formula(c,r,f,cache,style=0){return this.set(c,r,{type:'f',value:f,cache},style);}
    xml(){
      const rows=new Map();for(const cell of this.cells.values()){if(!rows.has(cell.r))rows.set(cell.r,[]);rows.get(cell.r).push(cell);}
      const cols=Object.entries(this.widths).map(([i,w])=>`<col min="${+i+1}" max="${+i+1}" width="${w}" customWidth="1"/>`).join('');
      const body=[...rows].sort((a,b)=>a[0]-b[0]).map(([r,cells])=>`<row r="${r}">${cells.sort((a,b)=>a.c-b.c).map(({c,value,style})=>{
        const a=`r="${ref(c,r)}" s="${style}"`;
        if(value.type==='s')return `<c ${a} t="inlineStr"><is><t xml:space="preserve">${esc(value.value)}</t></is></c>`;
        if(value.type==='f')return `<c ${a}><f>${esc(value.value.replace(/^=/,''))}</f><v>${value.cache===undefined?'':rounded(value.cache)}</v></c>`;
        return `<c ${a}><v>${rounded(value.value)}</v></c>`;
      }).join('')}</row>`).join('');
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView showGridLines="0" workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="17"/><cols>${cols}</cols><sheetData>${body}</sheetData></worksheet>`;
    }
  }

  function zip(files){
    const chunks=[],central=[];let offset=0;
    const table=new Uint32Array(256);for(let n=0;n<256;n++){let v=n;for(let i=0;i<8;i++)v=v&1?0xedb88320^(v>>>1):v>>>1;table[n]=v>>>0;}
    const crc=data=>{let x=0xffffffff;for(const b of data)x=table[(x^b)&255]^(x>>>8);return(x^0xffffffff)>>>0;};
    function head(size){const a=new Uint8Array(size);return {a,v:new DataView(a.buffer)};}
    for(const [name,content] of files){
      const path=enc.encode(name),data=enc.encode(content),check=crc(data),local=head(30);
      local.v.setUint32(0,0x04034b50,true);local.v.setUint16(4,20,true);local.v.setUint16(6,0x0800,true);local.v.setUint32(14,check,true);local.v.setUint32(18,data.length,true);local.v.setUint32(22,data.length,true);local.v.setUint16(26,path.length,true);
      chunks.push(local.a,path,data);
      const dir=head(46);dir.v.setUint32(0,0x02014b50,true);dir.v.setUint16(4,20,true);dir.v.setUint16(6,20,true);dir.v.setUint16(8,0x0800,true);dir.v.setUint32(16,check,true);dir.v.setUint32(20,data.length,true);dir.v.setUint32(24,data.length,true);dir.v.setUint16(28,path.length,true);dir.v.setUint32(42,offset,true);central.push(dir.a,path);
      offset+=local.a.length+path.length+data.length;
    }
    const centralSize=central.reduce((s,x)=>s+x.length,0);chunks.push(...central);const end=head(22);end.v.setUint32(0,0x06054b50,true);end.v.setUint16(8,files.length,true);end.v.setUint16(10,files.length,true);end.v.setUint32(12,centralSize,true);end.v.setUint32(16,offset,true);chunks.push(end.a);
    return new Blob(chunks,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }

  const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="3"><numFmt numFmtId="164" formatCode="#,##0.00"/><numFmt numFmtId="165" formatCode="0.000000\&quot;%\&quot;"/><numFmt numFmtId="166" formatCode="#,##0"/></numFmts><fonts count="6"><font><sz val="10"/><name val="Arial"/><color rgb="FF233842"/></font><font><b/><sz val="15"/><name val="Arial"/><color rgb="FF17343D"/></font><font><b/><sz val="10"/><name val="Arial"/><color rgb="FFFFFFFF"/></font><font><sz val="10"/><name val="Arial"/><color rgb="FF1D5CA8"/></font><font><b/><sz val="12"/><name val="Arial"/><color rgb="FF17343D"/></font><font><i/><sz val="10"/><name val="Arial"/><color rgb="FF60757C"/></font></fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF183D45"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE7F5EE"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF3F7FA"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="9"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0"/><xf numFmtId="164" fontId="3" fillId="4" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="4" fillId="3" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0"/><xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="4" fillId="3" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

  function packageWorkbook(sheets){
    const contentTypes=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`;
    const wb=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${esc(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets><calcPr calcId="191029" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>`;
    const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
    return zip([['[Content_Types].xml',contentTypes],['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],['xl/workbook.xml',wb],['xl/_rels/workbook.xml.rels',rels],['xl/styles.xml',styles],...sheets.map((s,i)=>[`xl/worksheets/sheet${i+1}.xml`,s.xml()])]);
  }

  function onFirstSheet(study,calculation,solver,afterRow){
    const calcOffset=afterRow+5;
    const calcLast=Math.max(...[...calculation.cells.values()].map(cell=>cell.r));
    const solverOffset=solver?calcOffset+calcLast+5:0;
    const offsets=new Map([[quote(study.name)+'!',0],[quote(calculation.name)+'!',calcOffset]]);
    if(solver)offsets.set(quote(solver.name)+'!',solverOffset);
    const cellRef=/((?:'(?:[^']|'')+'|[A-Za-z_][A-Za-z0-9_]*)!)?(\$?)([A-Z]{1,3})(\$?)(\d+)/g;
    function moveFormula(formula,origin){
      return formula.split(/("(?:[^"]|"")*")/g).map((part,index)=>index%2?part:part.replace(cellRef,(match,sheet,absoluteCol,column,absoluteRow,row,position)=>{
        if(!sheet&&position&&/[A-Za-z0-9_.!]/.test(part[position-1]))return match;
        const offset=sheet?offsets.get(sheet):origin;
        return offset===undefined?match:`${absoluteCol}${column}${absoluteRow}${Number(row)+offset}`;
      })).join('');
    }
    for(const cell of study.cells.values())if(cell.value.type==='f')cell.value.value=moveFormula(cell.value.value,0);
    for(const [sheet,offset] of [[calculation,calcOffset],...(solver?[[solver,solverOffset]]:[])]){
      for(const cell of sheet.cells.values()){
        const value=cell.value.type==='f'?{...cell.value,value:moveFormula(cell.value.value,offset)}:{...cell.value};
        study.set(cell.c,cell.r+offset,value,cell.style);
      }
      for(const [column,width] of Object.entries(sheet.widths))if(!(column in study.widths))study.widths[column]=width;
    }
    return study;
  }

  function build(state,words,math){
    if(!state.result)throw Error('No calculated result');
    const r=state.result,L=labels(state.lang),S=new Sheet(L[0]),C=new Sheet(L[1]),needsSolver=['duration','rate'].includes(state.target),V=needsSolver?new Sheet(L[2]):null;
    const sf=quote(S.name)+'!',cf=quote(C.name)+'!',vf=V?quote(V.name)+'!':'';
    const loans=state.loans.map((l,i)=>({input:l,p:numberInput(l.amount),n:numberInput(l.duration)*(l.durationUnit==='years'?12:1),rate:numberInput(l.rate)/(l.rateUnit==='years'?1200:100),index:i}));
    const resultLoans=r.solved||loans.map(l=>({p:l.p,n:l.n,r:l.rate,a:l.p/math.factor(l.rate,l.n)}));
    const N=loans.length,last=7+N,header=9,first=10,end=first+N-1,helperCol=Math.max(10,4+N),helperLetter=col(helperCol);
    S.str(0,1,'Loan Calculator',1);S.str(0,2,new Intl.DateTimeFormat(state.lang,{dateStyle:'long'}).format(new Date()),6);
    S.str(0,3,words.solveFor);S.str(1,3,words.target);S.str(0,4,words.mode);S.str(1,4,words.modeName);S.str(0,5,words.currency);S.str(1,5,state.currency);
    if(needsSolver||state.target==='amount'){S.str(0,6,words.monthlyPayment);S.num(1,6,numberInput(state.payment),3);}
    S.str(0,8,L[3],1);[words.loan,words.amount,words.duration,words.durationUnit,words.rate+' (%)',words.rateUnit].forEach((x,i)=>S.str(i,header,x,2));
    for(let i=0;i<N;i++){
      const l=loans[i],sr=first+i;
      S.str(0,sr,words.loan+' '+(i+1));
      if(state.target!=='amount')S.num(1,sr,l.p,3);
      if(state.target!=='duration')S.num(2,sr,numberInput(l.input.duration),3);
      S.str(3,sr,l.input.durationUnit,3);
      if(state.target!=='rate')S.num(4,sr,numberInput(l.input.rate),3);
      S.str(5,sr,l.input.rateUnit,3);
    }
    const resultRow=end+4,totalsRow=resultRow+4;
    S.str(0,resultRow-1,L[4],1);S.str(0,resultRow,words.target,2);
    S.str(0,resultRow+1,L[28],6);
    S.str(0,totalsRow,words.borrowed);S.str(0,totalsRow+1,words.interest);S.str(0,totalsRow+2,words.total);
    C.str(0,1,L[1],1);C.str(0,3,words.mode);C.str(1,3,words.modeName);
    [words.loan,words.amount,L[6],L[5],L[15]+'/'+words.monthlyPayment,L[27],words.total,words.interest,...(state.mode==='smooth'&&state.target!=='duration'?[L[15],L[16]]:[])].forEach((x,i)=>C.str(i,7,x,2));
    const loanStart=8,loanEnd=7+N;
    const phaseEnds=[...new Set(resultLoans.map(l=>l.n))].sort((a,b)=>a-b);
    const phaseStart=loanEnd+7,phaseLast=phaseStart+phaseEnds.length-1;
    const phaseCols=Array.from({length:N},(_,i)=>col(4+i));
    const pvTerm=(pay,rate,start,length)=>`${pay}*IF(${rate}=0,${length},(1-(1+${rate})^(-${length}))/${rate})/(1+${rate})^(${start}-1)`;
    const rAt=i=>loanStart+i;
    const factor=(rate,n)=>rate===0?n:-Math.expm1(-n*Math.log1p(rate))/rate;
    const targetPay=numberInput(state.payment);
    const smooth=state.mode==='smooth'&&state.target!=='duration';

    if(smooth){
      C.str(0,phaseStart-2,L[13],1);
      C.str(0,phaseStart-1,L[10],2);C.str(1,phaseStart-1,L[11],2);C.str(2,phaseStart-1,L[12],2);C.str(3,phaseStart-1,words.monthlyPayment,2);
      for(let i=0;i<N;i++)C.str(4+i,phaseStart-1,words.loan+' '+(i+1),2);
      let previous=0;
      for(let j=0;j<phaseEnds.length;j++){
        const pr=phaseStart+j,stop=phaseEnds[j],start=previous+1,index=resultLoans.findIndex(l=>l.n===stop);
        C.formula(0,pr,j===0?'1':`B${pr-1}+1`,start,7);
        C.formula(1,pr,`C${rAt(index)}`,stop,7);
        C.formula(2,pr,`B${pr}-A${pr}+1`,stop-previous,7);
        const pieces=r.rows[start-1].payments;
        for(let i=0;i<N;i++){
          const pc=4+i;
          if(state.target==='amount')C.formula(pc,pr,`IF(C${rAt(i)}>=B${pr},${sf}B6/COUNTIF($C$${loanStart}:$C$${loanEnd},">="&B${pr}),0)`,pieces[i],4);
          else if(state.target==='rate')C.formula(pc,pr,`${sf}B6*${rounded(pieces[i]/targetPay)}`,pieces[i],4);
          else C.formula(pc,pr,`${sf}B${first+i}*${rounded(pieces[i]/resultLoans[i].p)}/$${helperLetter}$${rAt(i)}`,pieces[i],4);
        }
        C.formula(3,pr,`SUM(${col(4)}${pr}:${col(3+N)}${pr})`,r.rows[start-1].payment,4);
        previous=stop;
      }
      C.str(0,phaseLast+2,L[14],6);
    }

    for(let i=0;i<N;i++){
      const lr=rAt(i),sr=first+i,l=loans[i],sol=resultLoans[i];
      C.str(0,lr,words.loan+' '+(i+1));
      if(state.target==='amount'){
        if(smooth){const terms=phaseEnds.map((_,j)=>pvTerm(`${phaseCols[i]}${phaseStart+j}`,`D${lr}`,`A${phaseStart+j}`,`C${phaseStart+j}`));C.formula(1,lr,sum(terms),sol.p,4);}
        else{const invs=loans.map((_,k)=>`1/E${rAt(k)}`);C.formula(1,lr,`${sf}B6/${sum(invs)}`,sol.p,4);}
      }else C.formula(1,lr,`${sf}B${sr}`,sol.p,4);
      if(state.target==='duration')C.formula(2,lr,`${vf}F3`,sol.n,7);
      else C.formula(2,lr,`${sf}C${sr}*IF(${sf}D${sr}="years",12,1)`,sol.n,7);
      if(state.target==='rate')C.formula(3,lr,`${vf}F2`,sol.r,4);
      else C.formula(3,lr,`${sf}E${sr}/IF(${sf}F${sr}="years",1200,100)`,sol.r,4);
      C.formula(4,lr,`IF(D${lr}=0,C${lr},(1-(1+D${lr})^(-C${lr}))/D${lr})`,factor(sol.r,sol.n),4);
      if(smooth)C.formula(5,lr,`${phaseCols[i]}${phaseStart}`,r.rows[0].payments[i],4);
      else if(state.target==='duration')C.formula(5,lr,`B${lr}/IF(D${lr}=0,${vf}F2,(1-(1+D${lr})^(-${vf}F2))/D${lr})`,sol.a,4);
      else C.formula(5,lr,`B${lr}/E${lr}`,sol.a,4);
      const paid=r.rows.reduce((a,row)=>a+row.payments[i],0);
      if(smooth)C.formula(6,lr,`SUMPRODUCT($C$${phaseStart}:$C$${phaseLast},${phaseCols[i]}$${phaseStart}:${phaseCols[i]}$${phaseLast})`,paid,4);
      else if(state.target==='duration'){
        const before=`(B${lr}*(1+D${lr})^(C${lr}-1)-F${lr}*IF(D${lr}=0,C${lr}-1,((1+D${lr})^(C${lr}-1)-1)/D${lr}))`;
        C.formula(6,lr,`F${lr}*(C${lr}-1)+${before}*(1+D${lr})`,paid,4);
      }else C.formula(6,lr,`F${lr}*C${lr}`,paid,4);
      C.formula(7,lr,`G${lr}-B${lr}`,paid-sol.p,4);
      if(smooth){
        const terms=phaseEnds.map((_,j)=>pvTerm(`${phaseCols[i]}${phaseStart+j}`,`D${lr}`,`A${phaseStart+j}`,`C${phaseStart+j}`));
        C.formula(8,lr,sum(terms),sol.p,4);C.formula(9,lr,`I${lr}-B${lr}`,0,4);
        if(state.target!=='amount'&&state.target!=='rate'){
          const weights=phaseEnds.map((_,j)=>r.rows[(j?phaseEnds[j-1]:0)].payments[i]/sol.p);
          const factors=weights.map((weight,j)=>pvTerm(rounded(weight),`D${lr}`,`A${phaseStart+j}`,`C${phaseStart+j}`));
          C.formula(helperCol,lr,sum(factors),1,4);
        }
      }
    }
    const summary=loanEnd+2;
    C.str(0,summary,words.borrowed);C.formula(1,summary,`SUM(B${loanStart}:B${loanEnd})`,r.totalPrincipal,4);
    C.str(2,summary,words.interest);C.formula(3,summary,`SUM(H${loanStart}:H${loanEnd})`,r.interest,4);
    C.str(4,summary,words.total);C.formula(5,summary,`SUM(G${loanStart}:G${loanEnd})`,r.total,4);
    C.str(6,summary,L[7]);C.formula(7,summary,smooth?`D${phaseStart}`:`SUM(F${loanStart}:F${loanEnd})`,r.rows[0].payment,4);
    if(smooth){
      C.str(0,summary+1,L[8]);C.formula(1,summary+1,`MIN(D${phaseStart}:D${phaseLast})`,Math.min(...r.periods.map(p=>p.payment)),4);
      C.str(2,summary+1,L[9]);C.formula(3,summary+1,`MAX(D${phaseStart}:D${phaseLast})`,Math.max(...r.periods.map(p=>p.payment)),4);
    }
    const summaryRef=(cell,cache)=>S.formula(1,totalsRow+(cell==='B'?0:cell==='D'?1:2),`${cf}${cell}${summary}`,cache,4);
    summaryRef('B',r.totalPrincipal);summaryRef('D',r.interest);summaryRef('F',r.total);
    let resultFormula,resultCache,resultStyle=5;
    switch(state.target){
      case 'payment':resultFormula=`${cf}H${summary}`;resultCache=r.rows[0].payment;break;
      case 'duration':resultFormula=`${vf}F3`;resultCache=r.months;resultStyle=7;S.str(2,resultRow,L[26]);break;
      case 'rate':resultFormula=`${vf}F2*${state.loans[0].rateUnit==='years'?1200:100}`;resultCache=resultLoans[0].r*(state.loans[0].rateUnit==='years'?1200:100);resultStyle=8;S.str(2,resultRow,state.loans[0].rateUnit==='years'?L[23]:L[24]);break;
      case 'interest':resultFormula=`${cf}D${summary}`;resultCache=r.interest;break;
      case 'total':resultFormula=`${cf}F${summary}`;resultCache=r.total;break;
      case 'amount':resultFormula=`${cf}B${summary}`;resultCache=r.totalPrincipal;break;
    }
    S.formula(1,resultRow,resultFormula,resultCache,resultStyle);
    if(state.target==='payment'&&smooth&&r.approximateSmooth){
      S.str(0,resultRow+2,L[8]);S.formula(1,resultRow+2,`${cf}B${summary+1}`,Math.min(...r.periods.map(p=>p.payment)),4);
      S.str(0,resultRow+3,L[9]);S.formula(1,resultRow+3,`${cf}D${summary+1}`,Math.max(...r.periods.map(p=>p.payment)),4);
    }
    if(state.target==='duration'&&state.loans.every(l=>l.durationUnit==='years')){S.str(3,resultRow,L[25]);S.formula(4,resultRow,`${vf}F3/12`,r.months/12,4);}

    if(V){
      V.str(0,1,words.target,1);V.str(4,2,words.target);V.formula(5,2,`D${8+89}`,state.target==='duration'?r.months:resultLoans[0].r,4);
      if(state.target==='duration'){V.str(4,3,L[6]);V.formula(5,3,'ROUNDUP(F2-1E-9,0)',r.months,7);}
      V.str(0,3,state.target==='rate'&&smooth?words.borrowed:L[22]);
      V.formula(1,3,state.target==='rate'&&smooth?`${cf}B${summary}`:`${sf}B6`,state.target==='rate'&&smooth?r.totalPrincipal:targetPay,4);
      [L[17],L[18],L[19],L[20],L[21]].forEach((x,i)=>V.str(i,7,x,2));
      let lo=0,hi=state.target==='duration'?12000:Math.max(1,targetPay/Math.min(...resultLoans.map(l=>l.p)));
      const trialExpr=m=>{
        if(state.target==='duration')return sum(loans.map((_,i)=>{const rr=rAt(i);return `${cf}B${rr}*IF(${cf}D${rr}=0,1/${m},${cf}D${rr}/(1-(1+${cf}D${rr})^(-${m})))`;}));
        if(!smooth)return sum(loans.map((_,i)=>{const rr=rAt(i);return `${cf}B${rr}*IF(${m}=0,1/${cf}C${rr},${m}/(1-(1+${m})^(-${cf}C${rr})))`;}));
        return sum(phaseEnds.map((_,j)=>{const pr=phaseStart+j;return pvTerm(`${cf}D${pr}`,m,`${cf}A${pr}`,`${cf}C${pr}`);}));
      };
      for(let k=0;k<90;k++){
        const vr=8+k,m=(lo+hi)/2;
        V.num(0,vr,k+1,7);
        if(k===0){V.num(1,vr,lo,4);V.formula(2,vr,state.target==='duration'?'12000':`MAX(1,${sf}B6/MIN(${cf}B${loanStart}:B${loanEnd}))`,hi,4);}
        else{
          const prev=vr-1,lowBranch=state.target==='duration'?`E${prev}>$B$3`:state.target==='rate'&&smooth?`E${prev}>$B$3`:`E${prev}<$B$3`;
          V.formula(1,vr,`IF(${lowBranch},D${prev},B${prev})`,lo,4);
          V.formula(2,vr,`IF(${lowBranch},C${prev},D${prev})`,hi,4);
        }
        V.formula(3,vr,`(B${vr}+C${vr})/2`,m,4);
        const value=state.target==='duration'?loans.reduce((s,l)=>s+l.p/factor(l.rate,m),0):smooth?phaseEnds.reduce((s,_,j)=>{const start=j?phaseEnds[j-1]:0,length=phaseEnds[j]-start;return s+r.rows[start].payment*factor(m,length)/(1+m)**start;},0):resultLoans.reduce((s,l)=>s+l.p/factor(m,l.n),0);
        V.formula(4,vr,trialExpr(`D${vr}`),value,4);
        const target=state.target==='rate'&&smooth?r.totalPrincipal:targetPay;
        const moveLow=state.target==='duration'||smooth?value>target:value<target;
        if(moveLow)lo=m;else hi=m;
      }
      V.formula(5,2,'D97',state.target==='duration'?r.months:resultLoans[0].r,4);
      // The duration helper cell holds the unrounded root; its cached value is
      // set from the bisection result below to match the formula exactly.
      if(state.target==='duration')V.cells.get('F2').value.cache=(lo+hi)/2;
      V.widths={0:14,1:20,2:20,3:20,4:22,5:20};
    }
    if(smooth&&state.target!=='amount'&&state.target!=='rate')C.str(helperCol,7,L[15]+' / '+words.amount,2);
    S.widths={0:28,1:22,2:19,3:21,4:20,5:18};C.widths={0:23,1:20,2:18,3:18,4:18,5:19,6:19,7:19,8:19};
    for(let i=9;i<=helperCol;i++)C.widths[i]=19;
    const sheets=[onFirstSheet(S,C,V,totalsRow+2)];
    return {sheets,blob:packageWorkbook(sheets)};
  }

  async function download(state,words,math){
    const {blob}=build(state,words,math),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='Loan-Calculator-'+new Date().toISOString().slice(0,10)+'.xlsx';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  root.LoanExcel={build,download};
  if(typeof module!=='undefined')module.exports=root.LoanExcel;
})(typeof globalThis!=='undefined'?globalThis:window);
