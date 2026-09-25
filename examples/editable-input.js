import {PlaneCodeEngine} from "../runtime/public-runtime.js";

const selection=PlaneCodeEngine.connect({
  GenerationId:"pcode.layout-group.v1",SerializationVersion:1,
  RequiredCapabilities:["pcode.editable-input.v1"],OptionalCapabilities:[]
});
if(selection.Acceptance.Status!=="Accepted")throw new Error("editable input unavailable");

const SetLang={Name:"editable-example",Version:1,Data:[{
  Login:"Base",Properties:{Direction:"Vertical"},Layout:[
    {Type:"EditableInput",Login:"Amount",Properties:{InputType:"Number",InputMode:"decimal",AriaLabel:"Amount",OnInput:"amount.input",OnSubmit:"amount.submit"}}
  ],SimplePanels:[]
}]};
const SetData={Name:"editable-values",Version:1,Data:{Amount:{InputValue:"",ValidationState:{Status:"None"}}}};
const SetRender={Name:"scene",Version:1,Data:{PanelSpacing:8,BackgroundColor:"#fff",PanelColor:"#fff",BorderColor:"#888",TextColor:"#111",Transparency:0,TextTransparency:0,PictureTransparency:0,Parallax:0}};

const prepared=await selection.Connection.prepare({SetLang,SetData,SetRender});
const runtime=prepared.Runtime;
await runtime.setEventSink(event=>{
  if(event.EventType==="OnInput")console.log("current textual amount",event.Value);
  if(event.EventType==="OnSubmit")console.log("submitted textual amount",event.Value);
});
await runtime.mount(document.querySelector("#app"));
await runtime.enableInteraction();
