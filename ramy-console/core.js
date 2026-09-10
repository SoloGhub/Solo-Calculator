/* RAMY calculation core. No network, DOM, pricing feed or client persistence. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RamyCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TROY_OZ_G = 31.1034768;
  const currencies = ['AED', 'USD', 'EUR', 'GBP'];
  const modes = ['advisor', 'meeting', 'client', 'internal'];
  const types = {fixed_income:'Fixed Income',fund:'Investment Fund',structured:'Structured Product',deposit:'Deposit / Cash',other:'Other Product'};
  const reportNames = {fresh_proposal:'Fresh Client Proposal',existing_proposal:'Existing Client Proposal',booking_confirmation:'Deal Booking Confirmation',client_statement:'HNWI Client Statement',internal_review:'Internal Review'};
  const copy = value => JSON.parse(JSON.stringify(value));
  const uid = () => globalThis.crypto?.randomUUID?.() || 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2);
  const today = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  function num(value) {
    if (value === null || value === undefined || typeof value === 'boolean') return NaN;
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    let s = String(value).trim().replace(/[٠-٩]/g, c => String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g, c => String(c.charCodeAt(0)-1776)).replace(/٫/g,'.').replace(/٬/g,',');
    if (!s) return NaN;
    if (!/^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?$/.test(s) && !/^[+-]?\.\d+$/.test(s)) return NaN;
    const v = Number(s.replace(/,/g,''));
    return Number.isFinite(v) ? v : NaN;
  }
  const fmt = (value, digits=2) => Number.isFinite(value) ? new Intl.NumberFormat('en-US',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value) : 'Not entered';
  const money = value => Number.isFinite(value) ? fmt(value,2) + ' AED' : 'Not valued';
  const pct = value => Number.isFinite(value) ? fmt(value,2) + '%' : 'Not available';
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function text(v, max=12000) { return String(v ?? '').slice(0,max); }
  function option(v, values, fallback) {return values.includes(v) ? v : fallback;}
  function date(v, fallback='') {
    const s = text(v,10);
    if (!s) return fallback;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error('Invalid date: '+s);
    const d = new Date(s+'T12:00:00Z');
    if (!Number.isFinite(+d) || d.toISOString().slice(0,10)!==s) throw new Error('Invalid date: '+s);
    return s;
  }
  function safeImage(v) {return typeof v==='string' && v.length<=3000000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/.test(v) ? v : '';}
  function blankGold() {return {id:'',date:today(),reference:'',schedule:'one_off',status:'proposal',quantity:'',quantityUnit:'kg',currency:'AED',priceUnit:'per_g',spot:'',allIn:'',premium:'',clientAmount:'',internalNote:''};}
  function blankHolding() {return {id:'',type:'fixed_income',name:'',status:'proposal',currency:'AED',start:today(),invested:'',current:'',maturity:'',yield:'',note:''};}
  function blank() {
    return {version:13,sourceVersion:null,clientId:uid(),updatedAt:'',ui:{mode:'advisor',theme:'beige',language:'english',activeSection:'client'},client:{name:'',reference:'',segment:'HNWI',preferredLanguage:'English',notesClient:'',notesInternal:''},advisor:{name:'Ramy',title:'Relationship Manager',phone:'',email:'',company:'',signatureImage:'',logoImage:''},report:{type:'fresh_proposal',status:'Draft',date:today(),autoSaveMasterOnExport:false},fx:{USD:'',EUR:'',GBP:''},gold:{currentAEDPerGram:'',currentPriceDate:today(),batches:[],draft:blankGold(),narrative:''},holdingDraft:blankHolding(),holdings:[],reportHistory:[],auditLog:[]};
  }
  function validArray(value, label) {
    if (value===undefined) return [];
    if (!Array.isArray(value) || value.length>10000) throw new Error(label+' must be an array of at most 10,000 records.');
    return value;
  }
  function requireNumber(v, label, min=0, positive=false) {
    const x=num(v);
    if (!Number.isFinite(x) || x<min || (positive && x===0)) throw new Error(label+' must be '+(positive?'greater than zero.':'a valid non-negative number.'));
    return x;
  }
  function fxRate(fx, currency) {
    if (currency==='AED') return 1;
    if (!currencies.includes(currency)) return NaN;
    const v=num(fx[currency]);
    return v>0 ? v : NaN;
  }
  function toAEDg(price,currency,unit,fx) {
    const rate=fxRate(fx,currency);
    return price*rate/({per_g:1,per_kg:1000,per_oz:TROY_OZ_G}[unit] || NaN);
  }
  function fromAEDg(price,currency,unit,fx) {return price*({per_g:1,per_kg:1000,per_oz:TROY_OZ_G}[unit] || NaN)/fxRate(fx,currency);}
  function qtyToG(quantity,unit) {return quantity*({g:1,kg:1000,oz:TROY_OZ_G}[unit] || NaN);}
  function solvePrices(spot,allIn,premium) {
    const hs=Number.isFinite(spot),ha=Number.isFinite(allIn),hp=Number.isFinite(premium);
    if ((hs&&spot<=0)||(ha&&allIn<=0)||(hp&&premium<=-100)) throw new Error('Prices must be positive and premium must be greater than -100%.');
    if ([hs,ha,hp].filter(Boolean).length<2) throw new Error('Enter any two: spot price, all-in price, premium. Blank is not zero.');
    if (hs&&ha) {
      const calculated=(allIn/spot-1)*100;
      if (hp&&Math.abs(calculated-premium)>0.01) throw new Error('The three prices disagree. Clear one value or correct the premium (tolerance: 0.01 percentage points).');
      return {spot,allIn,premium:calculated};
    }
    return hs ? {spot,allIn:spot*(1+premium/100),premium} : {spot:allIn/(1+premium/100),allIn,premium};
  }
  function batchFromDraft(d,fx) {
    const quantity=requireNumber(d.quantity,'Quantity',0,true),grams=qtyToG(quantity,d.quantityUnit);
    if (!Number.isFinite(grams)) throw new Error('Select a valid quantity unit.');
    if (!['AED','USD'].includes(d.currency)) throw new Error('Gold price currency must be AED or USD.');
    if (!Number.isFinite(fxRate(fx,d.currency))) throw new Error('Enter the '+d.currency+'/AED exchange rate in Tools before using this currency.');
    for(const [key,label] of [['spot','Spot price'],['allIn','All-in price'],['premium','Premium']]) {
      if(String(d[key]??'').trim() && !Number.isFinite(num(d[key]))) throw new Error(label+' must be numeric or left blank.');
    }
    if (String(d.clientAmount??'').trim()) requireNumber(d.clientAmount,'Target amount');
    const p=solvePrices(toAEDg(num(d.spot),d.currency,d.priceUnit,fx),toAEDg(num(d.allIn),d.currency,d.priceUnit,fx),num(d.premium));
    const spotTotalAED=p.spot*grams,clientTotalAED=p.allIn*grams;
    if (![spotTotalAED,clientTotalAED].every(Number.isFinite)) throw new Error('The amount exceeds the supported numeric range.');
    return {id:d.id||uid(),date:date(d.date,today()),reference:text(d.reference,200),schedule:option(d.schedule,['one_off','monthly','weekly','flexible','existing'],'one_off'),status:option(d.status,['proposal','booked','cancelled'],'proposal'),quantity,quantityUnit:d.quantityUnit,grams,currency:d.currency,priceUnit:d.priceUnit,spotAEDg:p.spot,allInAEDg:p.allIn,premium:p.premium,spotEntered:fromAEDg(p.spot,d.currency,d.priceUnit,fx),allInEntered:fromAEDg(p.allIn,d.currency,d.priceUnit,fx),spotTotalAED,clientTotalAED,revenueAED:clientTotalAED-spotTotalAED,clientAmount:text(d.clientAmount,100),internalNote:text(d.internalNote)};
  }
  function holdingFromDraft(d) {
    if (!text(d.name).trim()) throw new Error('Enter the product name.');
    if (!currencies.includes(d.currency)) throw new Error('Select a valid currency.');
    const invested=requireNumber(d.invested,'Invested amount');
    const current=String(d.current??'').trim()==='' ? '' : requireNumber(d.current,'Current value');
    const start=date(d.start,today()),maturity=date(d.maturity);
    if (maturity&&maturity<start) throw new Error('Maturity must not precede the start date.');
    if (text(d.yield).trim()&&!Number.isFinite(num(d.yield))) throw new Error('Yield must be a number or left blank.');
    return {id:d.id||uid(),type:option(d.type,Object.keys(types),'other'),name:text(d.name,300).trim(),status:option(d.status,['proposal','booked','matured'],'proposal'),currency:d.currency,start,invested,current,maturity,yield:text(d.yield,50),note:text(d.note)};
  }
  function unique(items,label) {
    const ids=new Set();items.forEach(x=>{if(ids.has(x.id)) throw new Error('Duplicate '+label+' identifier: '+x.id);ids.add(x.id);});return items;
  }
  function normalize(input, recoverDrafts=false) {
    if (!input || typeof input!=='object' || Array.isArray(input) || !input.client || !input.gold) throw new Error('This is not a supported client record. Import an editable V11/V12/V13 master or JSON backup.');
    if (input.version && ![11,12,13].includes(Number(input.version))) throw new Error('Unsupported record version: '+input.version);
    const d=blank(),s=input;d.sourceVersion=s.sourceVersion||s.version||null;d.clientId=text(s.clientId,200)||d.clientId;d.updatedAt=text(s.updatedAt,100);
    ['name','reference','segment','preferredLanguage','notesClient','notesInternal'].forEach(k=>d.client[k]=text(s.client[k]??d.client[k]));
    ['name','title','phone','email','company'].forEach(k=>d.advisor[k]=text(s.advisor?.[k]??d.advisor[k]));
    d.advisor.signatureImage=safeImage(s.advisor?.signatureImage);d.advisor.logoImage=safeImage(s.advisor?.logoImage);
    d.ui.theme=option(s.ui?.theme,['beige','blue'],'beige');d.ui.mode=option(s.ui?.mode,modes,'advisor');
    d.ui.activeSection=option(s.ui?.activeSection,['client','gold','portfolio','results','reports','profile','internal'],'client');
    d.report.type=option(s.report?.type,Object.keys(reportNames),'fresh_proposal');d.report.status=text(s.report?.status||'Draft',50);d.report.date=date(s.report?.date,today());d.report.autoSaveMasterOnExport=!!s.report?.autoSaveMasterOnExport;
    ['USD','EUR','GBP'].forEach(c=>{d.fx[c]=s.fx?.[c]??d.fx[c];if(!recoverDrafts&&text(d.fx[c]).trim()) requireNumber(d.fx[c],c+'/AED exchange rate',0,true);});
    d.gold.currentAEDPerGram=s.gold.currentAEDPerGram??'';if(!recoverDrafts&&text(d.gold.currentAEDPerGram).trim()) requireNumber(d.gold.currentAEDPerGram,'Current gold price',0,true);
    d.gold.currentPriceDate=date(s.gold.currentPriceDate,today());d.gold.narrative=text(s.gold.narrative);
    d.gold.batches=unique(validArray(s.gold.batches,'Gold batches').map(b=>{
      if(!b||typeof b!=='object') throw new Error('Invalid gold batch.');
      const grams=requireNumber(b.grams,'Batch grams',0,true),spot=requireNumber(b.spotAEDg,'Batch spot price',0,true),allIn=requireNumber(b.allInAEDg,'Batch all-in price',0,true);
      if (![spot*grams,allIn*grams].every(Number.isFinite)) throw new Error('Batch total exceeds the supported numeric range.');
      const quantityUnit=option(b.quantityUnit,['g','kg','oz'],'g');
      const quantity=Number.isFinite(num(b.quantity))?num(b.quantity):grams/qtyToG(1,quantityUnit);
      if(quantity<=0 || Math.abs(qtyToG(quantity,quantityUnit)-grams)>Math.max(1e-6,grams*1e-8)) throw new Error('Batch quantity and grams disagree.');
      return {id:text(b.id,200)||uid(),date:date(b.date,today()),reference:text(b.reference,200),schedule:option(b.schedule,['one_off','monthly','weekly','flexible','existing'],'one_off'),status:option(b.status,['proposal','booked','cancelled'],'proposal'),quantity,quantityUnit,grams,currency:option(b.currency,['AED','USD'],'AED'),priceUnit:option(b.priceUnit,['per_g','per_kg','per_oz'],'per_g'),spotAEDg:spot,allInAEDg:allIn,premium:(allIn/spot-1)*100,spotEntered:b.spotEntered??'',allInEntered:b.allInEntered??'',spotTotalAED:spot*grams,clientTotalAED:allIn*grams,revenueAED:(allIn-spot)*grams,clientAmount:text(b.clientAmount,100),internalNote:text(b.internalNote)};
    }),'batch');
    d.holdings=unique(validArray(s.holdings,'Holdings').map(h=>holdingFromDraft(h)),'holding');
    for (const k of Object.keys(d.gold.draft)) d.gold.draft[k]=text(s.gold.draft?.[k]??d.gold.draft[k]);
    for (const k of Object.keys(d.holdingDraft)) d.holdingDraft[k]=text(s.holdingDraft?.[k]??d.holdingDraft[k]);
    d.reportHistory=validArray(s.reportHistory,'Report history').slice(0,500).map(r=>({id:text(r.id,200),at:text(r.at,100),type:text(r.type,100),format:text(r.format,100),reportType:text(r.reportType,200),status:text(r.status,100),by:text(r.by,200),priceDate:text(r.priceDate,100)}));
    d.auditLog=validArray(s.auditLog,'Audit log').slice(0,500).map(r=>({id:text(r.id,200),at:text(r.at,100),action:text(r.action,300),detail:text(r.detail)}));
    return d;
  }
  function goldSummary(s) {
    const valid=s.gold.batches.filter(b=>b.status!=='cancelled');
    let grams=0,spot=0,client=0;
    for(const b of valid){grams+=b.grams;spot+=b.spotAEDg*b.grams;client+=b.allInAEDg*b.grams;}
    const current=num(s.gold.currentAEDPerGram),currentValue=grams===0?0:(current>0?grams*current:NaN),pnl=currentValue-client;
    return {valid,grams,spot,client,avgSpot:grams?spot/grams:NaN,avgAllIn:grams?client/grams:NaN,current,currentValue,pnl,performance:client>0?pnl/client*100:NaN,revenue:client-spot,margin:spot>0?(client-spot)/spot*100:NaN};
  }
  function portfolioSummary(s) {
    const gold=goldSummary(s),holdings=s.holdings.filter(h=>h.status!=='matured'),warnings=[];
    let invested=gold.client,current=gold.currentValue;
    if(gold.grams&&!Number.isFinite(gold.currentValue)) warnings.push('Gold needs a positive current price.');
    for(const h of holdings){const rate=fxRate(s.fx,h.currency),cv=num(h.current);if(!Number.isFinite(rate))warnings.push(h.currency+'/AED rate missing for '+h.name+'.');if(!Number.isFinite(cv))warnings.push('Current value missing for '+h.name+'.');invested+=num(h.invested)*rate;current+=cv*rate;}
    const pnl=current-invested;
    return {gold,holdings,invested,current,pnl,performance:invested>0?pnl/invested*100:NaN,products:holdings.length+(gold.grams?1:0),warnings};
  }
  function clientProjection(s) {
    const p=portfolioSummary(s),g=p.gold;
    return {client:{name:s.client.name,reference:s.client.reference,segment:s.client.segment,notes:s.client.notesClient},advisor:{name:s.advisor.name,title:s.advisor.title,company:s.advisor.company,phone:s.advisor.phone,email:s.advisor.email,signatureImage:safeImage(s.advisor.signatureImage),logoImage:safeImage(s.advisor.logoImage)},report:{type:s.report.type==='internal_review'?'client_statement':s.report.type,status:s.report.status,date:s.report.date},summary:{invested:p.invested,current:p.current,pnl:p.pnl,performance:p.performance,products:p.products},gold:{grams:g.grams,average:g.avgAllIn,invested:g.client,current:g.currentValue,performance:g.performance,priceDate:s.gold.currentPriceDate,batches:g.valid.map(b=>({date:b.date,reference:b.reference,status:b.status,grams:b.grams,allInAEDg:b.allInAEDg,clientTotalAED:b.clientTotalAED}))},holdings:p.holdings.map(h=>({type:h.type,name:h.name,status:h.status,currency:h.currency,invested:h.invested,current:h.current,start:h.start,maturity:h.maturity,yield:h.yield,note:h.note})),warnings:p.warnings,theme:s.ui.theme};
  }
  return {TROY_OZ_G,currencies,modes,types,reportNames,copy,uid,today,num,fmt,money,pct,esc,safeImage,blank,blankGold,blankHolding,normalize,fxRate,toAEDg,fromAEDg,qtyToG,solvePrices,batchFromDraft,holdingFromDraft,goldSummary,portfolioSummary,clientProjection};
});
