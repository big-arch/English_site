"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {ArrowRight, AudioLines, MessageCircle, RotateCcw, Send, Volume2} from "lucide-react";
import type {ConversationTopic} from "../../lib/conversations";
import type {DeviceModel, Message, StudioAPI, Tutor} from "../../lib/studio-model";
import {rounds} from "../../lib/guided-rounds";
import {VoiceInput} from "./voice-input";

export function PracticeRoom({tutors,topics,api,cloudReady,model,speak,stop,initialDraft}:{tutors:Tutor[];topics:ConversationTopic[];api:StudioAPI;cloudReady:boolean;model?:DeviceModel;speak:(text:string)=>void;stop:()=>void;initialDraft:string}){
  const [teacher,setTeacher]=useState(tutors[0]),[topicId,setTopicId]=useState(topics[0].id);
  const [mode,setMode]=useState<"guided"|"ai">(initialDraft||(!model&&cloudReady)?"ai":"guided");
  const [messages,setMessages]=useState<Message[]>([]),[answers,setAnswers]=useState<string[]>([]),[draft,setDraft]=useState(initialDraft);
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[availability,setAvailability]=useState("unavailable"),[download,setDownload]=useState<number>();
  const [reading,setReading]=useState(false),[showSample,setShowSample]=useState(false),[recording,setRecording]=useState(false);
  const scrollBox=useRef<HTMLDivElement>(null);
  const epoch=useRef(0),alive=useRef(true),editor=useRef<HTMLTextAreaElement>(null);
  const options=topics.filter(t=>t.tutor===teacher.id),topic=options.find(t=>t.id===topicId)??options[0],round=rounds[topic.id];
  const ready=model?availability==="active":cloudReady;
  useEffect(()=>{alive.current=true;if(model)model.status().then(s=>{if(alive.current)setAvailability(s);}).catch(()=>{});
    return()=>{alive.current=false;epoch.current++;model?.disable();};},[model]);
  useEffect(()=>{const box=scrollBox.current;if(box)box.scrollTop=box.scrollHeight;},[answers,messages,busy,reading]);
  useEffect(()=>{if(mode!=="ai"||!ready){setReading(false);return;}let active=true;setReading(true);setError("");
    api(undefined,teacher.id).then(s=>{if(active)setMessages(s.messages);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setReading(false);});
    return()=>{active=false;};},[api,teacher.id,mode,ready]);
  function changeTeacher(t:Tutor){stop();epoch.current++;setTeacher(t);setTopicId(topics.find(s=>s.tutor===t.id)!.id);setAnswers([]);setMessages([]);setDraft("");setShowSample(false);setError("");}
  function chooseTopic(value:string){const next=topics.find(t=>t.id===value)!;stop();setTopicId(value);setAnswers([]);setShowSample(false);setError("");setDraft(mode==="ai"?next.prompt:"");editor.current?.focus();}
  async function activate(){if(!model||busy)return;setBusy(true);setError("");setDownload(0);
    try{await model.enable(value=>{if(alive.current)setDownload(value);});if(alive.current){setAvailability("active");setMode("ai");}else model.disable();}
    catch{if(alive.current)setError("Модель не удалось открыть. Можно продолжить разговор по сценарию.");}
    finally{if(alive.current){setBusy(false);setDownload(undefined);}}
  }
  async function submit(event:FormEvent){event.preventDefault();const text=draft.trim();if(!text||busy||reading||recording)return;stop();setError("");
    if(mode==="guided"){setAnswers([...answers,text]);setDraft("");return;}
    const version=epoch.current;setBusy(true);
    try{const res=await api<{content:string}>({action:"chat",tutor:teacher.id,message:text});if(alive.current&&version===epoch.current){setMessages(m=>[...m,{role:"user",content:text},{role:"assistant",content:res.content}]);setDraft("");}}
    catch(e){if(alive.current)setError((e as Error).message);}finally{if(alive.current)setBusy(false);}
  }
  const dialogue:Message[]=mode==="guided"?[{role:"assistant",content:round[0]},...answers.flatMap((a,i):Message[]=>i===0?[{role:"user",content:a},{role:"assistant",content:round[1]}]:[{role:"user",content:a}])]:
    [{role:"assistant",content:teacher.opening},...messages];
  const complete=mode==="guided"&&answers.length>=2;
  return <><header className="page-intro"><span className="kicker"><AudioLines size={16}/>Устная и письменная практика</span><h1>Разговорная студия</h1><p>Выбери собеседника и ситуацию. Можно отвечать голосом или писать по-английски.</p></header>
    <div className="talk-layout"><aside className="talk-rail"><h3>Собеседники</h3>{tutors.map((t,i)=><button className={"tutor-option tone-"+i} key={t.id} disabled={busy||recording} onClick={()=>changeTeacher(t)} aria-pressed={t.id===teacher.id}>
      <i>{t.initials}</i><span><strong>{t.name}</strong><small>{t.role}</small></span></button>)}
      <label className="stack-label">Ситуация<select value={topic.id} onChange={e=>chooseTopic(e.target.value)} disabled={busy||recording}>{options.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
      <p className="muted">{topic.description}</p></aside>
    <section className="chat-panel"><div className="chat-header"><MessageCircle size={23}/><div><small>Разговор с {teacher.name}</small><h2>{mode==="guided"?topic.title:teacher.role}</h2></div></div>
      <div className="chat-modes chips"><button aria-pressed={mode==="guided"} disabled={busy||recording} onClick={()=>{stop();setMode("guided");setDraft("");setError("");}}>По сценарию</button>
      <button aria-pressed={mode==="ai"} disabled={busy||recording} onClick={()=>{stop();setMode("ai");setDraft(initialDraft||"");setError("");}}>ИИ-репетитор</button></div>
      {mode==="ai"&&!ready?<div className="chat-unavailable"><h3>{model?"ИИ на этом устройстве":"Подключение ИИ"}</h3>
        {model?availability!=="unavailable"?<><p>Совместимый браузер может один раз загрузить языковую модель. Диалог с ней идёт на английском на этом устройстве.</p><button className="primary" disabled={busy} onClick={()=>void activate()}>{download===undefined?"Включить локальный ИИ":"Подготовка · "+Math.round(download*100)+"%"}</button></>:
        <p>Этот браузер не предоставил локальную языковую модель. На вкладке «По сценарию» доступны все 27 разговорных ситуаций.</p>:
        <p>Серверный ИИ сейчас недоступен. Можно сразу потренироваться по сценарию.</p>}
        <button className="text-button" onClick={()=>setMode("guided")}>К разговору по сценарию <ArrowRight size={15}/></button></div>:
      <><div className="messages" ref={scrollBox} aria-live="polite">{dialogue.map((m,i)=><div key={i} className={"message "+m.role}><small>{m.role==="user"?"Ты":teacher.name}</small><p>{m.content}</p>
        {m.role==="assistant"&&<button className="icon-button" aria-label="Послушать реплику" onClick={()=>speak(m.content)}><Volume2 size={16}/></button>}</div>)}
        {(busy||reading)&&<div className="muted" role="status">{reading?"Загружаем историю…":"Готовим ответ…"}</div>}</div>
      {complete?<div className="dialog-finish"><strong>Ситуация пройдена</strong><div><button className="secondary" onClick={()=>setShowSample(true)}>Сравнить с примером</button>
        <button className="text-button" onClick={()=>chooseTopic(topic.id)}><RotateCcw size={15}/>Ещё раз</button></div>{showSample&&<p lang="en">{round[2]}</p>}</div>:
      <form className="composer" onSubmit={submit}><label className="stack-label">Твоя реплика<textarea ref={editor} lang="en" aria-label="Сообщение репетитору" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={3000} disabled={busy} placeholder="Напиши по-английски…"/></label>
      <div className="composer-row"><VoiceInput key={teacher.id+topic.id+mode} disabled={busy} cloud={!model&&cloudReady} append={s=>setDraft(d=>(d?d+" ":"")+s)} fail={setError} onActive={setRecording}/>
      <button className="primary" disabled={!draft.trim()||busy||reading||recording}>{mode==="ai"?"Отправить":"Ответить"} <Send size={15}/></button></div></form>}</>}
      {error&&<p className="inline-error" role="alert">{error}</p>}
    </section></div></>;
}
