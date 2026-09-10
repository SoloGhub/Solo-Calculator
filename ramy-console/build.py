"""Build RAMY from committed local sources, without live asset dependencies."""
from pathlib import Path
from shutil import copy2, rmtree
from io import BytesIO
import base64, re, zipfile
from PIL import Image
ROOT=Path(__file__).resolve().parent
DIST=ROOT/'dist'
FILES=['index.html','styles.css','assets.js','artwork.js','core.js','store.js','reports.js','app.js','manifest.webmanifest','sw.js']
if DIST.exists():rmtree(DIST)
DIST.mkdir()
for name in FILES:copy2(ROOT/name,DIST/name)
match=re.search(r'''RAMY_LOGO\s*=\s*(["'])(data:image/[^"']+)\1''',(ROOT/'assets.js').read_text())
if not match:raise ValueError('Embedded RAMY crest is missing')
image=Image.open(BytesIO(base64.b64decode(match.group(2).split(',',1)[1]))).convert('RGBA')
for size,name in [(192,'icon192.png'),(512,'icon512.png'),(180,'apple-touch-icon.png')]:
    canvas=Image.new('RGB',(size,size),'#efe6d8')
    mark=image.copy();mark.thumbnail((round(size*.64),round(size*.88)),Image.Resampling.LANCZOS)
    canvas.paste(mark,((size-mark.width)//2,(size-mark.height)//2),mark)
    canvas.save(DIST/name,optimize=True)
html=(ROOT/'index.html').read_text()
html=re.sub(r'<link rel="(?:manifest|apple-touch-icon|icon)"[^>]*>','',html)
html=html.replace('<link rel="stylesheet" href="styles.css">','<style data-app-style>'+(ROOT/'styles.css').read_text()+'</style>')
for name in ['assets.js','artwork.js','core.js','store.js','reports.js','app.js']:
    script=(ROOT/name).read_text().replace('</script','<\\/script')
    html=html.replace(f'<script src="{name}"></script>','<script>'+script+'</script>')
(ROOT/'RAMY_Standalone.html').write_text(html)
with zipfile.ZipFile(ROOT/'RAMY_Web_App.zip','w',zipfile.ZIP_DEFLATED) as z:
    for f in DIST.iterdir():z.write(f,f.name)
print('Built application, standalone HTML and deployment bundle from the same sources.')
