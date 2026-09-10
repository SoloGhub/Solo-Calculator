"""Build the static distributable and standalone master without changing source files."""
from pathlib import Path
from shutil import copy2, rmtree
from io import BytesIO
import base64, json, re, zipfile
from PIL import Image
ROOT = Path(__file__).resolve().parent
DIST = ROOT / 'dist'
FILES = ['index.html','styles.css','assets.js','core.js','store.js','reports.js','app.js','manifest.webmanifest','sw.js']
if DIST.exists(): rmtree(DIST)
DIST.mkdir()
for name in FILES: copy2(ROOT / name, DIST / name)
data = re.search(r"base64,([^']+)", (ROOT / 'assets.js').read_text()).group(1)
image = Image.open(BytesIO(base64.b64decode(data))).convert('RGB')
for size, name in [(192,'icon192.png'),(512,'icon512.png'),(180,'apple-touch-icon.png')]:
    image.resize((size,size),Image.Resampling.LANCZOS).save(DIST / name, optimize=True)
html = (ROOT / 'index.html').read_text()
html = re.sub(r'<link rel="(?:manifest|apple-touch-icon|icon)"[^>]*>','',html)
html = html.replace('<link rel="stylesheet" href="styles.css">','<style data-app-style>'+ (ROOT / 'styles.css').read_text() +'</style>')
for name in ['assets.js','core.js','store.js','reports.js','app.js']:
    script = (ROOT / name).read_text().replace('</script','<\\/script')
    html = html.replace(f'<script src="{name}"></script>', '<script>'+script+'</script>')
(ROOT / 'RAMY_Standalone.html').write_text(html)
with zipfile.ZipFile(ROOT / 'RAMY_Web_App.zip','w',zipfile.ZIP_DEFLATED) as z:
    for f in DIST.iterdir(): z.write(f,f.name)
print('Built dist/, RAMY_Standalone.html and RAMY_Web_App.zip. No client records included.')
