import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const playwright=await import(process.env.PLAYWRIGHT_MODULE);
const engine=process.env.UI_ENGINE??'chromium';
assert.ok(['chromium','webkit'].includes(engine));
const browser=await playwright[engine].launch({headless:true,...(engine==='chromium'&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.setContent('<div id="plane-code-root"></div>');
  await page.addStyleTag({content:readFileSync(resolve('runtime/renderer.css'),'utf8')});
  const source=readFileSync(resolve('runtime/web-renderer.js'),'utf8').replaceAll('export function ','function ');
  await page.addScriptTag({content:source+'\nwindow.PCodeBrowserTest={renderPlaneCode,patchSetData};'});
  const result=await page.evaluate(()=>{
    const plan=[{type:'BasePanel',Login:'Base',Visual:{Direction:'Vertical'},layout:[],children:[{
      type:'SimplePanel',Login:'List',Visual:{Direction:'Vertical'},layout:[],children:[{
        type:'ActivePanel',Login:'Row',Visual:{Direction:'Vertical',Height:'Auto',MinHeight:60,Padding:8},layout:[{
          type:'Container',Login:'Text',dataSlot:'Text',Order:'Positive',Visual:{Width:220,TextOverflow:'Wrap',HorizontalAlignment:'Left'}
        }],children:[]
      }]
    }]}];
    const render={PanelSpacing:0,BackgroundColor:'#fff',PanelColor:'#fff',BorderColor:'#999',TextColor:'#111',Transparency:0,TextTransparency:0,PictureTransparency:0,Parallax:0};
    const root=document.getElementById('plane-code-root');
    window.PCodeBrowserTest.renderPlaneCode(root,plan,{Text:{SourceText:'Short'}},render);
    const row=root.querySelector('[data-plane-login="Row"]');
    const shortHeight=row.getBoundingClientRect().height;
    window.PCodeBrowserTest.patchSetData(root,{Text:{SourceText:'A long journal description '.repeat(24)}},render);
    const text=root.querySelector('[data-plane-login="Text"] [data-plane-source="Text"]');
    const longHeight=row.getBoundingClientRect().height;
    return{shortHeight,longHeight,textHeight:text.getBoundingClientRect().height,whiteSpace:getComputedStyle(text).whiteSpace,contained:text.getBoundingClientRect().bottom<=row.getBoundingClientRect().bottom+1};
  });
  assert.ok(result.shortHeight>=60,result);
  assert.ok(result.longHeight>result.shortHeight,result);
  assert.ok(result.textHeight>30,result);
  assert.equal(result.whiteSpace,'normal');
  assert.equal(result.contained,true);
  console.log(JSON.stringify({status:'PASS',engine,result}));
}finally{await browser.close()}
