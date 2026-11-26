"use client";
import { useEffect, useRef, useState } from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import { fields, imageUrl } from "../../lib/field-guide";
import type { mountBridge, Part } from "./bridge-engine";

export default function BridgeScene({answer,choose,locked}:{answer:string;choose:(word:string)=>void;locked:boolean}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const engine=useRef<ReturnType<typeof mountBridge>|null>(null);
  const current=useRef({answer,choose,locked});
  useEffect(()=>{current.current={answer,choose,locked};engine.current?.mark(answer);},[answer,choose,locked]);
  const [photo,setPhoto]=useState(false),[ready,setReady]=useState(false);
  useEffect(()=>{
    if(photo)return;
    let active=true;
    const element=canvas.current;
    import("./bridge-engine").then(({mountBridge})=>{
      if(!active||!element)return;
      const handle=mountBridge(element,(part:Part)=>{if(!current.current.locked)current.current.choose(part);},()=>setPhoto(true));
      engine.current=handle;handle.mark(current.current.answer);setReady(true);
    }).catch(()=>{if(active)setPhoto(true);});
    return ()=>{active=false;engine.current?.dispose();engine.current=null;};
  },[photo]);
  return <div className="bridge-scene"><div className="scene-frame">
    {photo?<div className="marked-photo"><img src={imageUrl("bridge")} alt={fields.bridge.alt} width="1020" height="680"/>
      {fields.bridge.landmarks.map((p,i)=><button key={p.word} type="button" className={"map-pin"+(answer===p.word?" is-active":"")}
        aria-label={"Выбрать "+p.word+" на фото"} aria-pressed={answer===p.word} disabled={locked} onClick={()=>choose(p.word)}
        style={{left:p.left+"%",top:p.top+"%"}}>{i+1}</button>)}</div>:
      <canvas ref={canvas} role="img" aria-label="Интерактивная модель моста с настилом, бетонными опорами и стрелкой просвета. Выбрать деталь можно кнопками ниже."/>}
    </div>
    <div className="scene-toolbar"><span>{photo?"Фотография моста":ready?"Поверни мост или нажми на деталь":"Открываем модель…"}</span>
      {!photo&&<div><button type="button" aria-label="Повернуть мост влево" onClick={()=>engine.current?.turn(-.32)}><RotateCcw size={17}/></button>
      <button type="button" aria-label="Повернуть мост вправо" onClick={()=>engine.current?.turn(.32)}><RotateCw size={17}/></button>
      <button type="button" onClick={()=>setPhoto(true)}>Фото</button></div>}
    </div>
    <div className="part-options" aria-label="Выбери часть моста">{fields.bridge.landmarks.map((p,i)=>
      <button key={p.word} type="button" aria-pressed={answer===p.word} disabled={locked} onClick={()=>choose(p.word)}>{photo?(i+1)+". ":""}{p.word}</button>)}</div>
  </div>;
}
