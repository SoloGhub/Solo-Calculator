"""One-time packaging of completed Adobe artwork; no client data or logo redrawing."""
from pathlib import Path
from PIL import Image
import base64,io,json,hashlib,urllib.request
ROOT=Path(__file__).resolve().parent
sources={
 'crest-transparent.png':('https://photoshop-api.adobe.io/v2/short-url/urn:aaid:ps:US:614810fc-9daa-44bc-9699-0a7f2e433984','8cd712a4c51c8b3331a332ac52a58e3ce0bb9b067d307d4761be8f873ccf5cc8'),
 'financial-icons.png':('https://photoshop-api.adobe.io/v2/short-url/urn:aaid:ps:US:12efaf3e-e7f1-49cc-b449-360d1f714674','f55621d3d8a13d4d4f7693df0d4ab20fd02c9b793d8840d60aadf5b008685c97')}
images={}
for name,(url,digest) in sources.items():
 with urllib.request.urlopen(url,timeout=40) as response:data=response.read(15000000)
 if hashlib.sha256(data).hexdigest()!=digest:raise RuntimeError('Artwork integrity mismatch: '+name)
 images[name]=Image.open(io.BytesIO(data))
def uri(img):
 b=io.BytesIO();img.save(b,'WEBP',quality=90,method=6);return 'data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
logo=images['crest-transparent.png'].convert('RGBA')
if logo.getchannel('A').getextrema()!=(0,255):raise RuntimeError('Crest is not transparent')
logo=logo.crop(logo.getbbox());logo.thumbnail((260,390),Image.Resampling.LANCZOS)
(ROOT/'assets.js').write_text('/* Supplied RAMY crest, background removed by Adobe; no redrawing. */\nglobalThis.RAMY_LOGO = '+json.dumps(uri(logo))+';\n')
sheet=images['financial-icons.png'].convert('RGB')
# Sprite slices use the inspected image coordinates. Source imagery remains unchanged.
boxes={'client':(12,8,265,364),'gold':(270,127,567,331),'portfolio':(573,22,875,333),'results':(15,575,321,891),'reports':(353,586,578,892),'internal':(605,564,872,893)}
art={}
for name,bounds in boxes.items():
 image=sheet.crop(tuple(round(x*sheet.width/900) for x in bounds));image.thumbnail((192,192),Image.Resampling.LANCZOS);art[name]=uri(image)
(ROOT/'artwork.js').write_text('/* Adobe Firefly-generated financial pictograms, 10 September 2026. */\nglobalThis.RAMY_ARTWORK = '+json.dumps(art)+';\n')
(ROOT/'artwork-provenance.json').write_text(json.dumps({name:{'source':url,'sha256':digest} for name,(url,digest) in sources.items()},indent=2))
