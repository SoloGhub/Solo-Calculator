import {number,payment,money,decimalWords,percentWords} from './math.mjs';
const $=s=>document.querySelector(s);let saved=null,dbPromise=null;
const ids=['value','deposit','years','rate'];
function quick(){
 const [value,deposit,years,rate]=ids.map(id=>number($('#'+id).value));
 if([value,deposit,years,rate].includes(null))return {error:'أكمل القيم الأربع بأرقام صحيحة. اكتب صفرًا إذا كانت الدفعة أو النسبة صفرًا.'};
 if(value<=0||value>1e12||deposit>=value)return {error:'قيمة العقار يجب أن تكون أكبر من صفر وأكبر من الدفعة المقدمة.'};
 const months=years*12;
 if(months<1||months>600||Math.abs(months-Math.round(months))>1e-7)return {error:'أدخل مدة تمويل تعادل عددًا صحيحًا من الشهور، وحتى خمسين سنة.'};
 if(rate>100)return {error:'راجع السعر السنوي؛ يجب ألا يتجاوز مئة بالمئة.'};
 return {principal:value-deposit,monthly:payment(value-deposit,rate,Math.round(months)),depositPercent:deposit/value*100};
}
ids.forEach(id=>$('#'+id).addEventListener('input',()=>{const n=number($('#'+id).value);$('#'+id+'-words').textContent=n===null?'':id==='rate'?percentWords(n):id==='years'?decimalWords(n)+' سنة':money(n);$('#quick-result').hidden=true;$('#quick-status').textContent='';}));
$('#quick-form').addEventListener('submit',e=>{e.preventDefault();const r=quick();$('#quick-status').textContent=r.error||'';$('#quick-result').hidden=!!r.error;if(r.error)return;$('#monthly').textContent=money(r.monthly);$('#principal').textContent=money(r.principal);$('#deposit-percent').textContent=percentWords(r.depositPercent);$('#quick-result').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});});
function database(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{if(!('indexedDB'in window)){reject(new Error('storage unavailable'));return;}const req=indexedDB.open('solo-finance-workspace',1);req.onupgradeneeded=()=>req.result.createObjectStore('workspaces');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});return dbPromise;}
async function stored(action,value){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('workspaces',action==='get'?'readonly':'readwrite'),table=tx.objectStore('workspaces');const req=action==='get'?table.get('active'):action==='put'?table.put(value,'active'):table.delete('active');let result;req.onsuccess=()=>{result=req.result};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
function validate(html){if(typeof html!=='string'||html.length>4000000)throw new Error('حجم الملف غير مناسب. اختَر ملف البنكين المرفق مع التطبيق.');const doc=new DOMParser().parseFromString(html,'text/html');if(doc.querySelector('meta[name="solo-finance-workspace"]')?.content!=='v1')throw new Error('ده مش ملف البنكين الخاص بالتطبيق. اختَر Solo_Finance_Banks.html.');return html;}
function controls(){const present=!!saved;$('#resume').hidden=!present;$('#forget').hidden=!present;$('#choose').textContent=present?'استبدال ملف البنكين':'فتح ملف البنكين';}
function launch(html){validate(html);$('#home').hidden=true;$('#workspace-view').hidden=false;document.body.classList.add('workspace-open');$('#workspace-frame').srcdoc=html;window.scrollTo(0,0);}
$('#choose').addEventListener('click',()=>$('#workspace-file').click());
$('#workspace-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;$('#load-status').textContent='';try{if(file.size>4000000)throw new Error('اختَر ملف البنكين المرفق مع التطبيق.');const html=validate(await file.text());saved=html;let storageFailed=false;try{await stored('put',html);}catch{storageFailed=true;}controls();launch(html);if(storageFailed)$('#load-status').textContent='اتفتح الملف، لكن المتصفح لم يسمح بحفظه. اختَره من جديد في الزيارة القادمة.';}catch(error){$('#load-status').textContent=error.message;}finally{e.target.value='';}});
$('#resume').addEventListener('click',()=>{if(saved)launch(saved);});
$('#close-workspace').addEventListener('click',()=>{if(!confirm('الرجوع للقائمة ينهي بيانات العميل الحالية. ترجع للقائمة؟'))return;$('#workspace-frame').srcdoc='';$('#workspace-view').hidden=true;$('#home').hidden=false;document.body.classList.remove('workspace-open');});
$('#forget').addEventListener('click',async()=>{try{await stored('delete');saved=null;controls();$('#load-status').textContent='تم حذف ملف البنكين من هذا الجهاز.';}catch{$('#load-status').textContent='تعذر الحذف من المتصفح. يمكنك مسح بيانات هذا الموقع من إعدادات المتصفح.';}});
try{const html=await stored('get');if(html){saved=validate(html);controls();launch(saved);}}catch{$('#load-status').textContent='تقدر تفتح ملف البنكين من الزر. الحفظ التلقائي قد لا يكون متاحًا في هذا المتصفح.';}
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
