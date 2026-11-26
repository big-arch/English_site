"use client";
import {useState} from "react";
import {ArrowRight, ArrowUpRight, Clapperboard, Play, Search} from "lucide-react";
import {films} from "../../lib/field-guide";
import type {Attempt, Film, LessonCard} from "../../lib/lesson-types";
import {asset} from "../../lib/studio-model";
import {LessonFilm} from "./field-media";
import {LessonList} from "./catalog";
const duration:Record<Film,string>={handover:"0:47",commute:"0:42",cafe:"0:37"};
const resources=[
  {title:"The Interview",provider:"VOA Learning English",detail:"Собеседование на американском английском",url:"https://learningenglish.voanews.com/a/lets-learn-english-level-2-lesson-2/3960471.html"},
  {title:"You're Hired",provider:"British Council",detail:"Серия о работе и найме · B1–B2",url:"https://learnenglish.britishcouncil.org/free-resources/business/youre-hired"},
  {title:"Video Zone",provider:"British Council",detail:"Культура, технологии и повседневная жизнь",url:"https://learnenglish.britishcouncil.org/free-resources/general/video-zone"},
];
export function Library({lessons,progress,open,stop}:{lessons:LessonCard[];progress:Attempt[];open:(l:LessonCard,reading?:boolean)=>void;stop:()=>void}){
  const [tab,setTab]=useState("Фильмы"),[id,setId]=useState<Film>("handover"),[query,setQuery]=useState("");
  const texts=lessons.filter(l=>(l.title+" "+l.topic+" "+l.text).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <><header className="page-intro"><span className="kicker"><Clapperboard size={15}/>Аудирование и чтение</span><h1>Медиатека</h1><p>Слушай, как звучит английский в знакомых ситуациях, и применяй услышанное в уроке.</p></header>
    <div className="index-tabs" aria-label="Формат материала">{["Фильмы","Тексты","У авторов"].map(t=><button key={t} aria-pressed={t===tab} onClick={()=>{stop();setTab(t);}}>{t} <small>{t==="Тексты"?lessons.length:3}</small></button>)}</div>
    {tab==="Фильмы"&&<div className="cinema"><section className="cinema-main"><LessonFilm film={id} key={id} onPlay={stop}/>
      <span className="kicker">Диалог · B1 · {duration[id]}</span><h2 lang="en">{films[id].title}</h2><p>{films[id].focus}</p>
      <button className="primary" onClick={()=>{const lesson=lessons.find(l=>l.id===films[id].lesson);if(lesson)open(lesson);}}>Пройти урок по видео <ArrowRight size={16}/></button></section>
      <aside className="cinema-list"><h3>В этой подборке</h3>{(Object.keys(films) as Film[]).map(f=><button key={f} aria-pressed={f===id} onClick={()=>{stop();setId(f);}}>
        <span className="film-poster"><img src={asset("media/films/"+f+".webp")} alt="" width="120" height="68"/><i>{duration[f]}</i></span>
        <span><small>{f==="handover"?"Работа":f==="commute"?"Транспорт":"В кафе"}</small><strong lang="en">{films[f].title}</strong></span><Play size={15}/></button>)}</aside></div>}
    {tab==="Тексты"&&<><label className="search-field"><Search size={17}/><input aria-label="Найти текст" placeholder="Найти текст" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      {texts.length?<LessonList items={texts} progress={progress} open={l=>open(l,true)} reading/>:<p role="status" className="empty">По этому запросу текстов нет.</p>}</>}
    {tab==="У авторов"&&<div className="reading-sources">{resources.map(r=><a key={r.title} href={r.url} target="_blank" rel="noreferrer"><span><small>{r.provider}</small><strong>{r.title}</strong><span>{r.detail}</span></span><ArrowUpRight size={22}/></a>)}</div>}</>;
}
