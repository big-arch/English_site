"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, ChevronLeft, RotateCcw, Volume2, X } from "lucide-react";
import type { AnswerFeedback, LessonCard, LessonResult } from "../../lib/lesson-types";
import type { StudioAPI } from "../../lib/studio-model";
import { fields, imageUrl } from "../../lib/field-guide";
import { LessonFilm, PhotoWords } from "./field-media";
import BridgeScene from "./bridge-scene";

function Tiles({tiles,locked,onChange}:{tiles:string[];locked:boolean;onChange:(text:string)=>void}) {
  const [chosen,setChosen]=useState<number[]>([]);
  function edit(indices:number[]){setChosen(indices);onChange(indices.map(i=>tiles[i]).join(" "));}
  return <div className="tiles"><div className="tile-answer" aria-label="Собранная фраза" aria-live="polite">
    {chosen.length?chosen.map(i=><button type="button" key={i} disabled={locked} aria-label={"Убрать "+tiles[i]} onClick={()=>edit(chosen.filter(v=>v!==i))}>{tiles[i]} <X size={13}/></button>):
      <span>Нажимай на фрагменты по порядку</span>}</div>
    <div className="tile-bank">{tiles.map((tile,i)=><button type="button" key={i} disabled={locked||chosen.includes(i)}
      onClick={()=>edit([...chosen,i])}>{tile}</button>)}</div>
  </div>;
}

