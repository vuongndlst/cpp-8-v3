// Disposable localhost/profile regression: retain the editor's starter size and scroll both axes.
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {lesson,root}=require('./boss_arcade_checks.cjs');
const out=path.resolve(root,'../_KiemTra_KhungCode_20261030');
const old=new Map(['engine.js','game.css','syntax.js','syntax.css'].map(n=>[n,cp.execFileSync('git',['show','HEAD:runtime/cpp/engine/'+n],{cwd:root,encoding:'utf8',maxBuffer:5e6})]));
const box=area=>{
 const layer=area.parentElement.querySelector('.cpp-color-layer'),gutter=area.closest('.editor-body').querySelector('.gutter');
 const bounds=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,cw:n.clientWidth,ch:n.clientHeight,sw:n.scrollWidth,sh:n.scrollHeight,left:n.scrollLeft,top:n.scrollTop}};
 return {area:bounds(area),layer:bounds(layer),gutter:bounds(gutter),rows:area.rows};
};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost');if(u.pathname==='/__blank'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><body></body>');}
  let file=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'}),report=[],errors=[];
 async function fixture(number,mobile,baseline=false,regular=false){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000}});
  await context.route('https://**',r=>r.abort());
  if(baseline)await context.route(/\/runtime\/cpp\/engine\/(engine\.js|game\.css|syntax\.js|syntax\.css)\?/,r=>r.fulfill({contentType:r.request().url().includes('.css?')?'text/css':'text/javascript',body:old.get(new URL(r.request().url()).pathname.split('/').at(-1))}));
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const profile={id:'editor-scroll-'+number+'-'+mobile+'-'+regular,display_name:'Kiem tra khung code',class_label:'8A1'};
  const content=lesson(number,profile),L=content.LESSON;
  const stage=regular?L.steps.find(s=>s.kind==='stage'&&s.challenges.some(c=>c.type==='code')):L.steps.find(s=>s.kind==='boss');
  if(!stage){await context.close();return null;}
  const task=stage.challenges.find(c=>c.type==='code'&&!c.advanced),passed=Object.fromEntries(L.steps.flatMap(content.CppProgress.required).filter(c=>c.id!==task.id).map(c=>[c.id,true]));
  const flow=stage.flow?.findIndex(s=>s.tasks?.includes(task.id))??0;
  const state={active:stage.id,passed,drafts:{},inputs:{},screens:{[stage.id]:Math.max(0,flow)},attempts:{},xp:100,combo:0,bossTry:0};
  await page.goto(base+'/__blank');await page.evaluate(({profile,state,number})=>{const ns='lsts-local:v1:cpp-8-v3:';localStorage.setItem(ns+'profiles',JSON.stringify([profile]));localStorage.setItem(ns+'progress:'+profile.id+':bai0'+number,JSON.stringify(state));},{profile,state,number});
  const stages=L.steps.filter(s=>s.kind!=='gate'&&s.kind!=='boss');
  const url=base+'/runtime/lesson.html?lesson=bai0'+number+'&profile='+profile.id+'&mode=read&'+(regular?'chang='+stages.indexOf(stage):'cuoi=1');
  await page.goto(url);const card=page.locator(`[data-card="${task.id}"]`),ed=card.locator('.code-editor');await ed.waitFor();
  return {context,page,card,ed,task};
 }
 try{
  for(let number=1;number<=(process.argv.includes('--wheel-only')?0:6);number++)for(const mobile of [false,true]){
   const original=await fixture(number,mobile,true),initialOld=await original.ed.evaluate(box);await original.context.close();
   const f=await fixture(number,mobile),{page,card,ed,task}=f,initial=await ed.evaluate(box);
   assert.ok(Math.abs(initial.area.width-initialOld.area.width)<=1,`bai0${number} width changed`);
   assert.ok(Math.abs(initial.area.height-initialOld.area.height)<=2,`bai0${number} height changed: ${initial.area.height} vs ${initialOld.area.height}`);
   const draft=['#include <iostream>','using namespace std;','int main() {','    cout << "KHUNG_CODE_OK" << endl;',...Array.from({length:100},(_,i)=>'    // Dong '+i+': '+(i===99?'abc '.repeat(130):'abc '.repeat(4))),'    return 0;','}'].join('\n');
   await ed.evaluate((e,value)=>{e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));},draft);
   const long=await ed.evaluate(box);assert.equal(long.rows,initial.rows);assert.equal(long.area.height,initial.area.height);
   assert.ok(long.area.sw>long.area.cw+1500);assert.ok(long.area.sh>long.area.ch+1000);
   await ed.evaluate(e=>{e.scrollLeft=400;e.scrollTop=600;e.dispatchEvent(new Event('scroll'));});
   await page.waitForTimeout(50);let sc=await ed.evaluate(box);
   assert.equal(sc.area.left,sc.layer.left);assert.equal(sc.area.top,sc.layer.top);assert.equal(sc.area.top,sc.gutter.top);
   await ed.scrollIntoViewIfNeeded();await ed.focus();await ed.press('Control+End');await ed.press('ArrowUp');await ed.press('ArrowUp');await ed.press('End');await ed.type('KET_DONG_DAI');
   await page.waitForTimeout(50);sc=await ed.evaluate(box);assert.ok(sc.area.left>1000);assert.equal(sc.area.left,sc.layer.left);assert.equal(sc.area.top,sc.layer.top);
   const tail=await ed.evaluate(e=>{const layer=e.parentElement.querySelector('.cpp-color-layer'),walker=document.createTreeWalker(layer,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode())if(n.textContent.includes('KET_DONG_DAI')){const start=n.textContent.indexOf('KET_DONG_DAI'),range=document.createRange();range.setStart(n,start);range.setEnd(n,start+12);const r=range.getBoundingClientRect(),a=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,minX:a.left,maxX:a.left+e.clientWidth,minY:a.top,maxY:a.top+e.clientHeight};}});
   assert.ok(tail&&tail.left>=tail.minX&&tail.right<=tail.maxX+1&&tail.top>=tail.minY&&tail.bottom<=tail.maxY+1,'typed text is visible: '+JSON.stringify(tail));
   await ed.press('Enter');await ed.type('// DONG_NGAN');await page.waitForTimeout(50);sc=await ed.evaluate(box);
   assert.equal(sc.area.left,0);assert.equal(sc.layer.left,0);assert.equal(sc.area.top,sc.layer.top);assert.equal(sc.area.top,sc.gutter.top);assert.equal(sc.area.height,initial.area.height);
   const value=await ed.inputValue();assert.equal(await page.evaluate(id=>PortalCloud.peek().drafts[id],task.id),value);
   await ed.press('Control+z');assert.notEqual(await ed.inputValue(),value);await ed.press('Control+y');assert.equal(await ed.inputValue(),value);
   await page.reload();await ed.waitFor();assert.equal(await ed.inputValue(),value);assert.equal((await ed.evaluate(box)).area.height,initial.area.height);
   await ed.scrollIntoViewIfNeeded();await ed.evaluate(e=>{e.scrollLeft=200;e.scrollTop=500;e.dispatchEvent(new Event('scroll'));});
   if(number===3)await card.locator('.editor-shell').screenshot({path:path.join(out,mobile?'editor-mobile.png':'editor-desktop.png')});
   await page.setViewportSize(mobile?{width:430,height:844}:{width:1180,height:900});await page.waitForTimeout(100);sc=await ed.evaluate(box);
   assert.equal(sc.layer.cw,sc.area.cw);assert.equal(sc.layer.ch,sc.area.ch);
   await card.locator('[data-act="reset-code"]').click();assert.equal(await ed.inputValue(),task.starter);
   await page.waitForTimeout(50);assert.equal(await card.locator('.cpp-color-layer').textContent(),task.starter+'\n');
   report.push({lesson:'bai0'+number,mobile,initialHeight:initial.area.height,initialWidth:initial.area.width,longScrollWidth:long.area.sw,longScrollHeight:long.area.sh});
   await f.context.close();console.log('PASS bai0'+number+(mobile?' mobile':' desktop')+': original size, both axes, highlight/gutter sync, typing, undo/redo, saved draft, reset, resize');
  }
  // A normal stage uses the same editor outside the Boss layout; run the actual worker too.
  const f=await fixture(2,false,false,true);assert.ok(f,'regular code stage exists');
  await f.ed.evaluate(e=>{e.value='#include <iostream>\nusing namespace std;\nint main(){\n'+Array.from({length:100},(_,i)=>'// '+(i===80?'abc '.repeat(150):'Dong '+i)).join('\n')+'\ncout << "KHUNG_CODE_OK" << endl; return 0; }';e.dispatchEvent(new Event('input',{bubbles:true}));});
  await f.ed.scrollIntoViewIfNeeded();const pointer=await f.ed.boundingBox();await f.page.mouse.move(pointer.x+pointer.width/2,pointer.y+pointer.height/2);await f.page.mouse.wheel(260,200);
  await f.page.waitForFunction(id=>{const e=document.querySelector(`[data-card="${id}"] .code-editor`),l=e.parentElement.querySelector('.cpp-color-layer');return e.scrollTop>0&&e.scrollLeft>0&&l.scrollTop===e.scrollTop&&l.scrollLeft===e.scrollLeft;},f.task.id);
  await f.card.locator('[data-act="run"]').click();await f.page.waitForFunction(id=>document.querySelector(`[data-card="${id}"] .terminal-transcript`)?.textContent.includes('KHUNG_CODE_OK'),f.task.id);
  await f.page.waitForFunction(id=>!document.querySelector(`[data-card="${id}"] [data-act="run"]`).disabled,f.task.id);
  await f.ed.evaluate(e=>{e.value='#include <iostream>\nusing namespace std;\nint main(){int a,b;cout << "A: ";cin >> a;cout << "B: ";cin >> b;cout << a+b;return 0;}';e.dispatchEvent(new Event('input',{bubbles:true}));});
  await f.card.locator('[data-act="run"]').click();const input=f.card.locator('.terminal-input');await input.waitFor({state:'visible'});await input.fill('3');await input.press('Enter');
  await f.page.waitForFunction(id=>document.querySelector(`[data-card="${id}"] .terminal-transcript`).textContent.includes('B: '),f.task.id);await input.fill('5');await input.press('Enter');
  await f.page.waitForFunction(id=>!document.querySelector(`[data-card="${id}"] [data-act="run"]`).disabled,f.task.id);assert.ok((await f.card.locator('.terminal-transcript').textContent()).endsWith('8'));
  await f.context.close();assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,process.argv.includes('--wheel-only')?'wheel-results.json':'results.json'),JSON.stringify({passed:true,cases:report,nativeWheelBothAxes:true,regularStageRun:true,interactiveCin:true,errors},null,2));
  console.log('PASS native mouse wheel on both axes, regular stage real-worker run and interactive cin; no page errors');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.stack);process.exit(1)});
