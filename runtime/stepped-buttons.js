// Skin-authored line metrics. Measurements are batched before CSS writes.
export function installSteppedButtons(panel,rule,signal){
 const doc=panel.ownerDocument,win=doc.defaultView;let frame=0,width=0;
 const measure=()=>{frame=0;if(!panel.isConnected||panel.closest('[hidden]')||panel.getAttribute('aria-hidden')==='true')return;
  const sizes=[];
  for(const button of panel.querySelectorAll(rule.Selector)){
   if(button.closest('[hidden]')||!button.getClientRects().length||!button.offsetWidth)continue;
   const fixed=button.matches(rule.FixedSelector);if(fixed){sizes.push([button,'1',true]);continue}
   const label=button.querySelector(rule.LabelSelector)??button,walker=doc.createTreeWalker(label,win.NodeFilter.SHOW_TEXT),tops=[];
   while(walker.nextNode()){if(!walker.currentNode.textContent.trim())continue;const range=doc.createRange();range.selectNodeContents(walker.currentNode);for(const rect of range.getClientRects())if(rect.width&&rect.height&&!tops.some(y=>Math.abs(y-rect.top)<3))tops.push(rect.top)}
   sizes.push([button,String(Math.max(1,tops.length)),false]);
  }
  for(const [button,lines,fixed]of sizes){if(button.style.getPropertyValue(rule.LinesVariable)!==lines)button.style.setProperty(rule.LinesVariable,lines);if(button.classList.contains(rule.FixedClass)!==fixed)button.classList.toggle(rule.FixedClass,fixed)}
 };
 const resize=()=>{if(!frame&&!signal.aborted)frame=win.requestAnimationFrame(measure)};
 const observer=new win.ResizeObserver(()=>{const next=panel.clientWidth;if(next!==width){width=next;resize()}});observer.observe(panel);doc.fonts?.ready.then(resize);resize();
 const dispose=()=>{observer.disconnect();if(frame)win.cancelAnimationFrame(frame);frame=0};signal.addEventListener('abort',dispose,{once:true});return {resize,dispose};
}
