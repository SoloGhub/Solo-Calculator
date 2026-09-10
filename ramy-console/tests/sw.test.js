'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('offline shell handles hash navigation and refuses private URLs',async()=>{
 const events={},seen=[];const response={ok:true};
 const context={URL,self:{registration:{scope:'https://example.test/app/'},addEventListener:(n,f)=>events[n]=f},caches:{open:async()=>({match:async u=>{seen.push(u);return response;}})},fetch:()=>{throw Error('Unexpected network request');}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8'),context);
 for(const url of ['https://example.test/app/index.html#client','https://example.test/app/#reports']){let pending;events.fetch({request:{method:'GET',url},respondWith:p=>pending=p});assert.ok(pending);assert.equal(await pending,response);assert.equal(seen.at(-1),'https://example.test/app/index.html');}
 for(const url of ['https://example.test/app/customer.json','https://example.test/app/index.html?client=private','https://other.test/index.html']){let intercepted=false;events.fetch({request:{method:'GET',url},respondWith:()=>intercepted=true});assert.equal(intercepted,false);}
});
