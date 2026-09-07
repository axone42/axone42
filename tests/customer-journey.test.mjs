import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");
function load(file, overrides = {}) {
  const filename = new URL("../" + file, import.meta.url);
  const js = ts.transpileModule(fs.readFileSync(filename, "utf8"), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const module = {exports:{}};
  vm.runInNewContext(js, {module,exports:module.exports,require:(name) => {
    if (name in overrides) return overrides[name];
    if (name.startsWith("@/")) return load(name.slice(2)+".ts",overrides);
    return require(name);
  },console:{log(){},warn(){},error(){}},URLSearchParams,AbortSignal,Buffer,fetch,setTimeout,clearTimeout}, {filename:file});
  return module.exports;
}
const pricing = load("lib/pricing.ts");
test("one-time and monthly charges stay separate, including automation operations",()=>{
  const e=pricing.estimateItems(["website","automation","marketing"]);
  assert.equal(e.initial,5_000_000);
  assert.equal(e.monthly,1_700_000);
  assert.equal(e.initialVariable,true);
  const monthly=pricing.estimateItems(["marketing"]);
  assert.equal(monthly.hasInitial,false);
  assert.equal(monthly.monthly,1_500_000);
});
test("adding a service never lowers a quote; duplicate and unknown IDs cannot inflate it",()=>{
  const base=pricing.estimateItems(["erp"]);
  const combined=pricing.estimateItems(["erp","lecture"]);
  assert.equal(combined.initial,16_000_000);
  assert.ok(combined.initial>base.initial);
  assert.equal(pricing.estimateItems(["erp","erp","made-up"]).initial,15_000_000);
  assert.equal(pricing.estimateItems([]).hasMonthly,false);
});
test("all service entry points preserve exact intent, including legacy links",()=>{
  for(const [id,intent] of Object.entries(pricing.serviceIntents)){
    const url=new URL(pricing.contactForService(id),"http://localhost");
    const result=pricing.resolveIntent(url.searchParams);
    assert.equal(result.ids.join(","),intent.item);
    assert.equal(result.topic,intent.title);
    const legacy=pricing.resolveIntent(new URLSearchParams({service:intent.title}));
    assert.equal(legacy.ids.join(","),intent.item);
  }
  assert.equal(pricing.resolveIntent(new URLSearchParams({service:"AI"})).ids.length,0);
  assert.equal(pricing.resolveIntent(new URLSearchParams({items:"website",service:"ai-automation-course"})).topic,"");
});
const valid = {name:"테스트 고객",email:"test@example.com",phone:"010-0000-0000",company:"테스트",message:"상담 양식 검증용 문의입니다.",agree:true,items:["website","automation","marketing"],estimate:"1원"};
function route(sendMail) {return load("app/api/contact/route.ts",{"@/lib/mailgun":{sendMail}});}
function request(body){return new Request("http://localhost/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});}
test("unconfigured or failed mail cannot become a successful enquiry",async()=>{
  for(const [result,status] of [[{ok:false,skipped:true},503],[{ok:false,error:"provider unavailable"},502]]){
    const response=await route(async()=>result).POST(request(valid));
    assert.equal(response.status,status);
    assert.equal((await response.json()).ok,false);
  }
});
test("malformed and incomplete enquiries never call mail",async()=>{
  let calls=0;const api=route(async()=>{calls++;return {ok:true,id:"test"};});
  for(const input of [null,[],{name:{bad:true},email:123,message:[],agree:false}]){
    const response=await api.POST(request(input));
    assert.ok([400,422].includes(response.status));
  }
  assert.equal(calls,0);
});
test("successful provider acceptance includes server-calculated costs and specific course intent",async()=>{
  let mail;
  const api=route(async(input)=>{mail=input;return {ok:true,id:"mock-provider-id"};});
  const response=await api.POST(request(valid));
  assert.equal(response.status,200);assert.equal((await response.json()).ok,true);
  assert.match(mail.text,/초기 비용 5,000,000원/);assert.match(mail.text,/월 운영·대행료 1,700,000원/);assert.doesNotMatch(mail.text,/프로모션/);
  await api.POST(request({...valid,items:["lecture"],topic:"AI 자동화 강의"}));
  assert.match(mail.text,/AI 자동화 강의/);assert.doesNotMatch(mail.text,/AI 자동화 구축/);
});
