"""Executable UI/editorial regression checks. Chromium emulation, not physical phones."""
from pathlib import Path
import json,sys,time,threading,functools,http.server
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'review-evidence';OUT.mkdir(exist_ok=True)
checks=[]
def check(name,ok):
 checks.append({'check':name,'pass':bool(ok)})
 if not ok:raise AssertionError(name)
fixture=json.loads((ROOT/'tests/fixture.json').read_text())
fixture['client']['name']='DEMO — not a client';fixture['client']['reference']='TEST-01';fixture['client']['notesInternal']='PRIVATE_REVIEW_CANARY';fixture['client']['notesClient']='Illustrative record for interface testing only.'
fixture['advisor'].update(name='RAMY',phone='',email='',company='')
handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(ROOT/'dist'))
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/index.html'
runtime=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox'])
  context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,has_touch=True,accept_downloads=True)
  page=context.new_page();page.on('pageerror',lambda e:runtime.append(str(e)));page.goto(url);page.wait_for_selector('html[data-ready=true]')
  check('Welcome has no numbered workflow',not page.locator('.flow,.step').count())
  page.screenshot(path=str(OUT/'welcome.png'),full_page=True)
  page.locator('[data-mode=advisor]').click()
  check('Client profile title',page.locator('h1').inner_text()=='Client profile')
  check('Client reference remains available',page.locator('#f-client-reference').count()==1)
  page.wait_for_function("document.getElementById('saveStatus').textContent.startsWith('Saved on device')");page.screenshot(path=str(OUT/'client-beige.png'),full_page=True)
  page.locator('#viewsToggle').click();check('Modes can be collapsed',page.locator('#modeBar').is_hidden())
  page.locator('#viewsToggle').click();check('Modes can be restored',page.locator('#modeBar').is_visible())
  page.locator('#f-client-name').fill('DEMO — not a client');page.locator('#f-client-reference').fill('TEST-01')
  page.wait_for_function("document.getElementById('saveStatus').textContent.startsWith('Saved on device')")
  page.locator('#navItems [data-screen=gold]').click()
  check('Gold calculator title',page.locator('h1').inner_text()=='Gold calculator')
  page.locator('#f-gold-draft-quantity').fill('1');page.locator('#f-gold-draft-spot').fill('340');page.locator('#f-gold-draft-premium').fill('3')
  check('Purchase preview computes total','350,200.00' in page.locator('#goldDraftPreview').inner_text())
  page.screenshot(path=str(OUT/'gold-beige.png'),full_page=True)
  page.locator('[data-action=add-gold]').click();check('Transaction added',page.locator('.record-card:visible').count()==1)
  check('Schedule label is natural English','one_off' not in page.locator('.record-card').inner_text())
  page.locator('[data-action=edit-gold]').click();page.locator('#f-gold-draft-quantity').fill('1.5');page.locator('[data-action=add-gold]').click()
  check('Edit preserves row identity',page.locator('.record-card:visible').count()==1)
  check('Edited transaction is repriced','525,300.00' in page.locator('.record-card').inner_text())
  page.wait_for_function("document.getElementById('saveStatus').textContent.startsWith('Saved on device')")
  page.reload();page.wait_for_selector('html[data-ready=true]');page.locator('[data-mode=advisor]').click()
  check('Client restored after reload',page.locator('#f-client-name').input_value()=='DEMO — not a client')
  check('Meaningful reference preserved',page.locator('#f-client-reference').input_value()=='TEST-01')
  page.locator('#toolsButton').click();check('Tools open',page.locator('#tools').is_visible());page.locator('[data-action=theme][data-theme=blue]').click()
  check('Theme control applies blue',page.locator('html').get_attribute('data-theme')=='blue')
  if page.locator('#tools').is_visible():page.locator('#closeTools').click()
  page.screenshot(path=str(OUT/'client-blue.png'),full_page=True)
  check('Tools close',page.locator('#tools').is_hidden())
  values=page.evaluate('f=>{let s=RamyCore.normalize(f);let g=RamyCore.goldSummary(s);return {avg:g.avgAllIn,value:g.currentValue,revenue:g.revenue,performance:g.performance};}',fixture)
  check('Original V11 weighted average preserved',abs(values['avg']-350.2)<1e-8)
  check('Original V11 current valuation preserved',abs(values['value']-592500)<1e-8)
  check('Original V11 internal revenue preserved',abs(values['revenue']-10300)<1e-8)
  check('Original V11 performance preserved',abs(values['performance']-12.792689891490575)<1e-8)
  css=(ROOT/'styles.css').read_text()
  for theme in ['beige','blue']:
   for internal in [False,True]:
    html=page.evaluate('(d)=>{let s=RamyCore.normalize(d.fixture);s.ui.theme=d.theme;return RamyReports.documentHtml(s,d.internal,"TEST-DOCUMENT",d.css);}',dict(fixture=fixture,theme=theme,internal=internal,css=css))
    check(f'{theme} report title professional','Fresh Client' not in html and ('Portfolio statement' in html or 'Investment proposal' in html or 'Portfolio proposal' in html))
    check(f'{theme} audience separation {internal}',('PRIVATE_REVIEW_CANARY' in html)==internal)
    rp=context.new_page();rp.set_content(html);rp.evaluate('document.fonts.ready');rp.pdf(path=str(OUT/f'{theme}-{"internal" if internal else "client"}.pdf'),format='A4',print_background=True)
    rp.close();(OUT/f'{theme}-{"internal" if internal else "client"}.html').write_text(html)
  for width,height in [(360,800),(390,844),(430,932),(844,390),(768,1024),(1440,900)]:
   page.set_viewport_size({'width':width,'height':height})
   for theme in ['beige','blue']:
    page.locator('#toolsButton').click();page.locator(f'[data-action=theme][data-theme={theme}]').click();page.locator('#closeTools').click()
    for screen in ['client','gold','portfolio','results','reports']:
     page.locator(f'#navItems [data-screen={screen}]').click()
     metrics=page.evaluate('''()=>({overflow:document.documentElement.scrollWidth>innerWidth,heading:document.querySelector('h1').textContent,font:getComputedStyle(document.querySelector('h1')).fontFamily,bodyFont:getComputedStyle(document.body).fontFamily,numbered:!!document.querySelector('.step,.flow')})''')
     check(f'{width} {height} {theme} {screen} no horizontal overflow',not metrics['overflow'])
     check(f'{width} {theme} {screen} no step labels',not metrics['numbered'])
     check(f'{width} {theme} {screen} consistent font',metrics['font']==metrics['bodyFont'])
  page.set_viewport_size({'width':390,'height':844});page.locator('#navItems [data-screen=reports]').click()
  page.locator('[data-action=pdf-client]:visible').first.click();page.frame_locator('#reportFrame').locator('.report-content').wait_for()
  check('Client PDF preview opens',page.locator('#preview').is_visible());page.locator('#closePreview').click()
  page.locator('#toolsButton').click()
  with page.expect_download() as dl:page.locator('#tools [data-action=master]:visible').first.click()
  dl.value.save_as(str(OUT/'edited-master.html'))
  doc=(OUT/'edited-master.html').read_text();check('Master embeds artwork',('RAMY_ARTWORK' in doc) and 'script src=' not in doc)
  check('Master retains actual reference','TEST-01' in doc)
  check('No JavaScript runtime errors',not runtime)
  logo=page.evaluate('''async()=>{const img=document.getElementById('brandLogo');await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.drawImage(img,0,0);return {alpha:x.getImageData(0,0,1,1).data[3],ratio:img.naturalWidth/img.naturalHeight,bg:getComputedStyle(img).backgroundColor};}''')
  check('Crest background is truly transparent',logo['alpha']==0 and logo['bg']=='rgba(0, 0, 0, 0)')
  check('Crest retains portrait proportions',.60<logo['ratio']<.66)
  browser.close()
except Exception as e:
 checks.append({'check':'Uncaught test error','pass':False,'detail':str(e)})
 raise
finally:
 server.shutdown()
 result={'environment':'Chromium, HTTP localhost, touch-enabled viewport emulation','physical_devices_tested':False,'passed':sum(x['pass'] for x in checks),'failed':sum(not x['pass'] for x in checks),'runtime_errors':runtime,'checks':checks}
 (OUT/'results.json').write_text(json.dumps(result,indent=2))
 print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
