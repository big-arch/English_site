"use client";
import {useEffect,useRef,useState} from "react";
import {Mic,Square} from "lucide-react";
type RecognitionEvent={results:ArrayLike<ArrayLike<{transcript:string}>>};
type Recognition={lang:string;interimResults:boolean;onresult:((e:RecognitionEvent)=>void)|null;onend:(()=>void)|null;onerror:((e:{error:string})=>void)|null;start:()=>void;stop:()=>void;abort:()=>void};
type Browser=Window&{SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
export function VoiceInput({cloud,disabled,append,fail,onActive}:{onActive:(active:boolean)=>void;cloud:boolean;disabled:boolean;append:(s:string)=>void;fail:(s:string)=>void}){
  const [status,setStatus]=useState(""),[recorded,setRecorded]=useState("");
  const rec=useRef<MediaRecorder|undefined>(undefined),recognition=useRef<Recognition|undefined>(undefined);
  const stream=useRef<MediaStream|undefined>(undefined),url=useRef(""),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),live=useRef(false);
  const request=useRef<AbortController|undefined>(undefined);
  useEffect(()=>{onActive(Boolean(status));return ()=>onActive(false);},[status,onActive]);
  useEffect(()=>{live.current=true;return ()=>{live.current=false;clearTimeout(timer.current);request.current?.abort();
    recognition.current?.abort();if(rec.current?.state==="recording")rec.current.stop();stream.current?.getTracks().forEach(t=>t.stop());if(url.current)URL.revokeObjectURL(url.current);};},[]);
  async function toggle(){
    if(status==="listening"){recognition.current?.stop();if(rec.current?.state==="recording")rec.current.stop();return;}
    if(status)return;
    setStatus("opening");fail("");
    try{
      const browser=window as Browser,Speech=browser.SpeechRecognition??browser.webkitSpeechRecognition;
      if(!cloud&&Speech){
        const listener=new Speech();recognition.current=listener;listener.lang="en-US";listener.interimResults=false;
        listener.onresult=e=>{if(live.current)append(Array.from(e.results).map(p=>p[0].transcript).join(" "));};
        listener.onerror=e=>{if(live.current&&e.error!=="aborted")fail("Браузер не смог распознать речь. Проверь микрофон или введи реплику.");};
        listener.onend=()=>{clearTimeout(timer.current);if(live.current)setStatus("");};listener.start();setStatus("listening");
        timer.current=setTimeout(()=>listener.stop(),120000);return;
      }
      if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined")throw new Error("Запись недоступна в этом браузере. Реплику можно ввести с клавиатуры.");
      const media=await navigator.mediaDevices.getUserMedia({audio:true});if(!live.current){media.getTracks().forEach(t=>t.stop());return;}
      stream.current=media;const mime=["audio/webm;codecs=opus","audio/mp4","audio/ogg;codecs=opus"].find(v=>MediaRecorder.isTypeSupported(v));
      const recorder=new MediaRecorder(media,mime?{mimeType:mime}:undefined);rec.current=recorder;const parts:BlobPart[]=[];
      recorder.ondataavailable=e=>{if(e.data.size)parts.push(e.data);};
      recorder.onstop=async()=>{
        clearTimeout(timer.current);media.getTracks().forEach(t=>t.stop());if(!live.current)return;
        const type=recorder.mimeType.split(";")[0],blob=new Blob(parts,{type});setStatus("");
        if(!cloud){if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(blob);setRecorded(url.current);return;}
        setStatus("working");const control=new AbortController();request.current=control;
        try{const data=new FormData(),ext=type==="audio/mp4"?"m4a":type==="audio/ogg"?"ogg":"webm";
          data.set("audio",new File([blob],"practice."+ext,{type}));const res=await fetch("/api/voice",{method:"POST",body:data,signal:control.signal});const value=await res.json() as {text:string;error?:string};
          if(!res.ok)throw new Error(value.error||"Не удалось распознать запись.");if(live.current)append(value.text);
        }catch(e){if(live.current)fail((e as Error).message);}finally{if(live.current)setStatus("");}
      };
      recorder.start();setStatus("listening");timer.current=setTimeout(()=>{if(recorder.state==="recording")recorder.stop();},120000);
    }catch(e){stream.current?.getTracks().forEach(t=>t.stop());setStatus("");fail((e as Error).name==="NotAllowedError"?"Доступ к микрофону закрыт в браузере.":(e as Error).message);}
  }
  return <div className="voice-input"><button type="button" className="voice-button" disabled={(disabled&&status!=="listening")||status==="opening"||status==="working"} onClick={()=>void toggle()}>
    {status==="listening"?<Square size={16}/>:<Mic size={17}/>} {status==="listening"?"Остановить":status==="working"?"Распознаём…":status==="opening"?"Микрофон…":"Голос"}</button>
    {recorded&&<label>Прослушать свою запись<audio controls src={recorded}/></label>}</div>;
}
