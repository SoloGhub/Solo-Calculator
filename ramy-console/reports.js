/* Reports are generated from an explicit client-data allowlist, never by hiding internal DOM. */
(function(root){
'use strict';
const C=root.RamyCore,E=C.esc;
const kpi=(label,value,sub='')=>`<div class="kpi"><small>${E(label)}</small><strong class="num">${E(value)}</strong><div class="sub">${E(sub)}</div></div>`;
const panel=(title,body)=>`<section class="panel"${title.startsWith('INTERNAL')?' style="break-inside:auto"':''}><div class="panel-head"><h2>${E(title)}</h2></div>${body}</section>`;
const table=(headers,rows)=>`<table class="report-table"><thead><tr>${headers.map(x=>`<th>${E(x)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(x=>`<td dir="auto">${E(x)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}">No records.</td></tr>`}</tbody></table>`;
function body(s,internal=false,exportId='Preview'){
 const p=C.clientProjection(s),g=p.gold,a=p.advisor;
 const title=C.reportNames[internal?s.report.type:p.report.type]||'Client Report';
 const logo=C.safeImage(a.logoImage)||root.RAMY_LOGO;
 let html=`<article class="report-content"><section class="panel"><div class="report-brand"><img class="logo" src="${logo}" alt="RAMY"><div><div class="eyebrow">${internal?'Internal copy':'Client copy'}</div><h1>${E(title)}</h1></div></div><div class="report-meta-grid"><div><small>Client</small><b dir="auto">${E(p.client.name||'Not entered')}</b></div><div><small>Reference</small><b dir="auto">${E(p.client.reference||'Not entered')}</b></div><div><small>Report date / status</small><b>${E(p.report.date)} / ${E(p.report.status)}</b></div><div><small>Export ID</small><b>${E(exportId)}</b></div></div></section>`;
 html+=panel('Portfolio overview',`<div class="kpis">${kpi('Total invested',C.money(p.summary.invested))}${kpi('Current value',C.money(p.summary.current))}${kpi('Performance',C.pct(p.summary.performance),C.money(p.summary.pnl))}${kpi('Active / proposed products',String(p.summary.products))}${kpi('Weighted gold average',C.fmt(g.average,4),'AED per gram')}${kpi('Gold quantity',C.fmt(g.grams/1000,6),'kilograms')}</div><p class="small">Proposal and booked positions are combined. Cancelled gold batches and matured holdings are excluded. Values use entered prices and exchange rates, not live market data. Performance excludes unrecorded fees, distributions and cash flows.</p>${p.warnings.map(w=>`<p class="helper">${E(w)}</p>`).join('')}`);
 const rows=p.holdings.map(h=>[h.name+' · '+C.types[h.type],h.status,C.fmt(C.num(h.invested))+' '+h.currency,C.fmt(C.num(h.current))+' '+h.currency,h.maturity||'Not entered']);
 if(g.grams)rows.unshift(['Gold accumulation',g.batches.length+' active / proposed batches',C.money(g.invested),C.money(g.current),'Price date: '+g.priceDate]);
 html+=panel('Holdings',table(['Product','Status','Invested','Current value','Maturity / valuation'],rows));
 if(p.holdings.some(h=>h.note||h.yield||h.start))html+=panel('Product details',table(['Product','Start','Yield / coupon','Client-facing note'],p.holdings.map(h=>[h.name,h.start||'Not entered',C.pct(C.num(h.yield)),h.note||''])));
 if(g.batches.length)html+=panel('Gold batches',`<p class="small">All-in price is the client purchase price in AED per gram. Current valuation date: ${E(g.priceDate)}.</p>`+table(['Date / reference','Status','Quantity (g)','All-in AED/g','Client total AED'],g.batches.map(b=>[b.date+(b.reference?' · '+b.reference:''),b.status,C.fmt(b.grams),C.fmt(b.allInAEDg,4),C.fmt(b.clientTotalAED)])));
 if(p.client.notes)html+=panel('Client notes',`<div dir="auto" class="report-note">${E(p.client.notes)}</div>`);
 if(internal){
  const x=C.goldSummary(s);
  html+=panel('INTERNAL · Revenue & review',`<div class="kpis">${kpi('Client value',C.money(x.client))}${kpi('Market cost',C.money(x.spot))}${kpi('Gross revenue',C.money(x.revenue))}${kpi('Markup on market cost',C.pct(x.margin))}${kpi('Revenue per gram',C.fmt(x.grams?x.revenue/x.grams:NaN,4),'AED / g')}</div><div dir="auto" class="report-note">${E(s.client.notesInternal)}</div>`+table(['Reference / date','Market cost AED','Revenue AED','Premium','Internal note'],x.valid.map(b=>[b.reference||b.date,C.fmt(b.spotTotalAED),C.fmt(b.revenueAED),C.pct(b.premium),b.internalNote||'']))+`<h3>Export preparation history</h3>`+table(['Export ID','Audience / format','Prepared at (UTC)'],s.reportHistory.slice(0,12).map(r=>[r.id,r.type+' / '+r.format,r.at]))+`<h3>Activity log</h3>`+table(['Time (UTC)','Action','Detail'],s.auditLog.slice(0,12).map(r=>[r.at,r.action,r.detail])));
 }
 html+=`<footer class="report-foot"><div>RAMY · ${internal?'Internal copy':'Client copy'}<br>${E(p.report.date)}<br>Prepared from the supplied client record.</div><div class="signature">${C.safeImage(a.signatureImage)?`<img alt="Advisor signature" src="${C.safeImage(a.signatureImage)}">`:''}<b dir="auto">${E(a.name||'Ramy')}</b><span dir="auto">${E([a.title,a.company,a.phone,a.email].filter(Boolean).join(' · '))}</span></div></footer></article>`;
 return html;
}
function documentHtml(s,internal,exportId,css){
 return '<!doctype html><html lang="en" dir="ltr" data-theme="'+(s.ui.theme==='blue'?'blue':'beige')+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>'+E((internal?'Internal':'Client')+' report - '+s.client.name)+'</title><style>'+css+'@media print{.report-content h3{break-after:avoid-page}}'+'</style></head><body><main class="content" style="padding-bottom:24px">'+body(s,internal,exportId)+'</main></body></html>';
}
root.RamyReports={body,documentHtml,kpi};
})(globalThis);
