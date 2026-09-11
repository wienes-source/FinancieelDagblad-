const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const code=fs.readFileSync('pricing.js','utf8');
const today=new Date().toISOString().slice(0,10);
const rate={date:today,base:'EUR',quote:'SRD',rate:43.8575};
function context(fetch){const c=vm.createContext({fetch,AbortSignal,Intl});vm.runInContext(code,c);return c;}
(async()=>{
 let c=context(async()=>({ok:true,json:async()=>rate}));
 assert.equal(vm.runInContext('WINN_PRICE.convert(42.22,1)',c),43);
 assert.equal(vm.runInContext('WINN_PRICE.convert(43.8575)',c),211);
 assert.equal(vm.runInContext('WINN_PRICE.convert(10,4.8)',c),48);
 assert.throws(()=>vm.runInContext('WINN_PRICE.convert(-1)',c));
 assert.throws(()=>vm.runInContext('WINN_PRICE.validate({date:"2020-01-01",base:"EUR",quote:"SRD",rate:42})',c));
 assert.equal((await vm.runInContext('WINN_PRICE.load()',c)).label,'SRD 211');
 c=context(async url=>{if(url.startsWith('https:'))throw Error('offline');return {ok:true,json:async()=>[{date:today,exchangeRate:rate}]};});
 assert.equal((await vm.runInContext('WINN_PRICE.load()',c)).label,'SRD 211');
 c=context(async()=>{throw Error('offline');});
 assert.equal((await vm.runInContext('WINN_PRICE.load()',c)).label,'SRD niet beschikbaar');
 console.log('Pricing tests passed: upward rounding, exact integers, invalid/stale rate, saved-rate fallback and unavailable state.');
})();
