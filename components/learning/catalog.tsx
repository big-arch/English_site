"use client";
import {useState} from "react";
import {ArrowRight, BookOpen, Check, Clock3, Search, X} from "lucide-react";
import {fields, imageUrl} from "../../lib/field-guide";
import type {Attempt, Field, LessonCard} from "../../lib/lesson-types";
import {lessonImage} from "./studio-home";

export function LessonList({items,progress,open,reading=false}:{items:LessonCard[];progress:Attempt[];open:(l:LessonCard)=>void;reading?:boolean}){
  return <div className="lesson-list">{items.map(l=>{
    const p=progress.find(row=>row.lesson_id===l.id);
    return <button key={l.id} className="lesson-row" onClick={()=>open(l)}>
      <span className="list-thumb"><img loading="lazy" src={imageUrl(lessonImage(l))} alt="" width="84" height="65"/>{p&&p.score===p.total&&<i><Check size={13}/></i>}</span>
      <span className="row-copy"><small>{l.field?fields[l.field.route].title:l.topic}</small><strong>{l.title}</strong><span>{reading?l.text:l.subtitle}</span></span>
      <span className="row-level">{l.level}</span><span className="row-duration"><Clock3 size={14}/>{l.minutes} мин</span><ArrowRight className="row-arrow" size={16}/>
    </button>;
  })}</div>;
}
export function CatalogView({items,topics,progress,route,clearRoute,open}:{items:LessonCard[];topics:string[];progress:Attempt[];route?:Field;clearRoute:()=>void;open:(l:LessonCard)=>void}){
  const [level,setLevel]=useState("Все"),[topic,setTopic]=useState("Все темы"),[term,setTerm]=useState("");
  const query=term.trim().toLocaleLowerCase("ru");
  const result=items.filter(l=>(!route||l.field?.route===route)&&(topic==="Все темы"||l.topic===topic)&&(level==="Все"||l.level===level)&&
    (!query||[l.title,l.topic,l.subtitle,...l.glossary.flat()].join(" ").toLocaleLowerCase("ru").includes(query)));
  function reset(){setLevel("Все");setTopic("Все темы");setTerm("");clearRoute();}
  return <><header className="page-intro"><span className="kicker"><BookOpen size={15}/>Каталог</span><h1>{route?fields[route].title:"Все уроки"}</h1>
    <p>{route?fields[route].intro:"Выбирай урок по ситуации, уровню или слову, которое хочешь освоить."}</p></header>
    <div className="catalog-toolbar"><label className="search-field"><Search size={18}/><input aria-label="Найти урок" value={term} onChange={e=>setTerm(e.target.value)} placeholder="Найти урок или слово"/>{term&&<button type="button" onClick={()=>setTerm("")} aria-label="Очистить поиск"><X size={16}/></button>}</label>
    {!route&&<label className="select-field"><span>Тема</span><select aria-label="Тема" value={topic} onChange={e=>setTopic(e.target.value)}>{topics.map(t=><option key={t}>{t}</option>)}</select></label>}</div>
    <div className="catalog-sub"><div className="chips" aria-label="Сложность">{["Все","A2","A2+","B1","B2"].map(n=><button key={n} aria-pressed={level===n} onClick={()=>setLevel(n)}>{n}</button>)}</div>
    {route?<button className="text-button" onClick={reset}>Все маршруты <X size={15}/></button>:<span className="muted" aria-live="polite">Найдено · {result.length}</span>}</div>
    {result.length?<LessonList items={result} progress={progress} open={open}/>:<div className="empty"><Search/><h3>Ничего не найдено</h3><p>Попробуй другое слово или убери фильтры.</p><button className="secondary" onClick={reset}>Сбросить фильтры</button></div>}
  </>;
}