type Props = {
  lesson:LessonCard; reading:boolean; review?:number[]; next?:LessonCard;
  close:()=>void; open:(lesson:LessonCard,reading?:boolean,review?:number[])=>void;
  send:StudioAPI; saved:(result:LessonResult,answers:string[])=>void;
  speak:(text:string)=>void;stopAudio:()=>void; discuss:(message:string)=>void;
};
export default function LessonPlayer({lesson,reading,review,next,close,open,send,saved,speak,stopAudio,discuss}:Props){
  const sequence=review?.length?review:lesson.exercises.map((_,i)=>i);
  const focused=Boolean(review?.length);
  const [stage,setStage]=useState(focused?2:reading?1:0),[step,setStep]=useState(0);
  const [answers,setAnswers]=useState<string[]>(()=>lesson.exercises.map(()=>""));
  const [checks,setChecks]=useState<Record<number,AnswerFeedback>>({});
  const [result,setResult]=useState<LessonResult>(),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  const [transfer,setTransfer]=useState(""),[showExample,setShowExample]=useState(false);
  const heading=useRef<HTMLHeadingElement>(null),pending=useRef(false);
  const index=sequence[step], exercise=lesson.exercises[index], feedback=checks[index], selected=answers[index];
  const activity=exercise.activity,field=lesson.field;
  const missed=result?.results.flatMap((r,i)=>r.correct?[]:[focused?sequence[i]:i])??[];
  useEffect(()=>{heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:"nearest"});},[stage,step]);
  function go(to:number){stopAudio();setError("");setStage(to);}
  function choose(answer:string){if(!feedback&&!pending.current)setAnswers(previous=>previous.map((v,i)=>i===index?answer:v));}
  async function submit(event:FormEvent){
    event.preventDefault();
    if(pending.current||!selected.trim())return;
    if(activity?.kind==="order"&&!feedback&&selected.length!==activity.tiles.join(" ").length)return;
    setError("");
    if(feedback&&step<sequence.length-1){stopAudio();setStep(step+1);return;}
    pending.current=true;setBusy(true);
    try{
      if(!feedback){
        const checked=await send<AnswerFeedback>({action:"check",lessonId:lesson.id,index,answer:selected});
        setChecks(previous=>({...previous,[index]:checked}));
      }else{
        let summary:LessonResult;
        if(focused){const results=sequence.map(i=>checks[i]);summary={score:results.filter(r=>r.correct).length,total:results.length,results};}
        else{summary=await send<LessonResult>({action:"submit",lessonId:lesson.id,answers});saved(summary,answers);}
        setResult(summary);go(3);
      }
    }catch(e){setError((e as Error).message);}
    finally{pending.current=false;setBusy(false);}
  }
  const stages=["Разбор","Ситуация","Практика","Итог"];
  return <section className="lesson-surface field-player">
    <button className="text-button" type="button" onClick={close}><ChevronLeft size={17}/>К занятиям</button>
    <div className="eyebrow">{field?fields[field.route].title:lesson.topic} · {lesson.level} · {lesson.minutes} мин</div>
    <h1>{lesson.title}</h1>
    <div className="lesson-workbench"><aside className="lesson-index">
      {field&&<img className="lesson-cover" src={imageUrl(field.route)} alt="" width="1020" height="680"/>}
      <div className="lesson-plan"><h3>{focused?"Повторение ошибок":"План занятия"}</h3>
        <ol className="lesson-stages">{stages.map((name,i)=>(!focused||i>=2)&&<li key={name} className={stage>=i?"reached":""} aria-current={stage===i?"step":undefined}>
          <span>{stage>i?<Check size={12}/>:i+1}</span>{i<stage&&stage<3&&!focused?<button type="button" onClick={()=>go(i)}>{name}</button>:name}</li>)}</ol>
        <small>{focused?"В этой тренировке":"Заданий в уроке"} · {sequence.length}</small>
      </div></aside>
    <div className="lesson-sheet"><div className="stage-enter" key={stage+"-"+step}>
    {stage===0&&<><h2 ref={heading} tabIndex={-1}>{field?"Задача урока":lesson.subtitle}</h2>{field&&<p className="goal-line">{field.goal}</p>}
      <p className="rule">{lesson.rule}</p><div className="examples">{lesson.examples.map(example=><div key={example}><span lang="en">{example}</span>
      <button className="icon-button" aria-label={"Прослушать "+example} onClick={()=>speak(example)}><Volume2 size={17}/></button></div>)}</div>
      <button className="primary" onClick={()=>go(1)}>Разобрать ситуацию <ArrowRight size={16}/></button></>}
    {stage===1&&<><div className="reading-toolbar"><h2 ref={heading} tabIndex={-1}>Ситуация</h2><button className="text-button" onClick={()=>speak(lesson.text)}><Volume2 size={17}/>Послушать</button></div>
      <p className="reading-text" lang="en">{lesson.text}</p>
      {field&&<><h3>Слова на фотографии</h3><PhotoWords field={field.route} speak={speak}/></>}
      <dl className="glossary">{lesson.glossary.map(([en,ru])=><div key={en}><dt lang="en">{en}</dt><dd>{ru}</dd></div>)}</dl>
      <button className="primary" onClick={()=>go(2)}>Перейти к практике <ArrowRight size={16}/></button></>}
    {stage===2&&<form onSubmit={submit}>
      <div className="exercise-meta">Задание {step+1} из {sequence.length}</div>
      <progress className="lesson-meter" value={step+(feedback?1:0)} max={sequence.length} aria-label="Проверено заданий"/>
      <h2 className="exercise-prompt" ref={heading} tabIndex={-1} id="current-prompt">{exercise.prompt}</h2>
      {activity?.kind==="photo"&&<img className="prompt-photo" src={imageUrl(activity.field)} alt={fields[activity.field].alt} width="1020" height="680"/>}
      {activity?.kind==="film"&&<LessonFilm film={activity.film} onPlay={stopAudio}/>}
      {activity?.kind==="model"?<BridgeScene answer={selected} choose={choose} locked={busy||!!feedback}/>:
       activity?.kind==="order"?<Tiles tiles={activity.tiles} locked={busy||!!feedback} onChange={choose}/>:
       exercise.options?<fieldset className="options choice-set" aria-labelledby="current-prompt">{exercise.options.map(o=>
         <label className={"option"+(selected===o?" selected":"")} key={o}><input type="radio" name="answer" value={o} checked={selected===o}
         disabled={!!feedback||busy} onChange={()=>choose(o)}/>{o}</label>)}</fieldset>:
       <input className="answer-input" aria-label="Твой ответ" value={selected} autoComplete="off" maxLength={500} disabled={!!feedback||busy} onChange={e=>choose(e.target.value)}/>}
      {feedback&&<div className={"feedback feedback-enter "+(feedback.correct?"correct":"incorrect")} role="status"><strong>{feedback.correct?"Верно":"Разберём ответ"}</strong>
        {!feedback.correct&&<p>Подходящий ответ — <b>{feedback.answer}</b></p>}<p>{feedback.explanation}</p></div>}
      {error&&<p className="inline-error" role="alert">{error}</p>}
      <button className="primary" disabled={busy||!selected.trim()||(activity?.kind==="order"&&!feedback&&selected.length!==activity.tiles.join(" ").length)}>
        {busy?"Подождём ответ…":!feedback?"Проверить":step===sequence.length-1?(focused?"Завершить повторение":"Завершить урок"):"Следующее задание"}</button>
    </form>}
    {stage===3&&result&&<><div className="result-heading"><span className="result-icon"><Check/></span><h2 ref={heading} tabIndex={-1}>{focused?"Повторение завершено":"Урок сохранён"}</h2>
      <p>{result.score} из {result.total} верно{focused?" в этой тренировке":""}</p></div>
      {focused&&<p className="muted">В истории занятий хранится оценка за последнюю полную попытку.</p>}
      <div className="result-actions">{next?<button className="primary" onClick={()=>open(next)}>Дальше · {next.title} <ArrowRight size={17}/></button>:
        <button className="primary" onClick={close}>Вернуться к занятиям</button>}
        {missed.length>0&&<button className="secondary" onClick={()=>open(lesson,false,missed)}><RotateCcw size={16}/>Повторить ошибки ({missed.length})</button>}</div>
      {field&&<section className="transfer"><h3>Скажи своими словами</h3><p>{field.transfer}</p>
        <label>Твоя реплика<textarea lang="en" maxLength={600} value={transfer} onChange={e=>setTransfer(e.target.value)}/></label>
        <div className="word-tabs"><button type="button" disabled={!transfer.trim()} onClick={()=>setShowExample(true)}>Сравнить с примером</button>
        <button type="button" disabled={!transfer.trim()} onClick={()=>discuss("Help me practise this task at "+lesson.level+" level: "+field.transfer+" My answer: "+transfer)}>Обсудить с репетитором</button></div>
        {showExample&&<p className="sample-answer" lang="en">{field.exampleReply}</p>}</section>}
      {result.results.some(r=>!r.correct)&&<details className="review-details"><summary>Пояснения к ошибкам</summary>{result.results.filter(r=>!r.correct).map(r=>
        <div className="review-row" key={r.prompt}><strong>{r.prompt}</strong><p>Твой ответ — {r.given}</p><p className="right-answer">{r.answer}</p><span>{r.explanation}</span></div>)}</details>}
      <button className="text-button" onClick={()=>open(lesson)}><RotateCcw size={15}/>Пройти урок ещё раз</button>
    </>}
    </div></div></div>
  </section>;
}
