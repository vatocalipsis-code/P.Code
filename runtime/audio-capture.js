// Browser input acquisition only. Transport and interpretation of the recording belong to the consumer.
export function installAudioCapture(panel,rule,emit,root=panel){
 const doc=panel.ownerDocument,win=doc.defaultView;
 let current=null,disposed=false,sessionId=Symbol();
 const canvas=[...(panel.querySelectorAll?.('canvas[data-plane-login]')??[])].find(n=>n.dataset.planeLogin===rule.Waveform);
 if(rule.Waveform&&!canvas)throw Error('Unknown AudioCapture waveform target');
 const clear=()=>{if(canvas){canvas.width=rule.Width;canvas.height=rule.Height}};clear();
 const send=(s,value)=>{if(!disposed&&current===s&&!s.closed)emit({...value,sessionId:s.id})};
 const release=s=>{win.clearTimeout(s.timer);win.cancelAnimationFrame(s.frame);s.stream?.getTracks().forEach(track=>track.stop());s.stream=null;s.context?.close().catch(()=>{});s.context=null};
 const cancel=()=>{const s=current;if(!s)return;s.closed=true;current=null;try{if(s.recorder?.state==='recording')s.recorder.stop()}finally{release(s);s.chunks=[]}};
 const fail=(s,code)=>{s.failed=true;try{if(s.recorder?.state==='recording')s.recorder.stop()}finally{release(s);s.chunks=[]}send(s,{status:'error',code})};
 async function start(config){
  cancel();const s={id:config.id,closed:false,failed:false,chunks:[],bytes:0};current=s;
  try{
   if(!win.navigator.mediaDevices?.getUserMedia||!win.MediaRecorder){fail(s,'unsupported');return}
   s.stream=await win.navigator.mediaDevices.getUserMedia({audio:true});
   if(disposed||current!==s||s.closed){release(s);return}
   const mime=config.formats.find(type=>win.MediaRecorder.isTypeSupported(type));if(!mime){fail(s,'format');return}
   s.recorder=new win.MediaRecorder(s.stream,{mimeType:mime,audioBitsPerSecond:config.bitsPerSecond});
   const Audio=win.AudioContext||win.webkitAudioContext;
   if(Audio){
    s.context=new Audio();const analyser=s.context.createAnalyser();analyser.fftSize=256;s.context.createMediaStreamSource(s.stream).connect(analyser);
    const data=new Uint8Array(analyser.frequencyBinCount);
    if(canvas){canvas.width=rule.Width;canvas.height=rule.Height;const context=canvas.getContext('2d');
     const draw=()=>{if(!s.context||s.closed||current!==s)return;analyser.getByteFrequencyData(data);context.clearRect(0,0,rule.Width,rule.Height);context.fillStyle=win.getComputedStyle(rule.ColorScope==='Root'?root:panel).getPropertyValue(rule.ColorVariable)||rule.FallbackColor;const step=rule.Width/rule.Bars;for(let i=0;i<rule.Bars;i++){const h=Math.max(rule.MinBarHeight,data[i*rule.SampleStride]/rule.Divisor);context.fillRect(i*step+rule.BarInset,(rule.Height-h)/2,rule.BarWidth,h)}s.frame=win.requestAnimationFrame(draw)};draw();
    }
   }
   s.recorder.ondataavailable=event=>{if(s.closed||current!==s)return;if(event.data.size){s.chunks.push(event.data);s.bytes+=event.data.size;if(s.bytes>config.maxBytes&&s.recorder.state==='recording')s.recorder.stop()}};
   s.recorder.onerror=()=>{if(!s.closed)fail(s,'recording')};
   s.recorder.onstop=async()=>{
    release(s);if(s.closed||s.failed||current!==s)return;
    if(s.bytes>config.maxBytes){fail(s,'size');return}
    try{
     const blob=new win.Blob(s.chunks,{type:mime});s.chunks=[];
     const audio=await new Promise((resolve,reject)=>{const reader=new win.FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob)});
     send(s,{status:'recorded',mime:mime.split(';')[0],audio});
    }catch{fail(s,'recording')}
   };
   s.recorder.start(250);send(s,{status:'recording'});s.timer=win.setTimeout(()=>{if(s.recorder.state==='recording')s.recorder.stop()},config.durationMs);
  }catch(error){if(!s.closed&&current===s)fail(s,error.name==='NotAllowedError'?'permission':'microphone')}
 }
 function update(config,nextSessionId=config?.id??null){
  if(disposed)return;
  if(nextSessionId!==sessionId){sessionId=nextSessionId;clear()}
  if(!config){cancel();return}
  if(typeof config.id!=='string'||!config.id||config.id.length>256||!Array.isArray(config.formats)||!config.formats.length||config.formats.some(t=>typeof t!=='string')||!Number.isInteger(config.maxBytes)||config.maxBytes<1||config.maxBytes>20000000||!Number.isInteger(config.durationMs)||config.durationMs<1||config.durationMs>300000||!Number.isInteger(config.bitsPerSecond)||config.bitsPerSecond<8000||config.bitsPerSecond>512000)throw Error('Invalid audio capture configuration');
  if(current?.id!==config.id)void start(config);
  else if(config.stop&&current.recorder?.state==='recording')current.recorder.stop();
 }
 return {update,cancel,dispose(){disposed=true;cancel()}};
}
