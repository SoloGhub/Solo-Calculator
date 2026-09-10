"""Browser acceptance suite. --memory is an explicitly isolated local harness, NOT device/storage proof."""
from pathlib import Path
import argparse, json, re, threading, functools, http.server, os, time
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--engine',default='chromium');parser.add_argument('--memory',action='store_true');args=parser.parse_args()
OUT=ROOT/'test-results'/args.engine;OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def check(name,value):
    checks.append({'name':name,'pass':bool(value)})
    assert value,name

def inline_html():
    html=(ROOT/'RAMY_Standalone.html').read_text()
    if args.memory:
        # Browser-origin storage and downloads are unavailable in the restricted local renderer.
        # Stub only the transport boundary; do not replace the app, calculations or report code.
        mock="""<script>
        globalThis.__qaDB=globalThis.__qaDB||{records:[],last:''};
        globalThis.RamyStore={backend:()=> 'IN-MEMORY TEST ONLY',readAll:async()=>JSON.parse(JSON.stringify(__qaDB)),put:async s=>{const d=JSON.parse(JSON.stringify(s));const i=__qaDB.records.findIndex(x=>x.clientId===s.clientId);if(i<0)__qaDB.records.push(d);else __qaDB.records[i]=d;__qaDB.last=s.clientId;return 'IN-MEMORY TEST ONLY';}};
        globalThis.__downloadBlobs=[];globalThis.__objectUrls=new Map();
        const originalURL=URL.createObjectURL;URL.createObjectURL=b=>{const u=originalURL(b);__objectUrls.set(u,b);return u;};
        HTMLAnchorElement.prototype.click=function(){if(this.download&&__objectUrls.has(this.href))__downloadBlobs.push({name:this.download,blob:__objectUrls.get(this.href)});};
        </script>"""
        html=html.replace('<script>/* RAMY mobile workspace.',mock+'<script>/* RAMY mobile workspace.')
    return html

def setup_page(browser,viewport=(390,844),mobile=True):
    context=browser.new_context(viewport={'width':viewport[0],'height':viewport[1]},has_touch=mobile,
        **({'is_mobile':mobile} if args.engine!='firefox' else {}),accept_downloads=True)
    page=context.new_page();page.set_default_timeout(10000)
    if args.memory: page.set_content(inline_html())
    else: page.goto(URL)
    page.wait_for_selector('html[data-ready=true]');return context,page

def input_(page,path,value):page.locator('[data-field="'+path+'"]').fill(str(value))
def action(page,name):page.locator('[data-action="'+name+'"]:visible').first.click()
def go(page,name):page.locator('#navItems [data-screen="'+name+'"]').click()
def accept(page):page.locator('#confirmAccept').click()
def modes(page,name):page.locator('[data-mode="'+name+'"]').click()
def import_fixture(page):
    page.locator('#importFile').set_input_files(ROOT/'tests/fixture.json');page.wait_for_selector('#confirmDialog[open]');accept(page);page.wait_for_function("document.querySelector('#clientContext').textContent.includes('QA Client')")
def get_download(page,trigger,name):
    if args.memory:
        start=page.evaluate('__downloadBlobs.length');trigger();page.wait_for_function('(n)=>__downloadBlobs.length>n',arg=start)
        result=page.evaluate('async()=>({name:__downloadBlobs.at(-1).name,text:await __downloadBlobs.at(-1).blob.text()})')
        (OUT/name).write_text(result['text']);return result['text']
    with page.expect_download() as pending: trigger()
    pending.value.save_as(OUT/name);return (OUT/name).read_text()

