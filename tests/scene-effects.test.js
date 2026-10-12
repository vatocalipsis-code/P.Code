import test from 'node:test';import assert from 'node:assert/strict';
import {validateSceneEffects} from '../runtime/scene-effects.js';
import {validatePLang} from '../runtime/validator.js';
import {parseSPL,serializeSPL} from '../editor/spl.js';
const effects={Viewport:{TopVariable:'--viewport-top',HeightVariable:'--viewport-height'},AutoSize:{Target:'Input',RowHeight:44,MultilineHeight:88,MultilineClass:'multiline'},Scroll:{Target:'Records',Threshold:8},Resize:{Handle:'Handle',Target:'Records',MinHeight:96,ViewportMargin:180},Focus:{Target:'Input',CompactTarget:'Body',CompactWidth:600},Outside:{Target:'Choices',Scope:'Subject',Command:'dismiss'}};
test('scene behavior is declarative, bounded and capability-negotiated',()=>{
 validateSceneEffects(effects);const Data=[{Login:'Scene',Properties:{SceneEffects:effects},Layout:[],SimplePanels:[]}];
 assert.throws(()=>validatePLang(Data,{},[]),/scene-effects/);assert.equal(validatePLang(Data,{},['pcode.scene-effects.v1']),true);
 const spl={SetLang:{Name:'fixture',Version:1,Data},SetData:{Name:'data',Version:1,Data:{}},SetRender:{Name:'render',Version:1,Data:{}}};assert.deepEqual(parseSPL(serializeSPL(spl)).SetLang.Data,Data);
 for(const value of [{Execute:{Code:'x'}},{AutoSize:{...effects.AutoSize,RowHeight:-1}},{Resize:{...effects.Resize,ViewportMargin:Infinity}},{Viewport:{...effects.Viewport,TopVariable:'color'}},{Focus:{...effects.Focus,JavaScript:'x'}},{Outside:{Scope:'Subject',Command:'dismiss'}}])assert.throws(()=>validateSceneEffects(value),/Invalid SceneEffects/);
});
