/* Presentation only: keep the native textarea, keyboard handling and lesson state. */
(()=>{'use strict';
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function color(code){
  const tokens=/\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#\s*(?:include|define)|\b(?:int|double|float|bool|char|string|long|short|unsigned|void|const|if|else|for|while|do|break|continue|return|using|namespace|std|true|false)\b|\b(?:cout|cin|endl|main)\b|\b\d+(?:\.\d+)?\b/g;
  let out='',at=0;
  for(const m of code.matchAll(tokens)){
   out+=escape(code.slice(at,m.index));const t=m[0];
   const kind=t.startsWith('//')||t.startsWith('/*')?'comment':t[0]==='"'||t[0]==="'"?'string':/^\d/.test(t)?'number':/^(cout|cin|endl|main)$/.test(t)?'function':t[0]==='#'?'directive':'keyword';
   out+=`<span class="cpp-token cpp-${kind}">${escape(t)}</span>`;at=m.index+t.length;
  }
  return out+escape(code.slice(at));
 }
 const mounted=new WeakMap();
 function mount(area){
  if(mounted.has(area))return mounted.get(area);
  const wrap=document.createElement('div');wrap.className='cpp-color-editor';area.before(wrap);
  const layer=document.createElement('pre');layer.className='cpp-color-layer cpp-syntax';layer.setAttribute('aria-hidden','true');
  wrap.append(layer,area);
  const scroll=()=>{layer.style.height=area.clientHeight+'px';layer.style.width=area.clientWidth+'px';layer.scrollTop=area.scrollTop;layer.scrollLeft=area.scrollLeft;const gutter=wrap.parentElement.querySelector('.gutter');if(gutter)gutter.scrollTop=area.scrollTop;};
  let previous;
  const refresh=()=>{if(previous!==area.value){previous=area.value;layer.innerHTML=color(previous)+'\n';}scroll();};
  area.addEventListener('input',refresh);area.addEventListener('scroll',scroll);mounted.set(area,refresh);refresh();return refresh;
 }
 const examples=new WeakMap();
 function highlight(root){
  if(examples.get(root)===root.textContent)return;
  root.classList.add('cpp-syntax');
  // Preserve the existing emphasis on placeholders in syntax templates.
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];let node;
  while((node=walker.nextNode()))if(!node.parentElement.closest('.cpp-token'))nodes.push(node);
  for(const text of nodes){const template=document.createElement('template');template.innerHTML=color(text.data);text.replaceWith(template.content);}
  examples.set(root,root.textContent);
 }
 function scan(){
  document.querySelectorAll('textarea.code-editor').forEach(area=>mount(area)());
  document.querySelectorAll('.code-demo pre code,pre.cp-mau,pre.cp-code,.gm-row>code').forEach(highlight);
 }
 let pending=false;
 const schedule=()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;scan();});};
 new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
 // Native reset buttons update textarea.value without emitting an input event.
 document.addEventListener('click',schedule);addEventListener('resize',schedule);
 window.CppSyntax={color,refresh:scan};scan();
})();