if not args.memory:
    handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(ROOT/'dist'))
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    URL=f'http://127.0.0.1:{server.server_port}/index.html'
errors=[]
try:
 with sync_playwright() as p:
    engine=getattr(p,args.engine)
    opts={'headless':True}
    if args.memory:opts.update(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    browser=engine.launch(**opts)
    context,page=setup_page(browser);page.on('pageerror',lambda e:errors.append(str(e)))
    modes(page,'advisor');input_(page,'client.name','QA New Client');action(page,'client-next')
    check('client-to-gold guided navigation',page.locator('h1').inner_text()=='Gold calculator')
    input_(page,'gold.draft.quantity','1');input_(page,'gold.draft.spot','340');input_(page,'gold.draft.premium','3')
    check('calculated preview before commit','350,200.00 AED' in page.locator('#goldDraftPreview').inner_text())
    action(page,'add-gold');check('one batch added',page.locator('.record-card:visible').count()==1)
    action(page,'edit-gold');input_(page,'gold.draft.quantity','0.5');action(page,'add-gold')
    check('batch edited without duplication',page.locator('.record-card:visible').count()==1)
    check('edited amount correct','175,100.00 AED' in page.locator('.record-card:visible').inner_text())
    action(page,'delete-gold');page.locator('#confirmCancel').click();check('cancelled delete preserves batch',page.locator('.record-card:visible').count()==1)
    action(page,'delete-gold');accept(page);check('confirmed delete removes batch',page.locator('.record-card:visible').count()==0)
    import_fixture(page)
    check('V11 import restores identity','QA Client' in page.locator('#clientContext').inner_text())
    go(page,'results');check('weighted average regression','350.2000' in page.locator('.kpis').inner_text())
    check('portfolio consolidation regression','968,982.50 AED' in page.locator('.kpis').inner_text())
    go(page,'portfolio');page.locator('[data-action=holding-tab][data-tab=records]').click();action(page,'edit-holding');input_(page,'holdingDraft.current','103000');action(page,'add-holding')
    check('holding edited without duplication',page.locator('.record-card:visible').count()==1)
    page.locator('[data-action=holding-tab][data-tab=entry]').click();input_(page,'holdingDraft.name','Unfinished draft');go(page,'client');go(page,'portfolio')
    check('draft survives navigation',page.locator('[data-field="holdingDraft.name"]').input_value()=='Unfinished draft')
    page.wait_for_function("document.querySelector('#saveStatus').textContent.startsWith('Saved on device')")
    check('save completion visible',True)
    if not args.memory:
        page.reload();page.wait_for_selector('html[data-ready=true]');modes(page,'advisor');go(page,'portfolio')
        check('draft survives real reload',page.locator('[data-field="holdingDraft.name"]').input_value()=='Unfinished draft')
    go(page,'reports');backup=get_download(page,lambda:action(page,'json'),'backup.json')
    check('JSON backup includes saved drafts',json.loads(backup)['holdingDraft']['name']=='Unfinished draft')
    master=get_download(page,lambda:action(page,'master'),'master.html')
    check('editable master embeds current record','QA Client' in master and 'Unfinished draft' in master and 'id="embedded-state"' in master)
    check('master has no external app dependencies',not re.search(r'<(?:script\s+[^>]*src=|link\s+[^>]*rel="stylesheet")',master))
    # Reopen the serialized master. A new browser context prevents recovery from masking export bugs.
    mc=browser.new_context(accept_downloads=True);mp=mc.new_page();mp.set_default_timeout(10000)
    if args.memory:
        # Use the saved document as-is; unavailability of storage should not prevent embedded recovery.
        mp.set_content(master)
    else:mp.goto((OUT/'master.html').as_uri())
    mp.wait_for_selector('html[data-ready=true]');modes(mp,'advisor');go(mp,'portfolio')
    check('master reopens with client identity','QA Client' in mp.locator('#clientContext').inner_text())
    check('master reopens with draft data',mp.locator('[data-field="holdingDraft.name"]').input_value()=='Unfinished draft');mc.close()
    # Theme, report isolation, and PDF render.
    page.locator('#toolsButton').click();page.locator('[data-action=theme][data-theme=blue]').click();page.locator('#closeTools').click()
    client_html=get_download(page,lambda:action(page,'html-client'),'client-blue.html')
    check('blue theme survives client HTML','data-theme="blue"' in client_html)
    for canary in ['PRIVATE_CLIENT_CANARY','PRIVATE_BATCH_CANARY','PRIVATE_AUDIT_CANARY','Market cost','Gross revenue']:
        check('client HTML excludes '+canary,canary not in client_html)
    internal_html=get_download(page,lambda:action(page,'html-internal'),'internal-blue.html')
    check('internal appendix contains private review','PRIVATE_CLIENT_CANARY' in internal_html)
    check('internal appendix is after client sections',internal_html.index('INTERNAL · Revenue')>internal_html.index('Gold batches'))
    for theme in ['beige','blue']:
        page.locator('#toolsButton').click();page.locator('[data-action=theme][data-theme='+theme+']').click();page.locator('#closeTools').click()
        for audience in ['client','internal']:
            action(page,'pdf-'+audience);page.frame_locator('#reportFrame').locator('.report-content').wait_for()
            doc=page.locator('#reportFrame').get_attribute('srcdoc')
            check(audience+' PDF preview '+theme,'<article class="report-content">' in doc)
            if args.engine=='chromium':
                rp=browser.new_page(viewport={'width':900,'height':1200});rp.set_content(doc);rp.emulate_media(media='print');rp.pdf(path=str(OUT/(audience+'-'+theme+'.pdf')),format='A4',print_background=True,prefer_css_page_size=True);rp.close()
            page.locator('#closePreview').click()
    modes(page,'client');check('client mode removes editors',page.locator('#main input:visible,#main textarea:visible').count()==0)
    for canary in ['PRIVATE_CLIENT_CANARY','PRIVATE_BATCH_CANARY','PRIVATE_AUDIT_CANARY','Gross revenue']:check('client DOM excludes '+canary,canary not in page.locator('#main').inner_html())
    page.locator('#toolsButton').click();check('client tools exclude internal actions',page.locator('#tools [data-action=pdf-internal]').count()==0);page.locator('#closeTools').click()
    modes(page,'advisor');page.wait_for_selector('#confirmDialog[open]');page.locator('#confirmCancel').click();check('mode return can be cancelled',page.locator('[data-mode=client]').get_attribute('aria-pressed')=='true')
    modes(page,'advisor');accept(page)
    # Responsive matrix. Screen and theme coverage does not imply testing a physical device.
    sizes=[(320,568),(390,844),(412,915),(844,390),(768,1024),(1366,768)]
    for width,height in sizes:
        page.set_viewport_size({'width':width,'height':height})
        for theme in ['beige','blue']:
            page.locator('#toolsButton').click();page.locator('[data-action=theme][data-theme='+theme+']').click();page.locator('#closeTools').click()
            for section in ['client','gold','portfolio','results','reports']:
                go(page,section)
                check(f'no horizontal page overflow {width}x{height} {theme} {section}',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
                check(f'four modes fit {width} {theme} {section}',page.evaluate("[...document.querySelectorAll('.mode')].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})"))
                check(f'input typography {width} {theme} {section}',page.evaluate("[...document.querySelectorAll('input:not([type=checkbox]),select,textarea')].filter(e=>e.getBoundingClientRect().height>0).every(e=>parseFloat(getComputedStyle(e).fontSize)>=16)"))
            page.locator('#toolsButton').click();check(f'tools drawer visible {width} {theme}',page.locator('#tools').is_visible());page.keyboard.press('Escape');check(f'tools close Escape {width} {theme}',not page.locator('#tools').is_visible())
            if width in [390,1366]:
                go(page,'client');page.wait_for_timeout(100);page.evaluate("document.querySelector('#toast').hidden=true");page.screenshot(path=str(OUT/f'client-{theme}-{width}.png'),full_page=True)
    if not args.memory:
        # Service worker is a real network/offline check, not an emulation of cache APIs.
        awaiter="navigator.serviceWorker.ready.then(()=>true)";page.evaluate(awaiter);page.reload();page.wait_for_selector('html[data-ready=true]')
        page.wait_for_function('!!navigator.serviceWorker.controller')
        context.set_offline(True);page.reload();page.wait_for_selector('html[data-ready=true]');check('real offline shell loads',page.title().startswith('RAMY'))
        context.set_offline(False)
    check('no JavaScript runtime errors',not errors)
    context.close();browser.close()
finally:
    report={'engine':args.engine,'environment':'restricted in-memory harness; storage and download transport mocked' if args.memory else 'Playwright browser on HTTP localhost; real IndexedDB and download transport','physical_devices_tested':False,'checks':checks,'passed':sum(c['pass'] for c in checks),'failed':sum(not c['pass'] for c in checks),'runtime_errors':errors}
    (OUT/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps({k:v for k,v in report.items() if k!='checks'},indent=2))
    if not args.memory:server.shutdown()
