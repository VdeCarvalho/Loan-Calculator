/* Offline PDF export. Browser canvas preserves all eleven writing systems.
   Pages are embedded as high-resolution JPEG images; no data leaves the device. */
(function(root){
  const W=794,H=1123,M=48,BOTTOM=1050;
  function layouts(report,ctx){
    const pages=[];let page,y;
    function fresh(){page=[];pages.push(page);y=100;}
    function line(text,size=15,color='#17343d',bold=false){
      ctx.font=`${bold?'bold ':''}${size}px Arial, sans-serif`;
      const chunks=[];let part='';
      // Segment by grapheme so CJK wraps and combining marks stay together.
      const segments=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(report.lang,{granularity:'grapheme'}).segment(String(text))].map(x=>x.segment):Array.from(String(text));
      for(const char of segments){if(char==='\n'||ctx.measureText(part+char).width>W-2*M){chunks.push(part);part=char==='\n'?'':char;}else part+=char;}if(part)chunks.push(part);
      for(const text of chunks){if(y+size*1.6>BOTTOM)fresh();page.push({type:'text',text,y,size,color,bold});y+=size*1.6;}
    }
    fresh();line(report.title,23,'#17343d',true);line(report.date,12,'#62777e');y+=12;
    report.summary.forEach(([label,value])=>line(`${label}: ${value}`,16));
    y+=14;
    report.inputs.forEach(block=>{if(y+100>BOTTOM)fresh();block.forEach((text,i)=>line(text,i===0?17:14,'#17343d',i===0));y+=12;});
    report.notes.forEach(note=>{line(note,13,'#526770');y+=10;});
    for(const section of report.tables){
      fresh();line(section.title,20,'#17343d',true);y+=12;
      const widths=section.widths.map(x=>x*(W-2*M));
      const rowHeight=32;
      function header(){page.push({type:'row',values:section.headers,widths,y,header:true,height:42});y+=42;}
      header();
      for(const values of section.rows){if(y+rowHeight>BOTTOM){fresh();line(section.title,17,'#17343d',true);y+=8;header();}page.push({type:'row',values,widths,y,height:rowHeight});y+=rowHeight;}
    }
    return pages;
  }
  function paint(canvas,items,report,index,total){
    canvas.width=W*2;canvas.height=H*2;const c=canvas.getContext('2d');c.scale(2,2);c.fillStyle='white';c.fillRect(0,0,W,H);c.textBaseline='top';
    c.fillStyle='#17343d';c.font='bold 17px Arial, sans-serif';c.fillText('Loan Calculator',M,36);
    c.fillStyle='#dce5e8';c.fillRect(M,70,W-2*M,1);
    for(const item of items){
      if(item.type==='text'){c.direction=report.rtl?'rtl':'ltr';c.textAlign=report.rtl?'right':'left';c.fillStyle=item.color;c.font=`${item.bold?'bold ':''}${item.size}px Arial, sans-serif`;c.fillText(item.text,report.rtl?W-M:M,item.y);}
      else {c.fillStyle=item.header?'#e7f5ee':'#f7f9fa';c.fillRect(M,item.y,W-2*M,item.height-1);let x=M;
        item.values.forEach((value,i)=>{const width=item.widths[i];c.save();c.beginPath();c.rect(x,item.y,width,item.height);c.clip();c.direction=report.rtl?'rtl':'ltr';c.textAlign='right';c.fillStyle='#17343d';let size=item.header?12:13;c.font=`${item.header?'bold ':''}${size}px Arial, sans-serif`;
          // Headers wrap; numeric cells fit within their own columns.
          if(item.header){const words=String(value).split(' ');let a='',lines=[];for(const word of words){if(c.measureText(a+' '+word).width>width-16&&a){lines.push(a);a=word;}else a+=(a?' ':'')+word;}lines.push(a);if(lines.length>2){size=10;c.font='bold 10px Arial, sans-serif';lines=[String(value)];}lines.slice(0,2).forEach((line,j)=>c.fillText(line,x+width-8,item.y+7+j*15,width-16));}
          else {while(c.measureText(String(value)).width>width-16&&size>9){size--;c.font=`${size}px Arial, sans-serif`;}c.fillText(String(value),x+width-8,item.y+9,width-16);}c.restore();x+=width;});
      }
    }
    c.direction='ltr';c.textAlign='center';c.fillStyle='#62777e';c.font='12px Arial, sans-serif';c.fillText(`${index+1} / ${total}`,W/2,H-38);
  }
  async function create(report){
    await document.fonts.ready;
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),pages=layouts(report,ctx);
    const encoder=new TextEncoder(),parts=[],offsets=[0];let length=0;
    const push=value=>{const bytes=typeof value==='string'?encoder.encode(value):value;parts.push(bytes);length+=bytes.length;};
    const obj=(id,body)=>{offsets[id]=length;push(`${id} 0 obj\n`);push(body);push('\nendobj\n');};
    push('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`);
    for(let i=0;i<pages.length;i++){
      paint(canvas,pages[i],report,i,pages.length);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.94));if(!blob)throw Error('PDF image encoding failed');const jpg=new Uint8Array(await blob.arrayBuffer());
      const pageId=3+i*3,imageId=pageId+1,contentId=pageId+2;
      obj(pageId,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.5 842.25] /Resources << /XObject << /Im ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
      offsets[imageId]=length;push(`${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${W*2} /Height ${H*2} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`);push(jpg);push('\nendstream\nendobj\n');
      const content='q\n595.5 0 0 842.25 0 0 cm\n/Im Do\nQ';obj(contentId,`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`);
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    const xref=length;push(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);offsets.slice(1).forEach(offset=>push(`${String(offset).padStart(10,'0')} 00000 n \n`));push(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(parts,{type:'application/pdf'});
  }
  let lastURL;
  async function download(report){const blob=await create(report);if(lastURL)URL.revokeObjectURL(lastURL);const url=URL.createObjectURL(blob),link=document.createElement('a');lastURL=url;link.href=url;link.download='Loan-Calculator-study.pdf';link.id='download-pdf';link.className='calculate download';link.textContent=report.downloadLabel;const button=document.querySelector('#download-pdf');if(button)button.replaceWith(link);else document.body.append(link);link.click();}
  root.LoanPDF={create,download};
})(globalThis);
