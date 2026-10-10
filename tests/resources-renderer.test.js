import test from "node:test";
import assert from "node:assert/strict";
import {compileSetLang} from "../runtime/setlang-compiler.js";
import {renderPlaneCode,disposePlaneCode} from "../runtime/web-renderer.js";

class StyleBag {
  setProperty(key,value){this[key]=value}
}
class FakeElement {
  constructor(tag,doc){this.tagName=tag.toUpperCase();this.ownerDocument=doc;this.children=[];this.dataset={};this.style=new StyleBag();this.attributes={};this.textContent="";}
  append(...nodes){for(const node of nodes)node.parentElement=this;this.children.push(...nodes)}
  replaceChildren(...nodes){for(const old of this.children)old.parentElement=null;this.children=[];this.append(...nodes)}
  setAttribute(name,value){this.attributes[name]=String(value)}
  removeAttribute(name){delete this.attributes[name]}
  addEventListener(){}
  querySelectorAll(selector){
    const nodes=[];
    const matches=child=>selector==='[data-plane-source="Text"]'&&child.dataset.planeSource==='Text'||selector==='[data-plane-data-slot]'&&child.dataset.planeDataSlot!==undefined||selector==='[data-plane-deferred-src]'&&child.dataset.planeDeferredSrc!==undefined;
    const walk=node=>{for(const child of node.children){if(matches(child))nodes.push(child);walk(child)}};
    walk(this);return nodes;
  }
  querySelector(selector){return selector===':scope > [data-plane-container-content]'?this.children.find(child=>child.dataset.planeContainerContent!==undefined)??null:null}
  remove(){this.removed=true}
}
class FakeDocument {
  constructor(){this.head=new FakeElement("head",this)}
  createElement(tag){return new FakeElement(tag,this)}
}
function find(root,predicate){
  if(predicate(root))return root;
  for(const child of root.children??[]){const result=find(child,predicate);if(result)return result}
  return null;
}

const resources={
  Version:1,
  Fonts:[{Name:"ui.primary",Mime:"font/woff2",Data:"d09GMg=="}],
  Pictures:[{Name:"icon.add",Mime:"image/png",Data:"iVBORw0KGgo="}]
};
const lang=[{
  Login:"Base",Properties:{Direction:"Vertical"},Layout:[
    {Login:"Content",Properties:{Font:"ui.primary"}}
  ],SimplePanels:[]
}];
const data={Content:{SourceText:"Hello",SourcePicture:"res:icon.add"}};
const render={PanelSpacing:0,BackgroundColor:"#000",PanelColor:"#111",BorderColor:"#222",TextColor:"#fff",Transparency:0,TextTransparency:0,PictureTransparency:0,Parallax:0};

test("web renderer applies packaged WOFF2 and PNG resources",()=>{
  const doc=new FakeDocument();
  globalThis.document=doc;
  const root=new FakeElement("div",doc);
  const plan=compileSetLang(lang);
  renderPlaneCode(root,plan,data,render,null,resources);

  assert.equal(doc.head.children.length,1);
  assert.match(doc.head.children[0].textContent,/@font-face/);
  assert.match(doc.head.children[0].textContent,/data:font\/woff2;base64,d09GMg==/);

  const text=find(root,node=>node.dataset?.planeSource==="Text");
  assert.ok(text);
  assert.match(text.style.fontFamily,/PCodeRes_/);

  const image=find(root,node=>node.dataset?.planeSource==="Picture");
  assert.ok(image);
  assert.equal(image.src,"data:image/png;base64,iVBORw0KGgo=");

  disposePlaneCode(root);
  assert.equal(doc.head.children[0].removed,true);
  delete globalThis.document;
});

test("authored geometry exposes stable application override tokens",()=>{
  const doc=new FakeDocument();globalThis.document=doc;const root=new FakeElement("div",doc);
  const geometryLang=[{Login:"Base",Properties:{Direction:"Vertical",Gap:9,Padding:11,Width:320,Height:480},Layout:[
    {Type:"Group",Properties:{Orientation:"Vertical",Gap:7,Width:120,Height:80},Layout:[{Login:"Content",Properties:{Width:24,Height:28,Padding:5,Gap:3}}]}
  ],SimplePanels:[]}];
  renderPlaneCode(root,compileSetLang(geometryLang),{Content:{SourceText:"Geometry"}},render,null,null);
  const base=find(root,node=>node.dataset?.planeLogin==="Base"),group=find(root,node=>node.dataset?.planeGroup!==undefined),content=find(root,node=>node.dataset?.planeLogin==="Content");
  assert.equal(base.style.width,"var(--pcode-layout-width, 320px)");
  assert.equal(base.style["--pcode-layout-width"],"320px");
  assert.equal(base.style.height,"var(--pcode-layout-height, 480px)");
  assert.equal(base.style["--pcode-layout-height"],"480px");
  assert.equal(base.style.padding,"var(--pcode-layout-padding, 11px)");
  assert.equal(base.style.gap,"var(--pcode-layout-gap, 9px)");
  assert.equal(group.style.width,"var(--pcode-layout-width, 120px)");
  assert.equal(group.style.height,"var(--pcode-layout-height, 80px)");
  assert.equal(group.style["--pcode-layout-height"],"80px");
  assert.equal(group.style.gap,"var(--pcode-layout-gap, 7px)");
  assert.equal(content.style.width,"var(--pcode-layout-width, 24px)");
  assert.equal(content.style.height,"var(--pcode-layout-height, 28px)");
  assert.equal(content.style.padding,"var(--pcode-layout-padding, 5px)");
  disposePlaneCode(root);delete globalThis.document;
});

test("content-sized rows and wrapped text survive SetData patches",async()=>{
  const {patchSetData}=await import("../runtime/web-renderer.js");
  const doc=new FakeDocument();globalThis.document=doc;const root=new FakeElement("div",doc);
  const lang=[{Login:"Base",Properties:{Direction:"Vertical"},Layout:[],SimplePanels:[{
    Login:"List",Properties:{Direction:"Vertical"},Layout:[],ActivePanels:[{
      Login:"Row",Properties:{Direction:"Vertical",Height:"Auto",MinHeight:60},Layout:[
        {Login:"Text",Properties:{FillHorizontal:true,TextOverflow:"Wrap",MinWidth:20}}
      ]
    }]
  }]}];
  renderPlaneCode(root,compileSetLang(lang),{Text:{SourceText:"Initial text"}},render);
  const row=find(root,node=>node.dataset?.planeLogin==="Row");
  const container=find(root,node=>node.dataset?.planeLogin==="Text");
  assert.equal(row.style.height,"var(--pcode-layout-height, auto)");
  assert.equal(row.style.minHeight,"var(--pcode-layout-min-height, 60px)");
  assert.equal(container.style.minWidth,"var(--pcode-layout-min-width, 20px)");
  assert.equal(find(root,node=>node.dataset?.planeSource==="Text").style.whiteSpace,"normal");
  patchSetData(root,{Text:{SourceText:"Updated text that may wrap across lines"}},render);
  const updated=find(root,node=>node.dataset?.planeSource==="Text");
  assert.equal(updated.textContent,"Updated text that may wrap across lines");
  assert.equal(updated.style.whiteSpace,"normal");
  assert.equal(updated.style.overflowWrap,"anywhere");
  disposePlaneCode(root);delete globalThis.document;
});
