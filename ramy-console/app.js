/* RAMY mobile workspace. Financial inputs stay on the device; no analytics or market API. */
(()=>{
'use strict';
const C=RamyCore,R=RamyReports,S=RamyStore,$=id=>document.getElementById(id),E=C.esc;
const paths={menu:'M4 6h16M4 12h16M4 18h16',advisor:'M4 21v-3a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v3M9 21l3-8 3 8M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0',meeting:'M3 20v-2a4 4 0 0 1 4-4h3M21 20v-2a4 4 0 0 0-4-4h-3M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0M21 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0M9 17h6',client:'M5 20v-2a6 6 0 0 1 12 0v2M15 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0',internal:'M12 3l8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6zM8 12l3 3 5-6',gold:'M5 7h14l3 12H2zM5 7l2 5h10l2-5M7 12l-2 7M17 12l2 7',portfolio:'M3 7h18v13H3zM8 7V3h8v4M3 12h18M10 12v3h4v-3',results:'M4 20V4M4 20h17M8 16v-5M13 16V8M18 16V5',reports:'M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6',back:'M15 5l-7 7 7 7',next:'M9 5l7 7-7 7',save:'M4 3h14l3 3v15H3V3zM7 3v6h10V3M7 21v-8h10v8',plus:'M12 4v16M4 12h16'};
const icon=n=>`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${paths[n]||paths.reports}"></path></svg>`;
const field=(path,label,{type='text',hint='',options=null,wide=false}={})=>`<label class="field ${wide?'wide':''}"><span>${E(label)}</span>${options?`<select data-field="${path}" id="f-${path.replaceAll('.','-')}">${Object.entries(options).map(([v,t])=>`<option value="${E(v)}">${E(t)}</option>`).join('')}</select>`:type==='textarea'?`<textarea dir="auto" data-field="${path}" id="f-${path.replaceAll('.','-')}" maxlength="12000"></textarea>`:`<input data-field="${path}" id="f-${path.replaceAll('.','-')}" type="${type==='decimal'?'text':type}" ${type==='decimal'?'inputmode="decimal" dir="ltr" autocomplete="off"':type==='date'?'':'dir="auto"'} maxlength="${type==='decimal'?80:300}">`}${hint?`<small>${E(hint)}</small>`:''}<small class="field-error" data-error-for="${path}"></small></label>`;
const btn=(label,action,kind='',extras='')=>`<button type="button" class="btn ${kind}" data-action="${action}" ${extras}>${label}</button>`;
const intro=(n,title,copy,badge='')=>`<div class="intro"><div><div class="step">${E(n)}</div><h1>${E(title)}</h1><p>${E(copy)}</p></div>${badge?`<span class="badge">${E(badge)}</span>`:''}</div>`;
const head=(title,copy='')=>`<div class="panel-head"><div><h2>${E(title)}</h2>${copy?`<p class="small">${E(copy)}</p>`:''}</div></div>`;
const footer=()=>`<footer class="app-footer"><span>Device-local workspace · 13.0</span><b>RAMY</b></footer>`;
const stateGet=path=>path.split('.').reduce((a,k)=>a?.[k],state);
const stateSet=(path,v)=>{const keys=path.split('.');let at=state;keys.slice(0,-1).forEach(k=>at=at[k]);at[keys.at(-1)]=v;};
let state=C.blank(),records=[],screen='welcome',dirty=false,timer,saveChain=Promise.resolve(),revision=0,toastTimer,masterHandle=null,reportHtml='',reportInternal=false,reportExport=null,cssText='',installPrompt=null,swRegistration=null;
let sourceBundle=null,goldTab='entry',holdingTab='entry',handlingHistory=false;
const isClient=()=>['meeting','client'].includes(state.ui.mode);
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,5500);}
function status(text,error=false){$('saveStatus').textContent=text;$('saveStatus').classList.toggle('error',error);}
function audit(action,detail=''){state.auditLog.unshift({id:C.uid(),at:new Date().toISOString(),action,detail});state.auditLog=state.auditLog.slice(0,500);}
function context(){const mode=state.ui.mode[0].toUpperCase()+state.ui.mode.slice(1);$('clientContext').textContent=(state.client.name||'New client')+' · '+mode;$('clientContext').title=[state.client.name,state.client.reference,mode].filter(Boolean).join(' · ');document.documentElement.dataset.theme=state.ui.theme;$('brandLogo').src=C.safeImage(state.advisor.logoImage)||RAMY_LOGO;document.querySelector('meta[name="theme-color"]').content=state.ui.theme==='blue'?'#eaf0f6':'#f4eee4';}
function touch(){dirty=true;revision++;status('Saving on this device…');clearTimeout(timer);timer=setTimeout(()=>save().catch(()=>{}),350);context();}
async function save(){
 clearTimeout(timer);const rev=revision,id=state.clientId;state.updatedAt=new Date().toISOString();const snapshot=C.copy(state);
 const operation=saveChain.catch(()=>{}).then(()=>S.put(snapshot));saveChain=operation;
 try{const backend=await operation;const i=records.findIndex(r=>r.clientId===id);if(i>=0)records[i]=snapshot;else records.push(snapshot);if(id===state.clientId&&rev===revision){dirty=false;status('Saved on device · '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})+(backend.includes('fallback')?' · fallback':''));}return true;}
 catch(e){if(id===state.clientId)status('Not saved · export a backup',true);throw e;}
}
function bindFields(root=$('main')){
 root.querySelectorAll('[data-field]').forEach(el=>{
  const path=el.dataset.field;el.value=stateGet(path)??'';
  if(el.tagName==='SELECT'&&el.value===''){const val=stateGet(path);if(val){const o=new Option(String(val),String(val));el.add(o);el.value=val;}}
  el.addEventListener('input',()=>{stateSet(path,el.value);el.removeAttribute('aria-invalid');const err=root.querySelector(`[data-error-for="${path}"]`);if(err)err.textContent='';touch();if(path.startsWith('gold.draft.'))goldDraftPreview();});
 });
}
function fieldError(path,message){const el=document.querySelector(`[data-field="${path}"]`),err=document.querySelector(`[data-error-for="${path}"]`);if(err)err.textContent=message;if(el){el.setAttribute('aria-invalid','true');el.focus();el.scrollIntoView({block:'center',behavior:'smooth'});}return false;}
function confirmAction(message,label='Continue'){
 const dialog=$('confirmDialog');$('confirmText').textContent=message;$('confirmAccept').textContent=label;dialog.showModal();$('confirmCancel').focus();
 return new Promise(resolve=>{const finish=v=>{dialog.close();$('confirmAccept').onclick=null;$('confirmCancel').onclick=null;dialog.oncancel=null;resolve(v);};$('confirmAccept').onclick=()=>finish(true);$('confirmCancel').onclick=()=>finish(false);dialog.oncancel=e=>{e.preventDefault();finish(false);};});
}
function nav(){
 const labels=isClient()?{results:'Overview',reports:'Reports'}:{client:'Client',gold:'Gold',portfolio:'Portfolio',results:'Results',reports:'Reports'};
 $('navItems').style.gridTemplateColumns=`repeat(${Object.keys(labels).length},minmax(0,1fr))`;
 $('navItems').innerHTML=Object.entries(labels).map(([s,t])=>`<button class="nav-btn" data-action="nav" data-screen="${s}" ${screen===s?'aria-current="page"':''}>${icon(s)}<span>${t}</span></button>`).join('');
 $('bottomNav').hidden=screen==='welcome';
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(screen!=='welcome'&&b.dataset.mode===state.ui.mode)));
}
function render(next=screen,focus=false){
 if(isClient()&&!['welcome','results','reports'].includes(next))next='results';screen=next;if(screen!=='welcome')state.ui.activeSection=screen;
 const pages={welcome:welcomeView,client:clientView,gold:goldView,portfolio:portfolioView,results:resultsView,reports:reportsView,profile:profileView,internal:internalView};
 $('main').innerHTML=pages[screen]()+footer();
 if(screen==='gold'||screen==='portfolio'){
  const gold=screen==='gold',tab=gold?goldTab:holdingTab,action=gold?'gold-tab':'holding-tab';
  const count=gold?state.gold.batches.length:state.holdings.length;
  const tabs=document.createElement('div');tabs.className='entry-tabs';tabs.innerHTML=btn(gold?'Batch inputs':'Product inputs',action,tab==='entry'?'primary':'','data-tab="entry" aria-pressed="'+(tab==='entry')+'"')+btn((gold?'Saved batches':'Saved products')+' ('+count+')',action,tab==='records'?'primary':'','data-tab="records" aria-pressed="'+(tab==='records')+'"');
  $('main').querySelector('.intro').after(tabs);
  const panels=$('main').querySelectorAll(':scope > section.panel');panels.forEach((panel,i)=>panel.hidden=(tab==='entry'?i!==0:i!==1));
 }
 bindFields();context();nav();if(screen==='gold')goldDraftPreview();
 if(focus){window.scrollTo(0,0);$('main').focus({preventScroll:true});if(!handlingHistory){try{history.pushState({ramy:true,screen},'','#'+screen);}catch{}}}
}
function welcomeView(){return `<section class="welcome"><div class="panel"><div class="step">A clearer client conversation</div><h1>Your workspace.<br>One step at a time.</h1><p class="small">Choose a mode above. Advisor opens the inputs; Meeting and Client show the client-facing view; Internal opens revenue and review.</p><div class="flow"><span>01 · Client</span><span>02 · Products</span><span>03 · Results</span><span>04 · Reports</span></div><div class="actions">${btn('Start in Advisor','start','primary')}${btn('Import existing record','import')}</div><div class="helper">${state.client.name?'Recovered record: '+E(state.client.name)+'. Choose a mode to continue.':'No client data is sent to GitHub or a server. Records are saved in this browser on this device.'}</div><small>Keep a Master HTML or JSON backup. Clearing browser data can remove local records. Modes change the presentation; they are not passwords or access permissions.</small></div></section>`;}
function clientView(){return intro('01 / Client','Who are we advising?','These details identify the client on every screen and report.')+`<section class="panel">${head('Client identity','Start here. Product inputs are in the next step.')}<div class="grid">${field('client.name','Client name *')}${field('client.reference','Client reference')}${field('client.segment','Segment',{options:{HNWI:'HNWI','Private Client':'Private Client',Corporate:'Corporate','Family Office':'Family Office',Other:'Other'}})}${field('client.preferredLanguage','Preferred language',{options:{English:'English',Arabic:'Arabic',Bilingual:'Bilingual'},hint:'Client preference; this release’s interface and report labels are English.'})}</div><details class="disclosure"><summary>Client-facing and internal notes</summary><div class="grid">${field('client.notesClient','Notes shown to the client',{type:'textarea'})}${field('client.notesInternal','Private internal notes',{type:'textarea',hint:'Excluded from Client / Meeting views and client report files.'})}</div></details><div class="actions">${btn('Continue to Gold '+icon('next'),'client-next','primary next')}${btn('Other products','client-portfolio')}</div></section><section class="panel">${head('Client records','Open a saved record or create a new one. Current inputs are saved before switching.')}<div class="actions">${btn('Open saved records','records')}${btn('Create new client','new-client')}${btn('Import HTML / JSON','import')}</div><p class="small" style="margin:15px 0 0">Device-local storage. No cross-device synchronisation is configured.</p></section>`;}
function goldView(){return intro('02 / Gold','Gold calculator','Calculate a batch, check the preview, then add it to this client.',state.gold.draft.id?'Editing batch':'New batch')+`<section class="panel">${head('Batch inputs',state.gold.draft.id?'Editing uses saved AED/g prices to preserve the original batch economics.':'Enter quantity and any two of Spot, All-in and Premium.')}<div class="grid">${field('gold.draft.quantity','Quantity *',{type:'decimal'})}${field('gold.draft.quantityUnit','Quantity unit',{options:{g:'Grams (g)',kg:'Kilograms (kg)',oz:'Troy ounces (oz)'}})}${field('gold.draft.currency','Price currency',{options:{AED:'AED',USD:'USD'}})}${field('gold.draft.priceUnit','Price unit',{options:{per_g:'Per gram',per_kg:'Per kilogram',per_oz:'Per troy ounce'}})}${field('gold.draft.spot','Spot / market price',{type:'decimal'})}${field('gold.draft.allIn','All-in / client price',{type:'decimal'})}${field('gold.draft.premium','Premium (%)',{type:'decimal',hint:'Zero is valid. Leave blank when calculating it from the two prices.'})}</div><div id="goldDraftPreview" class="helper" aria-live="polite"></div><details class="disclosure" ${state.gold.draft.id?'open':''}><summary>Batch date, reference and additional details</summary><div class="grid">${field('gold.draft.date','Batch date',{type:'date'})}${field('gold.draft.reference','Batch reference')}${field('gold.draft.schedule','Schedule',{options:{one_off:'One-off',monthly:'Monthly',weekly:'Weekly',flexible:'Flexible / Manual',existing:'Existing Holding'}})}${field('gold.draft.status','Batch status',{options:{proposal:'Proposal',booked:'Booked',cancelled:'Cancelled'}})}${field('gold.draft.clientAmount','Target amount — reference only',{type:'decimal',hint:'Retained from the original record. Does not set the quantity or change the calculation.'})}${field('gold.draft.internalNote','Internal batch note',{type:'textarea'})}</div></details><div id="goldError" class="error-box" role="alert"></div><div class="actions">${btn((state.gold.draft.id?'Save batch changes':'Add gold batch'),'add-gold','primary')}${btn(state.gold.draft.id?'Cancel edit':'Clear inputs','clear-gold')}${btn('View results '+icon('next'),'nav','subtle','data-screen="results"')}</div></section><section class="panel">${head('Saved gold batches',state.gold.batches.length+' records · Editing updates a row; it does not create a duplicate.')}<div class="record-list">${state.gold.batches.map(b=>`<article class="record-card"><h3 dir="auto">${E(b.reference||'Gold batch')}</h3><div class="record-meta">${E(b.date)} · ${E(b.status)} · ${E(b.schedule)}</div><div class="record-values"><div><small>Quantity</small><strong class="num">${C.fmt(b.grams,2)} g</strong></div><div><small>Client total</small><strong class="num">${C.money(b.clientTotalAED)}</strong></div><div><small>All-in price</small><strong class="num">${C.fmt(b.allInAEDg,4)} AED/g</strong></div><div><small>Premium</small><strong class="num">${C.pct(b.premium)}</strong></div></div><div class="record-actions">${btn('Edit','edit-gold','','data-id="'+E(b.id)+'"')}${btn('Delete','delete-gold','danger','data-id="'+E(b.id)+'"')}</div></article>`).join('')||'<div class="empty">No batches added. Calculating a preview does not add a batch.</div>'}</div>${state.gold.batches.length?`<details class="disclosure"><summary>Batch management</summary>${btn('Clear all gold batches','clear-batches','danger')}</details>`:''}</section>`;}
function goldDraftPreview(){
 const el=$('goldDraftPreview');if(!el)return;if(!['quantity','spot','allIn','premium'].some(k=>String(state.gold.draft[k]).trim())){el.textContent='Enter your inputs to see the calculated client total before adding a batch.';return;}try{const b=C.batchFromDraft(state.gold.draft,state.fx);el.innerHTML=`<b>Calculated preview — not added yet</b><br><span class="num">${C.fmt(b.grams,2)} g × ${C.fmt(b.allInAEDg,4)} AED/g = ${C.money(b.clientTotalAED)}</span><br>Premium: ${C.pct(b.premium)} · This preview becomes a saved batch only after you tap the primary button.`;}
 catch(e){el.textContent=e.message;}
}
function portfolioView(){return intro('02 / Other products','Build the portfolio','Record other investments alongside gold. No product-specific pricing model is assumed.',state.holdingDraft.id?'Editing holding':'New holding')+`<section class="panel">${head('Product inputs')}<div class="grid">${field('holdingDraft.type','Product type',{options:C.types})}${field('holdingDraft.name','Product name *')}${field('holdingDraft.currency','Currency',{options:Object.fromEntries(C.currencies.map(c=>[c,c]))})}${field('holdingDraft.status','Status',{options:{proposal:'Proposal',booked:'Booked',matured:'Matured'}})}${field('holdingDraft.invested','Invested amount *',{type:'decimal'})}${field('holdingDraft.current','Current value',{type:'decimal',hint:'Blank means unvalued — not zero and not the invested amount.'})}</div><details class="disclosure"><summary>Dates, coupon and client-facing note</summary><div class="grid">${field('holdingDraft.start','Start date',{type:'date'})}${field('holdingDraft.maturity','Maturity date',{type:'date'})}${field('holdingDraft.yield','Yield / coupon (%)',{type:'decimal'})}${field('holdingDraft.note','Note shown to the client',{type:'textarea'})}</div></details><div id="holdingError" class="error-box" role="alert"></div><div class="actions">${btn(state.holdingDraft.id?'Save product changes':'Add product','add-holding','primary')}${btn(state.holdingDraft.id?'Cancel edit':'Clear inputs','clear-holding')}${btn('View results '+icon('next'),'nav','subtle','data-screen="results"')}</div></section><section class="panel">${head('Portfolio registry',state.holdings.length+' records')}<div class="record-list">${state.holdings.map(h=>`<article class="record-card"><h3 dir="auto">${E(h.name)}</h3><div class="record-meta">${E(C.types[h.type])} · ${E(h.status)}</div><div class="record-values"><div><small>Invested</small><strong class="num">${C.fmt(C.num(h.invested))} ${E(h.currency)}</strong></div><div><small>Current</small><strong class="num">${C.fmt(C.num(h.current))} ${E(h.currency)}</strong></div></div><div class="record-actions">${btn('Edit','edit-holding','','data-id="'+E(h.id)+'"')}${btn('Delete','delete-holding','danger','data-id="'+E(h.id)+'"')}</div></article>`).join('')||'<div class="empty">No other products added. Gold is consolidated automatically.</div>'}</div></section>`;}
function resultsView(){
 if(isClient())return intro('Client-facing view',state.ui.mode==='meeting'?'Meeting overview':'Client preview','No internal economics or editable forms are shown here.')+R.body(state,false);
 const p=C.portfolioSummary(state),g=p.gold;
 return intro('03 / Review','Inputs into insight','Confirm the valuation inputs before using or sharing the results.')+`<section class="panel">${head('Current valuation','Manually entered price; not a live quote.')}<div class="grid">${field('gold.currentAEDPerGram','Current gold price (AED/g)',{type:'decimal'})}${field('gold.currentPriceDate','Gold price date',{type:'date'})}</div><div class="actions">${btn('Update results','refresh-results','primary')}${btn('Exchange rates','fx')}${btn('Set today','today')}</div><div id="valuationError" class="error-box" role="alert"></div></section><div class="kpis">${R.kpi('Total invested',C.money(p.invested))}${R.kpi('Current value',C.money(p.current))}${R.kpi('Performance',C.pct(p.performance),C.money(p.pnl))}${R.kpi('Weighted gold average',C.fmt(g.avgAllIn,4),'AED per gram')}${R.kpi('Gold quantity',C.fmt(g.grams/1000,6),'kilograms')}${R.kpi('Active / proposed products',String(p.products),g.valid.length+' gold batches')}</div>${p.warnings.map(w=>`<div class="helper">${E(w)}</div>`).join('')}<p class="small">Proposal and booked records are combined. Cancelled gold batches and matured products are excluded. Current value is unavailable until all active positions have a current value and a valid FX rate. Gold price date: ${E(state.gold.currentPriceDate)}.</p><div class="actions">${btn('Prepare client report','preview-client','primary')}${btn('Internal review','nav','','data-screen="internal"')}</div>`;
}
function reportsView(){return intro('04 / Reports','A clear client copy','Preview first. Client outputs contain only client-facing information.')+`<section class="panel">${head('Report details')}<div class="grid">${!isClient()?field('report.type','Report type',{options:C.reportNames}):''}${!isClient()?field('report.status','Status',{options:{Draft:'Draft',Indicative:'Indicative',Approved:'Approved',Final:'Final',Booked:'Booked'}}):''}${!isClient()?field('report.date','Report date',{type:'date'}):''}</div><div class="tool-grid">${btn('Client PDF','pdf-client','primary')}${!isClient()?btn('Internal PDF','pdf-internal'):btn('Client preview','preview-client')}${btn('Client HTML snapshot','html-client')}${!isClient()?btn('Internal HTML snapshot','html-internal'):btn('Share client HTML','share-client')}</div><div class="helper">PDF uses the browser’s print dialog. The record logs preparation, not proof that a PDF was saved. Review the selected printer’s preview before sharing.</div></section>${!isClient()?`<section class="panel">${head('Editable record & backup','These files contain internal data. Keep them with the advisor, not the client.')}<div class="tool-grid">${btn('Save Master HTML','master','primary')}${btn('Link / Save same file','link-master')}${btn('Export JSON','json')}${btn('Import HTML / JSON','import')}</div><label class="check"><input id="autoMaster" type="checkbox" ${state.report.autoSaveMasterOnExport?'checked':''}> Save an updated Master HTML when preparing a report. Unsupported browsers download a new copy rather than overwrite a file.</label><p class="small">Master HTML reopens the editable workspace with this client. Client HTML is a read-only report and cannot be imported as a master.</p></section>`:''}`;}
function profileView(){return intro('Advisor profile','The report signature','Only the information entered here appears in the report footer.')+`<section class="panel"><div class="grid">${field('advisor.name','Advisor name')}${field('advisor.title','Title')}${field('advisor.phone','Mobile / WhatsApp',{type:'tel'})}${field('advisor.email','Email',{type:'email'})}${field('advisor.company','Company / team',{wide:true})}</div><details class="disclosure"><summary>Logo and signature images</summary><p class="small">Use a RAMY-approved logo. PNG, JPEG and WebP only, up to 2 MB. SVG uploads are not executed.</p><label class="field"><span>Signature image</span><input id="signatureUpload" type="file" accept="image/png,image/jpeg,image/webp"></label>${C.safeImage(state.advisor.signatureImage)?`<img class="image-preview" src="${C.safeImage(state.advisor.signatureImage)}" alt="Signature preview">`:''}${btn('Remove signature image','remove-signature','subtle')}<label class="field" style="margin-top:15px"><span>RAMY logo image</span><input id="logoUpload" type="file" accept="image/png,image/jpeg,image/webp"></label>${btn('Restore supplied RAMY logo','restore-logo','subtle')}</details><div class="actions">${btn('Back to reports','nav','primary','data-screen="reports"')}</div></section>`;}
function internalView(){return intro('Internal only','Revenue & review','This view is not for client sharing.')+R.body(state,true);}
function toolsBody(){
 const client=isClient();
 return `<div class="eyebrow">${E(state.client.name||'New client')}</div><div class="tool-grid">${btn('Client PDF','pdf-client','primary')}${client?btn('Client preview','preview-client'):btn('Internal PDF','pdf-internal')}${client?btn('Client HTML','html-client'):btn('Save Master HTML','master')}${client?btn('Share client HTML','share-client'):btn('Backup JSON','json')}</div><div class="tool-group"><h3>Appearance</h3><div class="tool-grid">${btn('Elite Beige','theme','','data-theme="beige" aria-pressed="'+(state.ui.theme==='beige')+'"')}${btn('Executive Blue','theme','','data-theme="blue" aria-pressed="'+(state.ui.theme==='blue')+'"')}</div></div>${!client?`<div class="tool-group"><h3>Workspace</h3><div class="tool-grid">${btn('Saved clients','records')}${btn('Create new client','new-client')}${btn('Advisor signature','nav','','data-screen="profile"')}${btn('Internal review','nav','','data-screen="internal"')}${btn('Import record','import')}${btn('Save now','save-now')}</div></div><details id="fxDetails" class="disclosure"><summary>Exchange rates · AED per currency unit</summary><div class="grid">${field('fx.USD','1 USD = AED',{type:'decimal'})}${field('fx.EUR','1 EUR = AED',{type:'decimal'})}${field('fx.GBP','1 GBP = AED',{type:'decimal'})}</div><p class="small">User-entered rates. No live rates are supplied. Imported V11 rates are preserved and must be checked before reporting.</p>${btn('Apply rates','apply-fx','primary')}</details>`:''}<div class="tool-group"><h3>Application</h3><div class="actions">${btn('Install on this phone','install')}${btn('Check for update','update')}</div><p id="installHelp" class="small" style="margin-top:12px">iPhone: open the HTTPS address in Safari, then Share → Add to Home Screen → Open as Web App. Android: use Install app from the browser menu. A downloaded HTML file is not an installed application.</p><p class="small">Storage: ${E(S.backend()||'Not available')}. ${navigator.onLine?'Network available.':'Offline.'} ${swRegistration?'Offline shell registered.':'Offline shell not registered on this page.'}</p></div><div class="helper">Saved records stay in this browser on this device. No cloud sync, server authentication or bank connection is configured. Do not distribute editable master files to clients.</div>`;
}
function openTools(fx=false){$('toolsBody').innerHTML=toolsBody();bindFields($('toolsBody'));if(fx&&$('fxDetails'))$('fxDetails').open=true;$('tools').showModal();$('toolsButton').setAttribute('aria-expanded','true');}
function closeTools(){if($('tools').open)$('tools').close();$('toolsButton').setAttribute('aria-expanded','false');}
async function switchMode(mode){
 if(!C.modes.includes(mode))return;
 if(isClient()&&['advisor','internal'].includes(mode)&&screen!=='welcome'&&!await confirmAction('Return to the advisor workspace? Private inputs and internal economics can become visible.','Return to advisor'))return;
 state.ui.mode=mode;closeTools();render(mode==='internal'?'internal':isClient()?'results':'client',true);touch();
}
async function newClient(){
 if(!await confirmAction('Create a new client? The current client stays in saved records. Any unfinished product inputs remain with that client.','Create new client'))return;
 await save();const previous=state;state=C.blank();state.advisor=C.copy(previous.advisor);state.ui.theme=previous.ui.theme;goldTab=holdingTab='entry';masterHandle=null;audit('Client created');render('client',true);touch();
}
async function showRecords(){
 closeTools();const data=await S.readAll();records=data.records;$('toolsBody').innerHTML=`<p class="small">Select a device-local record. The current record is saved before a different one is opened.</p><div class="record-list">${records.sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||'')).map(r=>`<article class="record-card"><h3 dir="auto">${E(r.client?.name||'Unnamed client')}</h3><div class="record-meta" dir="auto">${E(r.client?.reference||'')} · ${E((r.updatedAt||'').slice(0,16).replace('T',' '))} UTC</div><div class="actions">${btn('Open record','open-record','primary','data-id="'+E(r.clientId)+'"')}</div></article>`).join('')||'<div class="empty">No saved records on this device.</div>'}</div>`;$('tools').showModal();$('toolsButton').setAttribute('aria-expanded','true');
}
function download(name,content,type='text/html;charset=utf-8'){
 const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);return blob;
}
const slug=v=>String(v||'Client').replace(/[^\p{L}\p{N}_-]+/gu,'_').slice(0,70);
async function loadSources(){
 if(sourceBundle)return sourceBundle;
 const styles=document.querySelector('link[rel="stylesheet"]'),inline=document.querySelector('style[data-app-style]');
 const css=styles?await fetch(styles.href).then(r=>{if(!r.ok)throw new Error('Could not load report styles');return r.text();}):inline?.textContent||'';
 const scripts=[];for(const el of document.querySelectorAll('script[src]')){const text=await fetch(el.src).then(r=>{if(!r.ok)throw new Error('Could not load application source');return r.text();});scripts.push({src:el.getAttribute('src'),text});}
 cssText=css;sourceBundle={css,scripts};return sourceBundle;
}
async function masterDocument(){
 const bundle=await loadSources();const clone=document.documentElement.cloneNode(true);clone.removeAttribute('data-ready');
 clone.querySelector('#embedded-state').textContent=JSON.stringify(state).replace(/</g,'\\u003c');
 clone.querySelector('#main').innerHTML='';clone.querySelector('#toolsBody').innerHTML='';clone.querySelector('#modes').innerHTML='';clone.querySelector('#navItems').innerHTML='';clone.querySelector('#reportFrame').removeAttribute('srcdoc');clone.querySelector('#toast').hidden=true;clone.querySelectorAll('dialog').forEach(d=>d.removeAttribute('open'));
 clone.querySelector('#clientContext').textContent='Opening client record';clone.querySelector('#saveStatus').textContent='Opening workspace…';
 clone.querySelectorAll('link[rel="manifest"],link[rel="icon"],link[rel="apple-touch-icon"]').forEach(x=>x.remove());
 const styleLink=clone.querySelector('link[rel="stylesheet"]');if(styleLink){const style=document.createElement('style');style.dataset.appStyle='';style.textContent=bundle.css;styleLink.replaceWith(style);}
 clone.querySelectorAll('script[src]').forEach(el=>{const script=bundle.scripts.find(s=>s.src===el.getAttribute('src'));if(!script)throw new Error('Missing script in master export');el.removeAttribute('src');el.textContent=script.text.replace(/<\/script/gi,'<\\/script');});
 return '<!doctype html>\n'+clone.outerHTML;
}
async function saveMaster(sameFile=false){
 const html=await masterDocument(),name='RAMY_Master_'+slug(state.client.name)+'.html';
 if(sameFile&&!masterHandle&&window.showSaveFilePicker){try{masterHandle=await showSaveFilePicker({suggestedName:name,types:[{description:'Editable RAMY master',accept:{'text/html':['.html']}}]});}catch(e){if(e.name==='AbortError')return;masterHandle=null;}}
 if(masterHandle){try{const writer=await masterHandle.createWritable();await writer.write(html);await writer.close();toast('Master file updated.');return;}catch(e){masterHandle=null;toast('Direct file access unavailable. Downloading a fresh master.');}}
 download(name,html);toast('Master HTML download requested. Check your browser’s downloads.');
}
function logReport(internal,format){const record={id:'R-'+C.uid(),at:new Date().toISOString(),type:internal?'Internal':'Client',format,reportType:C.reportNames[state.report.type],status:state.report.status,by:state.advisor.name,priceDate:state.gold.currentPriceDate};state.reportHistory.unshift(record);state.reportHistory=state.reportHistory.slice(0,500);audit('Report prepared',record.type+' / '+format+' / '+record.id);touch();return record;}
async function prepare(internal=false,format='Preview'){
 if(!state.client.name.trim()){if(!isClient())render('client',true);fieldError('client.name','Enter the client name before preparing a report.');throw new Error('A client name is required.');}
 if(isClient()&&internal)throw new Error('Internal reports are not available in this mode.');
 C.normalize(state);await loadSources();const ex=logReport(internal,format);const html=R.documentHtml(state,internal,ex.id,cssText);
 try{await save();}catch(e){toast(e.message);}
 if(state.report.autoSaveMasterOnExport&&!isClient())await saveMaster();
 return {html,ex};
}
async function previewReport(internal,format='Preview'){
 const {html,ex}=await prepare(internal,format);closeTools();reportHtml=html;reportInternal=internal;reportExport=ex;$('previewTitle').textContent=(internal?'Internal':'Client')+' report preview';$('reportFrame').srcdoc=html;$('preview').showModal();
}
async function saveReport(internal){const {html,ex}=await prepare(internal,'HTML');download('RAMY_'+slug(state.client.name)+'_'+(internal?'Internal':'Client')+'_'+ex.id+'.html',html);toast('Report HTML download requested.');}
async function shareFile(html,name){
 const file=new File([html],name,{type:'text/html'});
 if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'RAMY client report'});return;}catch(e){if(e.name==='AbortError')return;}}
 download(name,html);toast('File sharing is unavailable here. An HTML download was requested.');
}
async function importFile(file){
 if(file.size>12000000)throw new Error('Import limit is 12 MB.');const text=await file.text();let imported;
 if(file.name.toLowerCase().endsWith('.json'))imported=JSON.parse(text);else{const doc=new DOMParser().parseFromString(text,'text/html'),node=doc.querySelector('#embedded-state');if(!node)throw new Error('No editable record found. Client snapshots are read-only.');imported=JSON.parse(node.textContent);}
 const normalized=C.normalize(imported);
 if(!await confirmAction('Import '+(normalized.client.name||'an unnamed client')+'? The current record will be saved first. A record with the same ID will be replaced by this imported copy.','Import record'))return;
 await save();state=normalized;state.ui.mode='advisor';goldTab=holdingTab='entry';masterHandle=null;sourceBundle=null;closeTools();audit('Record imported',file.name);render('client',true);touch();await save();toast('Imported. Check all dates, exchange rates and valuations before reporting.');
}
async function readImage(file,key){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2000000)throw new Error('Use a PNG, JPEG or WebP no larger than 2 MB.');
 const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Image could not be read'));r.readAsDataURL(file);});
 if(!C.safeImage(data))throw new Error('Unsupported image.');
 const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Invalid image contents'));image.src=data;});
 state.advisor[key]=data;touch();render('profile');
}
function requireClient(){if(state.client.name.trim())return true;render('client',true);return fieldError('client.name','Enter the client name first so this product is attached to the right record.');}
function validateValuation(){const v=state.gold.currentAEDPerGram;if(String(v).trim()&&!(C.num(v)>0))return fieldError('gold.currentAEDPerGram','Enter a positive price, or leave blank for no valuation.');return true;}
async function dispatch(action,el){
 if(action==='gold-tab'||action==='holding-tab'){if(action==='gold-tab')goldTab=el.dataset.tab;else holdingTab=el.dataset.tab;render(screen,true);}
 else if(action==='nav'){closeTools();render(el.dataset.screen,true);touch();}
 else if(action==='start')await switchMode('advisor');
 else if(action==='client-next'||action==='client-portfolio'){if(requireClient()){render(action==='client-next'?'gold':'portfolio',true);touch();}}
 else if(action==='theme'){state.ui.theme=el.dataset.theme;render();$('toolsBody').innerHTML=toolsBody();bindFields($('toolsBody'));touch();}
 else if(action==='new-client')await newClient();
 else if(action==='records')await showRecords();
 else if(action==='open-record'){const next=records.find(r=>r.clientId===el.dataset.id);if(next){await save();state=C.normalize(next,true);state.ui.mode='advisor';goldTab=holdingTab='entry';masterHandle=null;closeTools();render('client',true);touch();}}
 else if(action==='save-now'){await save();toast('Saved on this device.');}
 else if(action==='import'){$('importFile').click();}
 else if(action==='fx'){openTools(true);}
 else if(action==='apply-fx'){for(const c of ['USD','EUR','GBP']){const v=state.fx[c];if(String(v).trim()&&!(C.num(v)>0))return fieldError('fx.'+c,'Enter a positive exchange rate, or leave it blank.');}await save();closeTools();render(screen);toast('Exchange rates applied.');}
 else if(action==='today'){state.report.date=C.today();state.gold.currentPriceDate=C.today();render();touch();}
 else if(action==='refresh-results'){if(validateValuation()){render();touch();}}
 else if(action==='add-gold'){
  if(!requireClient())return;try{const b=C.batchFromDraft(state.gold.draft,state.fx),i=state.gold.batches.findIndex(x=>x.id===b.id);if(i>=0)state.gold.batches[i]=b;else state.gold.batches.push(b);audit(i>=0?'Gold batch edited':'Gold batch added',b.reference||b.id);state.gold.draft=C.blankGold();goldTab='records';render('gold',true);touch();toast(i>=0?'Batch updated — no duplicate created.':'Gold batch added to '+state.client.name+'.');}
  catch(e){$('goldError').textContent=e.message;if(!C.num(state.gold.draft.quantity)||C.num(state.gold.draft.quantity)<0)fieldError('gold.draft.quantity','Enter a quantity greater than zero.');else $('goldError').scrollIntoView({block:'center'});}
 }
 else if(action==='add-holding'){
  if(!requireClient())return;try{const h=C.holdingFromDraft(state.holdingDraft),i=state.holdings.findIndex(x=>x.id===h.id);if(i>=0)state.holdings[i]=h;else state.holdings.push(h);audit(i>=0?'Holding edited':'Holding added',h.name);state.holdingDraft=C.blankHolding();holdingTab='records';render('portfolio',true);touch();toast(i>=0?'Product updated — no duplicate created.':'Product added to '+state.client.name+'.');}
  catch(e){$('holdingError').textContent=e.message;if(!state.holdingDraft.name.trim())fieldError('holdingDraft.name','Enter the product name.');else $('holdingError').scrollIntoView({block:'center'});}
 }
 else if(action==='edit-gold'){
  const b=state.gold.batches.find(x=>x.id===el.dataset.id);if(!b)return;if(state.gold.draft.id!==b.id&&['quantity','spot','allIn','premium','reference','internalNote','clientAmount'].some(k=>String(state.gold.draft[k]??'').trim())&&!await confirmAction('Replace the unfinished gold inputs with this saved batch? Saved batches will not be changed until you save the edit.','Open saved batch'))return;state.gold.draft={...C.blankGold(),...b,currency:'AED',priceUnit:'per_g',spot:String(b.spotAEDg),allIn:String(b.allInAEDg),premium:''};goldTab='entry';render('gold',true);touch();
 }
 else if(action==='edit-holding'){const h=state.holdings.find(x=>x.id===el.dataset.id);if(h){if(state.holdingDraft.id!==h.id&&['name','invested','current','yield','note'].some(k=>String(state.holdingDraft[k]??'').trim())&&!await confirmAction('Replace the unfinished product inputs with this saved holding?','Open saved product'))return;state.holdingDraft=C.copy(h);holdingTab='entry';render('portfolio',true);touch();}}
 else if(action==='clear-gold'||action==='clear-holding'){
  if(!await confirmAction('Clear the current input form? Saved products and batches will not be deleted.','Clear inputs'))return;
  if(action==='clear-gold')state.gold.draft=C.blankGold();else state.holdingDraft=C.blankHolding();render();touch();
 }
 else if(action==='delete-gold'||action==='delete-holding'){
  if(!await confirmAction('Delete this '+(action==='delete-gold'?'gold batch':'product')+' from '+(state.client.name||'this client')+'? This changes the portfolio totals.','Delete record'))return;
  if(action==='delete-gold'){state.gold.batches=state.gold.batches.filter(x=>x.id!==el.dataset.id);if(state.gold.draft.id===el.dataset.id)state.gold.draft=C.blankGold();}else{state.holdings=state.holdings.filter(x=>x.id!==el.dataset.id);if(state.holdingDraft.id===el.dataset.id)state.holdingDraft=C.blankHolding();}audit('Record deleted',el.dataset.id);render();touch();
 }
 else if(action==='clear-batches'){if(await confirmAction('Delete ALL gold batches for this client? Other products will be kept.','Delete all batches')){state.gold.batches=[];state.gold.draft=C.blankGold();audit('All gold batches deleted');render();touch();}}
 else if(action==='remove-signature'||action==='restore-logo'){state.advisor[action==='remove-signature'?'signatureImage':'logoImage']='';render();touch();}
 else if(action==='json'){download('RAMY_Backup_'+slug(state.client.name)+'.json',JSON.stringify(state,null,2),'application/json');toast('JSON backup download requested. This contains internal data.');}
 else if(action==='master'||action==='link-master')await saveMaster(action==='link-master');
 else if(action==='preview-client')await previewReport(false);
 else if(action==='pdf-client'||action==='pdf-internal')await previewReport(action==='pdf-internal','PDF preview');
 else if(action==='html-client'||action==='html-internal')await saveReport(action==='html-internal');
 else if(action==='share-client'){const {html}=await prepare(false,'Shared HTML');await shareFile(html,'RAMY_Client_'+slug(state.client.name)+'.html');}
 else if(action==='install'){
  if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;}
  else{$('installHelp')?.scrollIntoView({block:'center'});toast(location.protocol==='file:'?'Install requires a published HTTPS address, not a downloaded file.':'Use the browser Share or menu button, then Add to Home Screen / Install app.');}
 }
 else if(action==='update'){
  if(!swRegistration){toast('A published HTTPS or localhost address is required for application updates.');return;}
  await swRegistration.update();if(swRegistration.waiting&&await confirmAction('An update is ready. Save the current record and reload the application?','Save and reload')){await save();navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});swRegistration.waiting.postMessage('SKIP_WAITING');}else toast('Update check completed. New updates appear after the browser finishes downloading them.');
 }
}
function wire(){
 $('toolsButton').innerHTML=icon('menu');$('toolsButton').onclick=()=>openTools();$('closeTools').onclick=closeTools;$('tools').addEventListener('close',()=>$('toolsButton').setAttribute('aria-expanded','false'));
 $('modes').innerHTML=C.modes.map(m=>`<button class="mode" data-mode="${m}" aria-pressed="false">${icon(m)}<span>${m[0].toUpperCase()+m.slice(1)}</span></button>`).join('');
 document.addEventListener('click',async e=>{const mode=e.target.closest('[data-mode]'),el=e.target.closest('[data-action]');try{if(mode){await switchMode(mode.dataset.mode);return;}if(!el||el.disabled)return;el.disabled=true;await dispatch(el.dataset.action,el);}catch(err){toast(err.message||'The action could not be completed.');}finally{if(el)el.disabled=false;}});
 document.addEventListener('change',e=>{if(e.target.id==='autoMaster'){state.report.autoSaveMasterOnExport=e.target.checked;touch();}if(['signatureUpload','logoUpload'].includes(e.target.id)&&e.target.files[0])readImage(e.target.files[0],e.target.id==='signatureUpload'?'signatureImage':'logoImage').catch(e=>toast(e.message));});
 $('importFile').onchange=async e=>{try{if(e.target.files[0])await importFile(e.target.files[0]);}catch(err){toast('Import rejected: '+err.message);}finally{e.target.value='';}};
 $('closePreview').onclick=()=>$('preview').close();$('preview').addEventListener('close',()=>{$('reportFrame').removeAttribute('srcdoc');reportHtml='';});
 $('printPreview').onclick=()=>{try{if(!$('reportFrame').contentDocument?.querySelector('.report-content'))throw new Error('The report is still loading.');logReport(reportInternal,'Print dialog requested');$('reportFrame').contentWindow.focus();$('reportFrame').contentWindow.print();}catch(e){toast(e.message);}};
 $('downloadPreview').onclick=()=>{if(reportHtml)download('RAMY_'+(reportInternal?'Internal':'Client')+'_'+slug(state.client.name)+'_'+reportExport.id+'.html',reportHtml);};
 $('sharePreview').onclick=()=>{if(reportHtml)shareFile(reportHtml,'RAMY_'+(reportInternal?'Internal':'Client')+'_'+slug(state.client.name)+'.html').catch(e=>toast(e.message));};
 window.addEventListener('popstate',e=>{if(!e.state?.ramy)return;closeTools();if($('preview').open)$('preview').close();handlingHistory=true;render(e.state.screen||'client',true);handlingHistory=false;touch();});
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&dirty)save().catch(()=>{});});
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
 window.addEventListener('online',()=>toast('Network available. Client records remain on this device.'));
 window.addEventListener('offline',()=>toast('Offline. Local calculations and saved records remain available.'));
 if(window.visualViewport)visualViewport.addEventListener('resize',()=>{const keyboard=window.innerHeight-visualViewport.height>150;$('bottomNav').style.visibility=keyboard?'hidden':'';});
}
async function init(){
 let warning='',fromFile=false;try{
  const embedded=JSON.parse($('embedded-state').textContent||'null');const data=await S.readAll();records=data.records;
  if(embedded){fromFile=true;state=C.normalize(embedded,true);const stored=records.find(r=>r.clientId===state.clientId);if(stored&&(stored.updatedAt||'')>(state.updatedAt||'')){state=C.normalize(stored,true);warning='A newer saved copy of this client was recovered from this device.';}}
  else {const last=records.find(r=>r.clientId===data.last);if(last)state=C.normalize(last,true);}
 }catch(e){warning=e.message;try{const embedded=JSON.parse($('embedded-state').textContent||'null');if(embedded){fromFile=true;state=C.normalize(embedded,true);}}catch{warning='The embedded record could not be read. The original file has not been changed.';}}
 wire();render('welcome');status(fromFile?'Opened embedded client record':state.updatedAt?'Recovered device record':'Ready · no client entered',!!warning);try{history.replaceState({ramy:true,screen:'welcome'},'');}catch{}if(warning)toast(warning);
 if(location.protocol!=='file:'&&'serviceWorker'in navigator){try{swRegistration=await navigator.serviceWorker.register('./sw.js',{scope:'./'});}catch{/* Installation is optional; data entry must continue. */}}
 document.documentElement.dataset.ready='true';
}
init().catch(e=>{status('Application could not start',true);$('main').innerHTML='<div class="error-box">'+E(e.message)+'</div>';});
})();
