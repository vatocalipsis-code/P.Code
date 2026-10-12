// Skin-authored interaction between controls inside one Picot scene.
// Targets never come from application state; state may only enable the action.
export function validateControlAction(action){
 if(!action||typeof action!=='object'||Array.isArray(action)||Object.keys(action).some(k=>!['Kind','Target','WhenSource'].includes(k))||action.Kind!=='OpenPicker'||typeof action.Target!=='string'||!action.Target.trim()||action.Target.length>256)throw Error('Invalid ControlAction');
 if(action.WhenSource!==undefined&&(typeof action.WhenSource!=='string'||!/^[$@]\.[a-zA-Z0-9_.-]+$/.test(action.WhenSource)))throw Error('Invalid ControlAction.WhenSource');
}
export function invokeControlAction(element){
 const action=element.__planeControlAction;if(!action)return false;
 const scene=element.closest('[data-plane-type="BasePanel"]');
 const target=scene?.querySelector('[data-plane-login="'+CSS.escape(action.Target)+'"]');
 if(!target||target.disabled||target.readOnly||target.closest('[hidden]'))return true;
 openNativePicker(target);return true;
}
export function validateControlTargets(scene){
 const inputs=new Set(),actions=[];
 const visit=node=>{if(!node||typeof node!=='object')return;if(node.Type==='EditableInput')inputs.add(node.Login);if(node.Properties?.ControlAction)actions.push(node.Properties.ControlAction);for(const key of ['Layout','Containers','SimplePanels','ActivePanels'])for(const child of node[key]??[])visit(child);for(const child of node.Properties?.AggregateActivePanels??[])visit(child)};
 visit(scene);for(const action of actions)if(!inputs.has(action.Target))throw Error('ControlAction target must be an EditableInput in the same BasePanel: '+action.Target);
}

export function openNativePicker(target){
 if(target.disabled||target.readOnly)return;target.focus();
 if(typeof target.showPicker==='function')try{target.showPicker()}catch(error){if(!['NotAllowedError','InvalidStateError','SecurityError'].includes(error.name))throw error}
}
