import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {confirmed,captureEvent} from '../src/scripts/capture.mjs';
const source=(await readFile(new URL('../src/scripts/form.js',import.meta.url),'utf8')).replace(/^import[^\n]+\n/,'');
function setup(fetch,{enabled=true,consent=true}={}){
 let submit;const button={},status={};const fields={contactName:'Prueba',company:'Ficticia',email:'test@example.invalid',phone:'',problemDescription:'Tijuana prueba local',website:''};
 const form={dataset:{enabled:String(enabled),endpoint:'/api/leads'},reportValidity:()=>true,querySelector:()=>button,addEventListener:(_name,fn)=>submit=fn};
 const store=new Map();const window={iametAnalyticsConsent:consent};
 vm.runInNewContext(source,{confirmed,captureEvent,window,document:{querySelector:s=>s==='#lead-form'?form:status,querySelectorAll:()=>[]},sessionStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},FormData:class{constructor(){return Object.entries(fields)}},fetch,crypto:webcrypto,AbortController,setTimeout,clearTimeout,URLSearchParams,location:{search:'?utm_source=test'},console});
 return {send:()=>submit({preventDefault(){}}),window,status,button,fields};
}
const success=()=>({ok:true,status:201,json:async()=>({status:'saved',receipt:'a6c2f500-3b45-4c0d-9240-5de409613007'})});
test('disabled preview cannot transmit a request',async()=>{let calls=0;const app=setup(async()=>{calls++;return success()},{enabled:false});await app.send();assert.equal(calls,0);});
test('confirmed response emits once; repeated submit is ignored',async()=>{let calls=0;const app=setup(async()=>{calls++;return success()});await app.send();await app.send();assert.equal(calls,1);assert.equal(app.window.dataLayer.length,1);assert.equal(app.window.dataLayer[0].event,'lead_captured');assert.equal(app.button.disabled,true);});
test('network loss preserves fields and retries the same body and key',async()=>{const requests=[];const app=setup(async(_url,request)=>{requests.push(request);if(requests.length===1)throw Error('offline');return success()});await app.send();assert.equal(app.fields.company,'Ficticia');assert.equal(app.window.dataLayer,undefined);await app.send();assert.equal(requests[0].body,requests[1].body);assert.equal(requests[0].headers['Idempotency-Key'],requests[1].headers['Idempotency-Key']);});
test('server rejection does not confirm or emit a capture',async()=>{const app=setup(async()=>({ok:false,status:422,json:async()=>({status:'rejected'})}));await app.send();assert.equal(app.window.dataLayer,undefined);assert.equal(app.button.disabled,false);assert.match(app.status.textContent,/rechazada/);});
test('capture works without analytics consent and excludes attribution',async()=>{let sent;const app=setup(async(_url,req)=>{sent=JSON.parse(req.body);return success()},{consent:false});await app.send();assert.equal(app.window.dataLayer,undefined);assert.equal(sent.attribution,undefined);assert.match(app.status.textContent,/Recibimos/);});
