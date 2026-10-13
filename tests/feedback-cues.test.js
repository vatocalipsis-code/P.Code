import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hapticAcknowledgement,createNotificationCue} from '../runtime/feedback-cues.js';

test('haptics are personal progressive enhancement and never gate an action',()=>{
  let calls=0;
  const env={navigator:{vibrate:value=>{calls++;assert.equal(value,8);return true}},matchMedia:()=>({matches:false})};
  assert.equal(hapticAcknowledgement(true,env),true);assert.equal(calls,1);
  assert.equal(hapticAcknowledgement(true,{navigator:{vibrate:()=>false}}),false);
  assert.equal(hapticAcknowledgement(false,env),false);assert.equal(calls,1);
  assert.equal(hapticAcknowledgement(true,{matchMedia:()=>({matches:false}),navigator:{}}),false);
  assert.equal(hapticAcknowledgement(true,{matchMedia:()=>({matches:true}),navigator:{vibrate(){throw Error('must not run')}}}),false);
});

test('notification cue is a two-tone acknowledgement',async()=>{
  let tones=0,resumes=0;
  const parameter={setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}};
  class Audio{
    constructor(){this.state='suspended';this.currentTime=0;this.destination={}}
    async resume(){resumes++;this.state='running'}
    createOscillator(){return{frequency:{value:0},connect(){},disconnect(){},start(){tones++},stop(){}}}
    createGain(){return{gain:parameter,connect(){},disconnect(){}}}
  }
  const notifier=createNotificationCue({AudioContext:Audio,document:{hidden:false}});
  assert.equal(notifier.notify(),false);
  assert.equal(await notifier.unlock(),true);
  assert.equal(resumes,1);
  assert.equal(notifier.notify(),true);
  assert.equal(tones,2);
});
test('notification cue owns the first-gesture audio unlock',async()=>{
 let gesture,resumes=0;
 class Audio{constructor(){this.state='suspended'}async resume(){resumes++;this.state='running'}}
 createNotificationCue({AudioContext:Audio,document:{addEventListener(type,handler){assert.equal(type,'pointerdown');gesture=handler}}});
 gesture();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(resumes,1);
});
