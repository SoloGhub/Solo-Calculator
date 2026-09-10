/* Device-local persistence with transaction completion and an explicit fallback. No server calls. */
(function(root){
'use strict';
const DB='ramy-console-v13',KEY='ramy-console-v13-store';
let dbPromise=null,backend='';
function open(){
 if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
  if(!root.indexedDB)return reject(new Error('IndexedDB unavailable'));
  const req=indexedDB.open(DB,1);let expired=false;
  const timer=setTimeout(()=>{expired=true;reject(new Error('Storage request timed out'));},2000);
  req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains('records'))d.createObjectStore('records',{keyPath:'clientId'});if(!d.objectStoreNames.contains('settings'))d.createObjectStore('settings');};
  req.onsuccess=()=>{clearTimeout(timer);if(expired){req.result.close();return;}req.result.onversionchange=()=>req.result.close();resolve(req.result);};
  req.onerror=()=>{clearTimeout(timer);reject(req.error||new Error('Storage unavailable'));};
  req.onblocked=()=>{clearTimeout(timer);reject(new Error('Storage is blocked by another tab'));};
 });
 return dbPromise;
}
function localRead(){const text=localStorage.getItem(KEY);if(!text)return {records:{},last:''};const data=JSON.parse(text);if(!data.records||typeof data.records!=='object')throw new Error('Local record store is damaged');return data;}
async function readAll(){
 let local;
 try{local=localRead();}catch{local={records:{},last:''};}
 try{
  const d=await open();const result=await new Promise((resolve,reject)=>{const tx=d.transaction(['records','settings'],'readonly'),r=tx.objectStore('records').getAll(),last=tx.objectStore('settings').get('last');tx.oncomplete=()=>resolve({records:r.result,last:last.result||''});tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Read aborted'));});
  backend='IndexedDB';const map=new Map(result.records.map(r=>[r.clientId,r]));
  for(const r of Object.values(local.records))if(!map.has(r.clientId)||(r.updatedAt||'')>(map.get(r.clientId).updatedAt||''))map.set(r.clientId,r);
  return {records:[...map.values()],last:local.lastAt&&local.lastAt>(result.records.find(r=>r.clientId===result.last)?.updatedAt||'')?local.last:result.last||local.last};
 }catch(e){backend='localStorage';try{const x=localRead();return {records:Object.values(x.records),last:x.last};}catch{throw new Error('Device storage unavailable. Keep a JSON or Master HTML backup.');}}
}
async function put(record){
 const data=JSON.parse(JSON.stringify(record));
 try{
  const d=await open();await new Promise((resolve,reject)=>{const tx=d.transaction(['records','settings'],'readwrite');tx.objectStore('records').put(data);tx.objectStore('settings').put(data.clientId,'last');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Save aborted'));});backend='IndexedDB';
  try{const l=localRead();delete l.records[data.clientId];if(l.last===data.clientId){l.last='';l.lastAt='';}localStorage.setItem(KEY,JSON.stringify(l));}catch{}
 }catch(e){
  try{const l=localRead();l.records[data.clientId]=data;l.last=data.clientId;l.lastAt=data.updatedAt;localStorage.setItem(KEY,JSON.stringify(l));backend='localStorage fallback';}
  catch{throw new Error('Not saved: device storage is blocked or full. Export a backup before closing.');}
 }
 return backend;
}
root.RamyStore={readAll,put,backend:()=>backend};
})(globalThis);
