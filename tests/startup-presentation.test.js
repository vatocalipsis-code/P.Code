import {test} from 'node:test';
import assert from 'node:assert/strict';
import {presentationVisible,waitForRendererStyle,failStartupScreen} from '../runtime/startup-presentation.js';

test('Picot owns renderer stylesheet readiness and the failed-startup presentation',async()=>{
 let cleared=0,removed,hidden;
 const stylesheet={sheet:{},media:'print'};
 const root={replaceChildren:()=>cleared++,style:{removeProperty:key=>removed=key}};
 const loader={setAttribute:(name,value)=>hidden=[name,value]};
 const doc={visibilityState:'visible',querySelector:key=>({
  '[data-picot-renderer-style]':stylesheet,
  '[data-picot-root]':root,
  '[data-picot-loader]':loader
 })[key]};
 assert.equal(presentationVisible(doc),true);
 await waitForRendererStyle(doc);
 assert.equal(stylesheet.media,'all');
 failStartupScreen(doc);
 assert.equal(cleared,1);
 assert.equal(removed,'visibility');
 assert.deepEqual(hidden,['hidden','']);
 doc.visibilityState='hidden';
 assert.equal(presentationVisible(doc),false);
});
