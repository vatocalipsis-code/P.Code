import {semanticValue} from './semantic-model.js';
// Skin-authored interaction between controls inside one Picot scene.
// Targets never come from application state; state may only enable the action.
export function validateControlAction(action){
 if(!action||typeof action!=='object'||Array.isArray(action)||Object.keys(action).some(k=>!['Kind','Target','WhenSource','HiddenLabel','RevealedLabel','Continue'].includes(k))||!['OpenPicker','ToggleSecret','RevealSecret'].includes(action.Kind)||typeof action.Target!=='string'||!action.Target.trim()||action.Target.length>256)throw Error('Invalid ControlAction');
 if(action.Continue!==undefined&&(typeof action.Continue!=='boolean'||action.Kind==='OpenPicker'))throw Error('Invalid ControlAction.Continue');
 for(const key of ['HiddenLabel','RevealedLabel'])if(action[key]!==undefined&&(!['ToggleSecret','RevealSecret'].includes(action.Kind)||typeof action[key]!=='string'))throw Error('Invalid secret control label');
 if(action.WhenSource!==undefined&&(typeof action.WhenSource!=='string'||!/^[$@]\.[a-zA-Z0-9_.-]+$/.test(action.WhenSource)))throw Error('Invalid ControlAction.WhenSource');
}
export function invokeControlAction(element){
 const action=element.__planeControlAction;if(!action)return false;
 const scene=element.closest('[data-plane-type="BasePanel"]');
 const target=scene?.querySelector('[data-plane-login="'+CSS.escape(action.Target)+'"]');
 if(!target||target.disabled||target.closest('[hidden]'))return true;
 if(['ToggleSecret','RevealSecret'].includes(action.Kind)){const root=secretRoots.get(target);if(!root)return true;const state=secretStates.get(root),group=target.dataset.planeSecretGroup;if(action.Kind==='ToggleSecret'&&state.groups.has(group))state.groups.delete(group);else state.groups.add(group);syncSecretControls(root);return action.Continue!==true}
 if(target.readOnly)return true;
 openNativePicker(target);return true;
}
export function validateControlTargets(scene){
 const inputs=new Map(),actions=[];
 const visit=(node,repeated=false)=>{if(!node||typeof node!=='object')return;repeated=repeated||Boolean(node.Properties?.Repeat);if(repeated&&node.Properties?.SecretGroup)throw Error('SecretGroup requires a static scene input');if(node.Type==='EditableInput')inputs.set(node.Login,node.Properties);if(node.Properties?.ControlAction)actions.push(node.Properties.ControlAction);for(const key of ['Layout','Containers','SimplePanels','ActivePanels'])for(const child of node[key]??[])visit(child,repeated);for(const child of node.Properties?.AggregateActivePanels??[])visit(child,repeated)};
 visit(scene);for(const action of actions){if(!inputs.has(action.Target))throw Error('ControlAction target must be an EditableInput in the same BasePanel: '+action.Target);if(['ToggleSecret','RevealSecret'].includes(action.Kind)&&!inputs.get(action.Target)?.SecretGroup)throw Error('ToggleSecret target requires SecretGroup')}
}

export function openNativePicker(target){
 if(target.disabled||target.readOnly)return;target.focus();
 if(typeof target.showPicker==='function')try{target.showPicker()}catch(error){if(!['NotAllowedError','InvalidStateError','SecurityError'].includes(error.name))throw error}
}

const secretStates=new WeakMap(),secretRoots=new WeakMap(),secretNodes=new WeakMap();
export function refreshSecretControls(root,model){
 const fields=[...root.querySelectorAll('[data-plane-secret-group]')],buttons=[...root.querySelectorAll('[data-plane-semantic-state]')].filter(n=>['ToggleSecret','RevealSecret'].includes(n.__planeVisual?.ControlAction?.Kind));
 secretNodes.set(root,{fields,buttons});if(!secretStates.has(root))secretStates.set(root,{groups:new Set(),resets:new Map()});for(const field of fields)secretRoots.set(field,root);syncSecretControls(root,model);
}
export function syncSecretControls(root,model){
 const nodes=secretNodes.get(root),state=secretStates.get(root);if(!nodes||!state)return;
 for(const field of nodes.fields){
  const group=field.dataset.planeSecretGroup,path=field.__planeVisual?.SecretResetSource;
  if(path&&model){const value=semanticValue(path,model);if(value!==undefined&&state.resets.get(group)!==value){state.resets.set(group,value);state.groups.delete(group)}}
 }
 for(const field of nodes.fields){const type=state.groups.has(field.dataset.planeSecretGroup)?'text':'password';if(field.type!==type)field.type=type;}
 for(const button of nodes.buttons){
  const action=button.__planeControlAction;if(!action)continue;
  const scene=button.closest('[data-plane-type="BasePanel"]'),target=scene?.querySelector('[data-plane-login="'+CSS.escape(action.Target)+'"]');
  const revealed=state.groups.has(target?.dataset.planeSecretGroup);if(button.getAttribute('aria-pressed')!==String(revealed))button.setAttribute('aria-pressed',String(revealed));
  const label=revealed?action.RevealedLabel:action.HiddenLabel;if(label&&button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
 }
}

export function releaseSecretControls(root){const nodes=secretNodes.get(root);for(const field of nodes?.fields??[])secretRoots.delete(field);secretNodes.delete(root)}
