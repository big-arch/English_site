"use client";
import { useState } from "react";
import { ArrowRight, Check, Play, Volume2 } from "lucide-react";
import { fields, fieldOrder, films, imageUrl } from "../../lib/field-guide";
import { filmLines } from "../../lib/film-transcripts";
import type { Attempt, Field, Film, LessonCard } from "../../lib/lesson-types";

export function PhotoWords({field, speak}: {field: Field; speak: (text: string) => void}) {
  const info = fields[field];
  const [active, setActive] = useState(0);
  const word = info.landmarks[active];
  return <figure className="word-photo">
    <div className="marked-photo">
      <img src={imageUrl(field)} alt={info.alt} width="1020" height="680"/>
      {info.landmarks.map((item,i) => <button type="button" key={item.word} style={{left:item.left+"%",top:item.top+"%"}}
        className={"map-pin"+(i===active?" is-active":"")} aria-label={"Изучить слово "+item.word} aria-pressed={i===active}
        onClick={()=>setActive(i)}>{i+1}</button>)}
    </div>
    <figcaption><div className="word-tabs" aria-label="Слова на фотографии">{info.landmarks.map((item,i)=>
      <button type="button" key={item.word} aria-pressed={active===i} onClick={()=>setActive(i)}>{item.word}</button>)}</div>
      <div className="word-definition" aria-live="polite"><div><strong lang="en">{word.word}</strong><span>{word.meaning}</span><p lang="en">{word.phrase}</p></div>
      <button type="button" className="icon-button" aria-label={"Прослушать "+word.phrase} onClick={()=>speak(word.phrase)}><Volume2 size={18}/></button></div>
    </figcaption>
  </figure>;
}

export function LessonFilm({film, onPlay}: {film: Film; onPlay?: () => void}) {
  const path="/media/films/"+film;
  const [failed,setFailed]=useState(false);
  return <figure className="lesson-film">
    <video controls playsInline preload="metadata" poster={path+".webp"} width={960} height={540} aria-label={films[film].title}
      src={path+".mp4"} onPlay={onPlay} onError={()=>setFailed(true)}>
      <track kind="captions" src={path+".en.vtt"} srcLang="en" label="English"/>
    </video>
    {failed&&<p role="status">Используй расшифровку, чтобы продолжить задание.</p>}
    <details><summary>Английская расшифровка</summary><ol lang="en">{filmLines[film].map(line=><li key={line}>{line}</li>)}</ol></details>
  </figure>;
}

export function FilmLibrary({open,stopAudio}: {open: (id: string) => void;stopAudio:()=>void}) {
  const [selected,setSelected]=useState<Film>();
  return <section className="film-library"><h2>Видеоуроки</h2>
    <div className="film-cards">{(Object.keys(films) as Film[]).map(id=><button className="film-card" key={id}
      aria-pressed={selected===id} onClick={()=>{stopAudio();setSelected(id);}}>
      <div><img src={"/media/films/"+id+".webp"} alt="" width="960" height="540" loading="lazy"/><span><Play size={17} fill="currentColor"/></span></div>
      <strong lang="en">{films[id].title}</strong><small>{films[id].focus}</small>
    </button>)}</div>
    {selected&&<div className="library-player" key={selected}><h3 lang="en">{films[selected].title}</h3>
      <LessonFilm film={selected} onPlay={stopAudio}/><button className="primary" onClick={()=>open(films[selected].lesson)}>Пройти урок по видео <ArrowRight size={17}/></button></div>}
  </section>;
}

export function Atlas({catalog,progress,next,open,allLessons,showProgress,goal,practice}: {
  catalog: LessonCard[];progress: Attempt[];next?: LessonCard;open:(lesson:LessonCard)=>void;
  allLessons:()=>void;showProgress:()=>void;goal?:string;practice:()=>void;
}) {
  const done=new Set(progress.map(p=>p.lesson_id));
  const route=next?.field?.route;
  const cover=route??(next?.topic==="США и Канада"||next?.topic==="Путешествия"?"commute":
    next?.topic==="Повседневная жизнь"?"cafe":next?.topic==="BIM и проектирование"?"bridge":"handover");
  return <div className="atlas">
    {next ? <section className="atlas-feature">
      <div className="feature-copy"><div className="feature-meta">{route?fields[route].title:next.topic} <span>·</span> {next.level} <span>·</span> {next.minutes} мин</div>
        <h2>{next.title}</h2><p>{next.subtitle}</p><button className="primary" onClick={()=>open(next)}>Начать занятие <ArrowRight size={18}/></button></div>
      <img src={imageUrl(cover)} alt={fields[cover].alt} fetchPriority="high" width="1020" height="680"/>
    </section> : <section className="all-done"><Check/><h2>Все уроки пройдены</h2><button className="secondary" onClick={showProgress}>Открыть результаты</button></section>}
    <div className="section-heading"><h2>Учебные маршруты</h2><button className="text-button" onClick={allLessons}>Все уроки <ArrowRight size={16}/></button></div>
    <div className="route-grid">{fieldOrder.map(id=>{
      const chain=catalog.filter(l=>l.field?.route===id);
      const target=chain.find(l=>!done.has(l.id))??chain[0];
      if(!target)return null;
      return <button key={id} className="route-card" onClick={()=>open(target)}>
        <img src={imageUrl(id)} alt="" loading="lazy" width="1020" height="680"/>
        <div><strong>{fields[id].title}</strong><span>{fields[id].intro}</span><small>{chain.filter(l=>done.has(l.id)).length} / {chain.length} пройдено <ArrowRight size={15}/></small></div>
      </button>;
    })}</div>
    <section className="atlas-footer"><div><h3>Твоя цель</h3><p>{goal}</p>
      <button className="text-button" onClick={showProgress}>Без ошибок · {progress.filter(p=>p.score===p.total).length} из {catalog.length} <ArrowRight size={15}/></button></div>
      <div><h3>Разговор с репетитором</h3><p>Выбери ситуацию и ответь голосом или текстом.</p>
        <button className="text-button" onClick={practice}>Открыть темы <ArrowRight size={15}/></button></div></section>
  </div>;
}
