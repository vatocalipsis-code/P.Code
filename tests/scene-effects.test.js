import test from 'node:test';import assert from 'node:assert/strict';
import {validateSceneEffects} from '../runtime/scene-effects.js';
import {validatePLang} from '../runtime/validator.js';
import {parseSPL,serializeSPL} from '../editor/spl.js';
const effects={Viewport:{TopVariable:'--viewport-top',HeightVariable:'--viewport-height'},AutoSize:{Target:'Input',RowHeight:44,MultilineHeight:88,MultilineClass:'multiline'},Scroll:{Target:'Records',Threshold:8},Resize:{Handle:'Handle',Target:'Records',MinHeight:96,ViewportMargin:180},Focus:{Target:'Input',CompactTarget:'Body',CompactWidth:600},Outside:{Target:'Choices',Scope:'Subject',Command:'dismiss'}};
test('scene behavior is declarative, bounded and capability-negotiated',()=>{
 validateSceneEffects(effects);validateSceneEffects({Scroll:{Target:'Records',Threshold:8,LatestSource:'$.latest'}});assert.throws(()=>validateSceneEffects({Scroll:{Target:'Records',Threshold:8,LatestSource:'raw'}}),/Invalid SceneEffects/);const Data=[{Login:'Scene',Properties:{SceneEffects:effects},Layout:[],SimplePanels:[]}];
 assert.throws(()=>validatePLang(Data,{},[]),/scene-effects/);assert.equal(validatePLang(Data,{},['pcode.scene-effects.v1']),true);
 const spl={SetLang:{Name:'fixture',Version:1,Data},SetData:{Name:'data',Version:1,Data:{}},SetRender:{Name:'render',Version:1,Data:{}}};assert.deepEqual(parseSPL(serializeSPL(spl)).SetLang.Data,Data);
 for(const value of [{Execute:{Code:'x'}},{AutoSize:{...effects.AutoSize,RowHeight:-1}},{Resize:{...effects.Resize,ViewportMargin:Infinity}},{Viewport:{...effects.Viewport,TopVariable:'color'}},{Focus:{...effects.Focus,JavaScript:'x'}},{Outside:{Scope:'Subject',Command:'dismiss'}}])assert.throws(()=>validateSceneEffects(value),/Invalid SceneEffects/);
});

test('native decisions require explicit SPL messages and capability',()=>{
 const Confirm={Source:'$.decision',Messages:{discard:'Discard?'},Accept:'accept',Reject:'reject'};
 validateSceneEffects({Confirm});
 for(const bad of [{...Confirm,Source:'eval()'},{...Confirm,Messages:{}},{...Confirm,Messages:{discard:1}},{...Confirm,Unknown:true}])assert.throws(()=>validateSceneEffects({Confirm:bad}));
 const Data=[{Login:'Scene',Properties:{SceneEffects:{Confirm}},Layout:[],SimplePanels:[]}];
 assert.throws(()=>validatePLang(Data,{},['pcode.scene-effects.v1']),/native-confirm/);
 assert.equal(validatePLang(Data,{},['pcode.scene-effects.v1','pcode.native-confirm.v1']),true);
});

test('stepped native fields require an explicit capability and a positive bounded unit',()=>{
 const SteppedFields={Selector:'textarea.note',UnitVariable:'--row-height',DefaultUnit:42,Class:'measured'};
 validateSceneEffects({SteppedFields});
 for(const bad of [{...SteppedFields,DefaultUnit:0},{...SteppedFields,DefaultUnit:Infinity},{...SteppedFields,Class:'a b'},{...SteppedFields,UnitVariable:'height'}])assert.throws(()=>validateSceneEffects({SteppedFields:bad}));
 const Data=[{Login:'Scene',Properties:{SceneEffects:{SteppedFields}},Layout:[],SimplePanels:[]}];
 assert.throws(()=>validatePLang(Data,{},['pcode.scene-effects.v1']),/stepped-fields/);
 assert.equal(validatePLang(Data,{},['pcode.scene-effects.v1','pcode.stepped-fields.v1']),true);
});

test('audio acquisition is explicit, bounded and requires structured event support',()=>{
 const AudioCapture={Source:'$.capture',SessionSource:'$.sessionId',Command:'input.capture',Waveform:'Wave',ColorScope:'Root',Width:320,Height:64,Bars:32,BarInset:2,BarWidth:6,SampleStride:3,Divisor:4,MinBarHeight:3,ColorVariable:'--meter',FallbackColor:'#6AAAF0'};
 validateSceneEffects({AudioCapture});
 for(const bad of [{...AudioCapture,Bars:129},{...AudioCapture,Bars:1.5},{...AudioCapture,Divisor:0},{...AudioCapture,ColorScope:'Document'},{...AudioCapture,FallbackColor:'url(anything)'},{...AudioCapture,SessionSource:'session'}])assert.throws(()=>validateSceneEffects({AudioCapture:bad}));
 const Data=[{Login:'Scene',Properties:{SceneEffects:{AudioCapture}},Layout:[{Type:'Flow',Login:'Wave',Properties:{Tag:'canvas'}}],SimplePanels:[]}],caps=['pcode.flow-layout.v1','pcode.scene-effects.v1','pcode.audio-capture.v1'];
 assert.throws(()=>validatePLang(Data,{},caps),/structured-events/);assert.equal(validatePLang(Data,{},[...caps,'pcode.structured-events.v1']),true);
});

test('modal exit is an explicitly negotiated bounded presentation rule',()=>{
 const Properties={Modal:true,VisibleSource:'$.open',ModalExit:{Effect:'Fade',Duration:140}},Data=[{Login:'Scene',Properties,Layout:[],SimplePanels:[]}],caps=['pcode.semantic-controls.v1','pcode.semantic-model.v1','pcode.modal-transition.v1'];
 assert.throws(()=>validatePLang(Data,{},caps.slice(0,2)),/modal-transition/);assert.equal(validatePLang(Data,{},caps),true);
 const spl={SetLang:{Name:'fixture',Version:1,Data},SetData:{Name:'data',Version:1,Data:{}},SetRender:{Name:'render',Version:1,Data:{}}};assert.deepEqual(parseSPL(serializeSPL(spl)).SetLang.Data,Data);
 for(const ModalExit of [{Effect:'script',Duration:140},{Effect:'Fade',Duration:1001},{Effect:'Fade',Duration:-1},{Effect:'Fade',Duration:140,Code:'x'}])assert.throws(()=>validatePLang([{...Data[0],Properties:{...Properties,ModalExit}}],{},caps),/ModalExit/);
});
