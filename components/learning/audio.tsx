"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {Volume2,X} from "lucide-react";
import clips from "../../lib/recorded-speech.json";
import {speechChunks} from "../../lib/speech";
import {asset} from "../../lib/studio-model";

const recordings:Record<string,string>=clips;
export function useLessonAudio(device:boolean){
  const player=useRef<HTMLAudioElement>(null),request=useRef<AbortController|undefined>(undefined),blob=useRef(""),epoch=useRef(0);
  const queue=useRef<string[]>([]),part=useRef(0);
  const [state,setState]=useState(""),[label,setLabel]=useState("");
  const stop=useCallback(()=>{
    epoch.current++;request.current?.abort();request.current=undefined;
    window.speechSynthesis?.cancel();player.current?.pause();queue.current=[];
    if(blob.current)URL.revokeObjectURL(blob.current);blob.current="";setState("");setLabel("");
  },[]);
  useEffect(()=>stop,[stop]);
  async function play(url:string,version:number){
    if(version!==epoch.current||!player.current)return;
    const audio=player.current;audio.src=url;audio.playbackRate=1;setState("audio");setLabel("Нажми ▶ для воспроизведения");
    try{await audio.play();if(epoch.current===version)setLabel("Слушаем английский");}catch{ /* Native controls remain available after an autoplay restriction. */ }
  }
  async function fetchPart(version:number){
    const controller=new AbortController();request.current=controller;
    try{
      const res=await fetch("/api/speech",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:queue.current[part.current]}),signal:controller.signal});
      if(!res.ok){const details=await res.json().catch(()=>null) as {error?:string}|null;throw new Error(details?.error||"Не удалось получить озвучку.");}
      const data=await res.blob();if(version!==epoch.current)return;
      if(blob.current)URL.revokeObjectURL(blob.current);blob.current=URL.createObjectURL(data);await play(blob.current,version);
    }catch(e){if(!controller.signal.aborted&&version===epoch.current){setState("notice");setLabel((e as Error).message);}}
  }
  function speak(text:string){
    stop();const version=epoch.current,clip=recordings[text.trim()];
    if(clip){void play(asset("media/speech/"+clip),version);return;}
    let parts:string[];
    try{parts=speechChunks(text);}catch(e){setState("notice");setLabel((e as Error).message);return;}
    if(!parts.length){setState("notice");setLabel("В тексте нет английской реплики.");return;}
    if(device){
      const synth=window.speechSynthesis,voice=synth?.getVoices().find(v=>v.lang.toLowerCase().startsWith("en"));
      if(!synth||typeof SpeechSynthesisUtterance==="undefined"){setState("notice");setLabel("Для этой реплики браузеру нужен синтез речи. Записи учебника доступны в уроках.");return;}
      setState("notice");setLabel("Слушаем английский");
      parts.forEach((chunk,i)=>{const utterance=new SpeechSynthesisUtterance(chunk);utterance.lang="en-US";if(voice)utterance.voice=voice;utterance.rate=.95;
        utterance.onerror=()=>{if(version===epoch.current)setLabel("Голос браузера недоступен. Записи учебника можно слушать в уроках.");};
        if(i===parts.length-1)utterance.onend=()=>{if(version===epoch.current)setLabel("Прослушивание завершено");};synth.speak(utterance);});return;
    }
    queue.current=parts;part.current=0;setState("loading");setLabel("Готовим озвучку…");void fetchPart(version);
  }
  function next(){if(part.current+1<queue.current.length){part.current++;void fetchPart(epoch.current);}else setLabel("Прослушивание завершено");}
  const bar=<div hidden={!state} className="audio-player" aria-label="Озвучивание"><Volume2 size={18}/><span role="status">{label}</span>
    <audio ref={player} hidden={state!=="audio"} controls preload="none" onEnded={next} onPlay={()=>setLabel("Слушаем английский")}
      onError={()=>{if(player.current?.currentSrc){setState("notice");setLabel("Не удалось открыть аудиофайл. Проверь соединение и повтори.");}}}/>
    <button className="icon-button" aria-label="Закрыть озвучивание" onClick={stop}><X size={17}/></button></div>;
  return {speak,stop,bar};
}
