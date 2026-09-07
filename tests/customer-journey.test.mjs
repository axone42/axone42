import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");
function load(file, overrides = {}, globals = {}) {
  const filename = new URL("../" + file, import.meta.url);
  const js = ts.transpileModule(fs.readFileSync(filename, "utf8"), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const module = {exports:{}};
  vm.runInNewContext(js, {module,exports:module.exports,require:(name) => {
    if (name in overrides) return overrides[name];
    if (name.startsWith("@/")) return load(name.slice(2)+".ts",overrides,globals);
    return require(name);
  },console:{log(){},warn(){},error(){}},process,URL,URLSearchParams,AbortSignal,Buffer,fetch,setTimeout,clearTimeout,...globals}, {filename:file});
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
test("service pricing links preserve the exact course and tolerate empty or unknown selections",()=>{
  for(const id of Object.keys(pricing.serviceIntents)){
    const url=new URL(pricing.pricingForService(id),"http://localhost");
    assert.equal(url.pathname,"/pricing");
    assert.equal(pricing.resolveIntent(url.searchParams).serviceId,id);
  }
  assert.equal(pricing.resolveIntent(new URLSearchParams("items=&service=chatbot")).topic,"");
  assert.equal(pricing.resolveIntent(new URLSearchParams("items=lecture,lecture,unknown&service=ai-automation-course")).ids.join(","),"lecture");
  assert.equal(pricing.resolveIntent(new URLSearchParams("service=__proto__")).ids.length,0);
});
const valid = {name:"테스트 고객",email:"test@example.com",phone:"010-0000-0000",company:"테스트",message:"상담 양식 검증용 문의입니다.",agree:true,items:["website","automation","marketing"],estimate:"1원"};
function route(sendMail, save = async input => ({inquiry:{id:'00000000-0000-4000-8000-000000000001',ticket_id:'AX-TEST',...input},created:true}), notify = async()=>true) {
  const tasks=[];
  const api=load("app/api/contact/route.ts",{
    "next/server":{...require('next/server'),after:fn=>tasks.push(fn)},
    "@/lib/mailgun":{sendMail},
    "@/lib/inquiries":{saveInquiry:save,InquiryConflict:class extends Error{}},
    "@/lib/slack":{notifyInquiry:notify},
  });
  return {async POST(req) { const res=await api.POST(req); for(const fn of tasks.splice(0)) await fn(); return res; }};
}
function request(body){return new Request("http://localhost/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});}
test("DB acceptance succeeds even when optional mail and Slack fail",async()=>{
  for(const result of [{ok:false,skipped:true},{ok:false,error:"provider unavailable"}]){
    let persisted=false;
    const response=await route(async()=>result,async input=>{persisted=true;return {inquiry:{id:'test',ticket_id:'AX-SAVED',...input},created:true}},async()=>{throw new Error('Slack down')}).POST(request(valid));
    assert.equal(response.status,200);
    assert.equal((await response.json()).ticketId,'AX-SAVED');assert.equal(persisted,true);
  }
});
test("DB failure cannot produce success or notifications",async()=>{
  let calls=0;
  const response=await route(async()=>{calls++},async()=>{throw new Error('DB unavailable')},async()=>{calls++}).POST(request(valid));
  assert.equal(response.status,503);assert.equal((await response.json()).ok,false);assert.equal(calls,0);
});
test("malformed and incomplete enquiries never call mail",async()=>{
  let calls=0;const api=route(async()=>{calls++;return {ok:true,id:"test"};});
  for(const input of [null,[],{name:{bad:true},email:123,message:[],agree:false}]){
    const response=await api.POST(request(input));
    assert.ok([400,422].includes(response.status));
  }
  assert.equal(calls,0);
});
test("saved enquiries include server-calculated costs and specific course intent",async()=>{
  let mail;
  const api=route(async(input)=>{mail=input;return {ok:true,id:"mock-provider-id"};});
  const response=await api.POST(request(valid));
  assert.equal(response.status,200);assert.equal((await response.json()).ok,true);
  assert.match(mail.text,/초기 비용 5,000,000원/);assert.match(mail.text,/월 운영·대행료 1,700,000원/);assert.doesNotMatch(mail.text,/프로모션/);
  await api.POST(request({...valid,items:["lecture"],topic:"AI 자동화 강의"}));
  assert.match(mail.text,/AI 자동화 강의/);assert.doesNotMatch(mail.text,/AI 자동화 구축/);
});
test("project enquiries use the catalogue title and ignore fabricated project names",async()=>{
  let mail;const api=route(async(input)=>{mail=input;return {ok:true,id:"mock"};});
  const response=await api.POST(request({...valid,project:"ocr-extractor"}));
  assert.equal(response.status,200);assert.match(mail.text,/관심 프로젝트: 영수증/);
  await api.POST(request({...valid,project:"<img src=x onerror=alert(1)>"}));
  assert.match(mail.text,/관심 프로젝트: -/);assert.doesNotMatch(mail.html,/onerror/);
});
test("analytics forwards only event identifiers and cannot interrupt a successful form action",()=>{
  const sent=[];const events=[];
  const browser={location:{pathname:"/contact"},dispatchEvent:e=>events.push(e),gtag:(...args)=>sent.push(args)};
  const analytics=load("lib/analytics.ts",{}, {window:browser,process:{env:{NEXT_PUBLIC_GA_ID:"G-TEST12345"}},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail}}});
  analytics.trackConversion("generate_lead",{project_id:"ocr-extractor",email:"private@example.com",message:"private message",service_id:"invalid@example.com"});
  assert.equal(sent.length,1);assert.equal(sent[0][0],"event");assert.equal(sent[0][2].project_id,"ocr-extractor");
  assert.doesNotMatch(JSON.stringify(sent),/private|invalid@/);assert.equal(events.length,1);
  browser.gtag=()=>{throw new Error("provider blocked")};assert.doesNotThrow(()=>analytics.trackConversion("contact_submit"));
  browser.location.pathname="/admin/projects";analytics.trackConversion("contact_start");assert.equal(events.length,2);
});
