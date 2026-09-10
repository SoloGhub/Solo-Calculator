export function number(value){
  if(value===null||value===undefined||String(value).trim()==='')return null;
  const s=String(value).replace(/[٠-٩]/g,x=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(x))).replace(/[۰-۹]/g,x=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x))).replace(/[٬,\s]/g,'').replace(/٫/g,'.');
  if(!/^(?:\d+\.?\d*|\.\d+)$/.test(s))return null;
  const n=Number(s);return Number.isFinite(n)&&n>=0?n:null;
}
export function payment(principal,annualPercent,months){
  if(!Number.isFinite(principal)||principal<0||!Number.isFinite(annualPercent)||annualPercent<0||!Number.isInteger(months)||months<=0)return null;
  const r=annualPercent/1200;
  return r===0?principal/months:principal*r/-Math.expm1(-months*Math.log1p(r));
}
export function presentValue(monthly,rate,months){const unit=payment(1,rate,months);return unit===null?null:Math.max(0,monthly)/unit;}
export function amortization(principal,rate,months,{fixedMonths=months,followRate=null,lifeRate=0,lifeBasis='balance',propertyMonthly=0}={}){
  if(payment(principal,rate,months)===null)return null;
  const rows=[];let balance=principal,currentRate=rate,inst=payment(principal,rate,months),totalInterest=0,totalLife=0;
  for(let m=1;m<=months;m++){
    if(m===fixedMonths+1){if(followRate===null)break;currentRate=followRate;inst=payment(balance,currentRate,months-m+1);}
    const start=balance,interest=start*currentRate/1200,capital=Math.min(start,Math.max(0,inst-interest));
    const life=(lifeBasis==='original'?principal:start)*lifeRate/100;
    balance=Math.max(0,start-capital);totalInterest+=interest;totalLife+=life;
    rows.push({month:m,start,interest,capital,life,property:propertyMonthly,payment:interest+capital,total:interest+capital+life+propertyMonthly,balance});
  }
  return {rows,totalInterest,totalLife,complete:rows.length===months,closing:balance};
}

const ones=['صفر','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة','أحد عشر','اثنا عشر','ثلاثة عشر','أربعة عشر','خمسة عشر','ستة عشر','سبعة عشر','ثمانية عشر','تسعة عشر'];
export function integerWords(n){
  n=Math.round(n);if(!Number.isFinite(n))return 'غير متاح';if(n<0)return 'سالب '+integerWords(-n);if(n<20)return ones[n];
  if(n<100)return (n%10?ones[n%10]+' و':'')+['','','عشرون','ثلاثون','أربعون','خمسون','ستون','سبعون','ثمانون','تسعون'][Math.floor(n/10)];
  if(n<1000)return ['','مئة','مئتان','ثلاثمئة','أربعمئة','خمسمئة','ستمئة','سبعمئة','ثمانمئة','تسعمئة'][Math.floor(n/100)]+(n%100?' و'+integerWords(n%100):'');
  for(const [scale,singular,dual,plural]of [[1e9,'مليار','ملياران','مليارات'],[1e6,'مليون','مليونان','ملايين'],[1e3,'ألف','ألفان','آلاف']])if(n>=scale){const k=Math.floor(n/scale);return(k===1?singular:k===2?dual:integerWords(k)+' '+(k<=10?plural:singular))+(n%scale?' و'+integerWords(n%scale):'');}
}
export function decimalWords(n,digits=2){if(n===null||!Number.isFinite(n))return 'غير متاح';const s=n.toFixed(digits).split('.');return integerWords(Number(s[0]))+(Number(s[1])?' فاصل '+(s[1].match(/^0+/)?.[0].split('').map(()=>'صفر ').join('')||'')+integerWords(Number(s[1])):'');}
export const money=n=>n===null?'غير مكتمل':integerWords(Math.round(n))+' درهم';
export const percentWords=n=>decimalWords(n)+' بالمئة';
