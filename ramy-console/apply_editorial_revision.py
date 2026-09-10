"""Checked one-time editorial migration. Financial formulae and client references are not changed."""
from pathlib import Path
import json
p=Path(__file__).resolve().parent
changes=[]
def apply(name,mapping):
 s=(p/name).read_text()
 for old,new in mapping.items():
  count=s.count(old)
  if not count:raise RuntimeError(f'{name}: expected source missing: {old[:100]}')
  s=s.replace(old,new);changes.append((name,count,old,new))
 (p/name).write_text(s)
apply('core.js',{
 "fresh_proposal:'Fresh Client Proposal',existing_proposal:'Existing Client Proposal',booking_confirmation:'Deal Booking Confirmation',client_statement:'HNWI Client Statement',internal_review:'Internal Review'":"fresh_proposal:'Investment proposal',existing_proposal:'Portfolio proposal',booking_confirmation:'Transaction confirmation',client_statement:'Portfolio statement',internal_review:'Internal review'",
 "fixed_income:'Fixed Income',fund:'Investment Fund',structured:'Structured Product',deposit:'Deposit / Cash',other:'Other Product'":"fixed_income:'Fixed income',fund:'Investment fund',structured:'Structured product',deposit:'Deposit / cash',other:'Other investment'"
})
apply('app.js',{
 "const intro=(n,title,copy,badge='')=>`<div class=\"intro\"><div><div class=\"step\">${E(n)}</div><h1>${E(title)}</h1><p>${E(copy)}</p></div>${badge?`<span class=\"badge\">${E(badge)}</span>`:''}</div>`;":"const artwork=n=>globalThis.RAMY_ARTWORK?.[n]?`<img class=\"section-art\" src=\"${RAMY_ARTWORK[n]}\" alt=\"\" aria-hidden=\"true\" width=\"96\" height=\"96\">`:'';\nconst intro=(section,title,copy,badge='')=>`<div class=\"intro\"><div class=\"intro-copy\"><h1>${E(title)}</h1>${copy?`<p>${E(copy)}</p>`:''}${badge?`<span class=\"badge\">${E(badge)}</span>`:''}</div>${artwork(section)}</div>`;\nconst statusLabel=s=>({proposal:'Proposed',booked:'Booked',cancelled:'Cancelled',matured:'Matured'}[s]||s);\nconst scheduleLabel=s=>({one_off:'One-off',monthly:'Monthly',weekly:'Weekly',flexible:'Flexible',existing:'Existing holding'}[s]||s);",
 '<span>Device-local workspace · 13.0</span>':'<span>Client portfolio</span>',
 "(state.client.name||'New client')":"(state.client.name||'No client selected')",
 "{client:'Client',gold:'Gold',portfolio:'Portfolio',results:'Results',reports:'Reports'}":"{client:'Client',gold:'Gold',portfolio:'Holdings',results:'Overview',reports:'Reports'}",
 "gold?'Batch inputs':'Product inputs'":"gold?'Transaction details':'Investment details'",
 "gold?'Saved batches':'Saved products'":"gold?'Transactions':'Holdings'",
 "intro('01 / Client','Who are we advising?','These details identify the client on every screen and report.')":"intro('client','Client profile','Client information and reporting preferences.')",
 "head('Client identity','Start here. Product inputs are in the next step.')":"head('Client details','Required fields are marked with an asterisk.')",
 "Segment',{options:{HNWI:'HNWI','Private Client':'Private Client',Corporate:'Corporate','Family Office':'Family Office',Other:'Other'}}":"Client category',{options:{HNWI:'HNWI','Private Client':'Private client',Corporate:'Corporate','Family Office':'Family office',Other:'Other'}}",
 "Client preference; this release’s interface and report labels are English.":"",
 'Client-facing and internal notes':'Notes and confidentiality',
 'Notes shown to the client':'Client report notes',
 'Private internal notes':'Internal notes',
 'Excluded from Client / Meeting views and client report files.':'Not included in client reports.',
 'Continue to Gold ':'Gold calculator ',
 "btn('Other products','client-portfolio')":"btn('Investment holdings','client-portfolio')",
 'Open a saved record or create a new one. Current inputs are saved before switching.':'Current changes are saved before another record is opened.',
 'Open saved records':'Saved clients',
 'Create new client':'New client',
 'Device-local storage. No cross-device synchronisation is configured.':'Records are stored on this device. Keep a separate backup.',
 "intro('02 / Gold','Gold calculator','Calculate a batch, check the preview, then add it to this client.',state.gold.draft.id?'Editing batch':'New batch')":"intro('gold','Gold calculator','Purchase pricing and transaction records.',state.gold.draft.id?'Edit transaction':'New transaction')",
 "head('Batch inputs',state.gold.draft.id?'Editing uses saved AED/g prices to preserve the original batch economics.':'Enter quantity and any two of Spot, All-in and Premium.')":"head('Pricing details',state.gold.draft.id?'Original transaction prices are retained in AED per gram.':'Enter the quantity and any two of spot price, purchase price and premium.')",
 'Spot / market price':'Spot price',
 'All-in / client price':'Purchase price (all-in)',
 'Zero is valid. Leave blank when calculating it from the two prices.':'Leave blank to calculate the premium from the two prices.',
 'Batch date, reference and additional details':'Transaction details and notes',
 'Batch date':'Transaction date',
 'Batch reference':'Transaction reference',
 'Batch status':'Transaction status',
 "existing:'Existing Holding'":"existing:'Existing holding'",
 "flexible:'Flexible / Manual'":"flexible:'Flexible / manual'",
 'Internal batch note':'Internal transaction note',
 'Retained from the original record. Does not set the quantity or change the calculation.':'For reference only. This amount does not determine the quantity.',
 'Save batch changes':'Save transaction',
 'Add gold batch':'Add transaction',
 'View results ':'Portfolio overview ',
 "head('Saved gold batches',state.gold.batches.length+' records · Editing updates a row; it does not create a duplicate.')":"head('Gold transactions',state.gold.batches.length+' recorded transactions')",
 "${E(b.reference||'Gold batch')}":"${E(b.reference||'Gold purchase')}",
 '${E(b.status)} · ${E(b.schedule)}':'${E(statusLabel(b.status))} · ${E(scheduleLabel(b.schedule))}',
 'No batches added. Calculating a preview does not add a batch.':'No gold transactions recorded.',
 'Batch management':'Manage transactions',
 'Clear all gold batches':'Delete all gold transactions',
 'Enter your inputs to see the calculated client total before adding a batch.':'The purchase amount will appear here once the pricing details are complete.',
 'Calculated preview — not added yet':'Purchase amount · not yet recorded',
 'This preview becomes a saved batch only after you tap the primary button.':'Select Add transaction to save this purchase.',
 "intro('02 / Other products','Build the portfolio','Record other investments alongside gold. No product-specific pricing model is assumed.',state.holdingDraft.id?'Editing holding':'New holding')":"intro('portfolio','Investment holdings','Investment amounts, valuations and maturity details.',state.holdingDraft.id?'Edit holding':'New holding')",
 "head('Product inputs')":"head('Investment details')",
 'Blank means unvalued — not zero and not the invested amount.':'Leave blank when a current valuation is not available.',
 'Dates, coupon and client-facing note':'Dates, income and notes',
 'Note shown to the client':'Client report note',
 "head('Portfolio registry',state.holdings.length+' records')":"head('Investment holdings',state.holdings.length+' recorded holdings')",
 '${E(C.types[h.type])} · ${E(h.status)}':'${E(C.types[h.type])} · ${E(statusLabel(h.status))}',
 'No other products added. Gold is consolidated automatically.':'No other investments recorded. Gold is included in the portfolio overview.',
 "intro('Client-facing view',state.ui.mode==='meeting'?'Meeting overview':'Client preview','No internal economics or editable forms are shown here.')":"intro('results','Portfolio overview','')",
 "intro('03 / Review','Inputs into insight','Confirm the valuation inputs before using or sharing the results.')":"intro('results','Portfolio overview','Valuation, performance and consolidated holdings.')",
 'Manually entered price; not a live quote.':'Valuation uses the price and date entered below, not a live quote.',
 "btn('Update results','refresh-results'":"btn('Update valuation','refresh-results'",
 "btn('Set today','today')":"btn('Use today’s date','today')",
 "intro('04 / Reports','A clear client copy','Preview first. Client outputs contain only client-facing information.')":"intro('reports','Reports','Prepare and review portfolio documents.')",
 "intro('Advisor profile','The report signature','Only the information entered here appears in the report footer.')":"intro('client','Advisor details','Contact details and report signature.')",
 "intro('Internal only','Revenue & review','This view is not for client sharing.')":"intro('internal','Internal review','Confidential pricing and revenue information.')",
 'SVG uploads are not executed.':'SVG is not supported for uploads.',
 'Direct file access unavailable. Downloading a fresh master.':'Direct file access is unavailable. A new editable copy will be downloaded.',
 "toast(i>=0?'Batch updated — no duplicate created.':'Gold batch added to '+state.client.name+'.')":"toast(i>=0?'Transaction updated.':'Transaction saved for '+state.client.name+'.')",
 "toast(i>=0?'Product updated — no duplicate created.':'Product added to '+state.client.name+'.')":"toast(i>=0?'Holding updated.':'Holding saved for '+state.client.name+'.')",
 "$('toolsButton').innerHTML=icon('menu');":"$('viewsToggle').onclick=()=>{const hidden=!$('modeBar').hidden;$('modeBar').hidden=hidden;$('viewsToggle').setAttribute('aria-expanded',String(!hidden));};\n $('toolsButton').innerHTML=icon('menu');"
})
s=(p/'app.js').read_text();a=s.index('function welcomeView()');b=s.index('\nfunction clientView()',a)
s=s[:a]+'''function welcomeView(){return `<section class="welcome"><div class="welcome-panel panel"><div class="welcome-heading"><div><h1>Portfolio workspace</h1><p>Client records, investment calculations and reporting.</p></div>${artwork('portfolio')}</div><div class="actions">${btn('Open client profile','start','primary')}${btn('Import client record','import')}</div><div class="workspace-grid">${[['gold','Gold calculator','Purchase pricing'],['portfolio','Investment holdings','Portfolio records'],['results','Portfolio overview','Valuation and performance'],['reports','Reports','Client and internal documents']].map(([section,title,description])=>`<button class="workspace-tile" type="button" data-action="nav" data-screen="${section}">${artwork(section)}<span><strong>${title}</strong><small>${description}</small></span>${icon('next')}</button>`).join('')}</div><div class="helper">${state.client.name?'Last opened: '+E(state.client.name):'No client selected.'}</div><details class="disclosure"><summary>Privacy and local storage</summary><p class="small">Records are stored in this browser on this device. Keep an editable HTML or JSON backup before clearing browser data. Display modes do not provide password protection. Share client reports only; editable records contain internal information.</p></details></div></section>`;}''' +s[b:]
(p/'app.js').write_text(s)
apply('reports.js',{
 "title.startsWith('INTERNAL')":"title.startsWith('Internal')",
 "'Client Report'":"'Portfolio report'",
 "'Internal copy':'Client copy'":"'Confidential · Internal':'Portfolio report'",
 'Export ID':'Document reference',
 "'Active / proposed products'":"'Recorded investments'",
 "'Weighted gold average'":"'Average gold purchase price'",
 "'Gold accumulation'":"'Gold holdings'",
 "'Gold batches'":"'Gold transactions'",
 'active / proposed batches':'proposed / booked transactions',
 'All-in price is the client purchase price in AED per gram. Current valuation date:':'Purchase prices include the premium and are expressed in AED per gram. Valuation date:',
 "'All-in AED/g','Client total AED'":"'Purchase price AED/g','Purchase amount AED'",
 "'Client-facing note'":"'Notes'",
 "'INTERNAL · Revenue & review'":"'Internal · Revenue and pricing'",
 'Export preparation history':'Report history',
 'Prepared from the supplied client record.':'Prepared using the recorded portfolio information.'
})
apply('index.html',{
 '<strong>Multi-Product Console</strong>':'<strong>Portfolio console</strong>',
 '<button id="toolsButton"':'<button id="viewsToggle" class="views-toggle" aria-controls="modeBar" aria-expanded="true">Views</button><button id="toolsButton"',
 '<div class="mode-wrap">':'<div id="modeBar" class="mode-wrap">',
 'aria-label="Client workflow"':'aria-label="Portfolio navigation"',
 '<h2 id="toolsTitle">Workspace tools</h2>':'<h2 id="toolsTitle">Tools and settings</h2>',
 '<script src="assets.js"></script>':'<script src="assets.js"></script>\n<script src="artwork.js"></script>'
})
apply('sw.js',{"ramy-shell-13-0-2":"ramy-shell-13-1-0","'assets.js','core.js'":"'assets.js','artwork.js','core.js'"})
# Update the same assertion to match the revised section title, without removing checks.
test=p/'tests/core.test.js';text=test.read_text();text=text.replace('INTERNAL · Revenue','Internal · Revenue');test.write_text(text)
(p/'editorial-changes.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2))
print('Applied checked editorial changes. Screen numbering removed; data identifiers retained.')
