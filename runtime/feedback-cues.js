export function hapticAcknowledgement(enabled,env=globalThis,duration=8){
  if(!enabled)return false;
  try{
    if(env.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return false;
    if(typeof env.navigator?.vibrate!=='function')return false;
    return env.navigator.vibrate(duration)===true;
  }catch{return false}
}

export function createNotificationCue(env=globalThis){
  let context=null;
  async function unlock(){
    const Context=env.AudioContext||env.webkitAudioContext;
    if(!Context)return false;
    try{
      if(!context||context.state==='closed')context=new Context();
      if(context.state!=='running')await context.resume();
      return context.state==='running';
    }catch{return false}
  }
  function notify(){
    if(!context||context.state!=='running'||env.document?.hidden)return false;
    try{
      const start=context.currentTime;
      for(const [frequency,offset] of [[880,0],[1320,.09]]){
        const oscillator=context.createOscillator(),gain=context.createGain();
        oscillator.type='sine';oscillator.frequency.value=frequency;
        gain.gain.setValueAtTime(0,start+offset);
        gain.gain.linearRampToValueAtTime(.035,start+offset+.012);
        gain.gain.exponentialRampToValueAtTime(.0001,start+offset+.32);
        oscillator.connect(gain);gain.connect(context.destination);
        oscillator.start(start+offset);oscillator.stop(start+offset+.35);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};
      }
      return true;
    }catch{return false}
  }
  env.document?.addEventListener?.('pointerdown',()=>{unlock().catch(()=>{})},{capture:true});
  return {unlock,notify};
}
