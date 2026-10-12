import {semanticValue} from './semantic-model.js';
// Semantic order is data; SPL chooses which pieces form each visual group.
export function applySequence(element,rule,model){
 const items=semanticValue(rule.Source,model)??[];
 if(!Array.isArray(items)||items.length>5000)throw Error('Sequence requires an ordered array');
 const ids=items.map(item=>typeof item==='string'?item:item?.id);
 if(ids.some(id=>typeof id!=='string'||!id)||new Set(ids).size!==ids.length)throw Error('Sequence requires unique string identifiers');
 const index=ids.indexOf(rule.Key);
 if(index<0)element.style.removeProperty('order');
 else element.style.setProperty('order',String(index*100+(rule.Part??0)),'important');
}
