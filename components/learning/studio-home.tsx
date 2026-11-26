"use client";
import { ArrowRight, ArrowUpRight, AudioLines, BookOpen, CalendarDays, Check, Clock3, Headphones, Map, RotateCcw } from "lucide-react";
import { fieldOrder, fields, imageUrl } from "../../lib/field-guide";
import type { Attempt, Field, LessonCard } from "../../lib/lesson-types";
import {asset} from "../../lib/studio-model";

export const routeLabels:Record<Field,string>={bridge:"Инженерия",handover:"Работа",commute:"Переезд",cafe:"Город"};
export function lessonImage(item:LessonCard):Field {
  return item.field?.route??(/США|Путешеств|Жиль/.test(item.topic)?"commute":/быт|жизн|общение/i.test(item.topic)?"cafe":/BIM|проектирование/.test(item.topic)?"bridge":"handover");
}
function dateKey(date:Date){return date.getFullYear()+"-"+date.getMonth()+"-"+date.getDate();}
export function Week({progress}:{progress:Attempt[]}){
  const today=new Date(),day=today.getDay()||7,days=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
  const recent=new Set(progress.map(row=>dateKey(new Date(row.updated_at))));
  return <div className="week" aria-label="Дни последних попыток за эту неделю">{days.map((label,i)=>{
    const d=new Date(today);d.setDate(today.getDate()-day+i+1);
    const active=recent.has(dateKey(d)),now=i===day-1;
    return <div key={label} className={(now?"today ":"")+(active?"practised":"")} title={d.toLocaleDateString("ru-RU")+(active?" · есть занятие":"")}>
      <span>{label}</span><i aria-label={active?"Есть занятие":now?"Сегодня":"Нет занятия"}>{active?<Check size={13}/>:now?<b/>:null}</i>
    </div>;
  })}</div>;
}
type HomeProps={catalog:LessonCard[];progress:Attempt[];next?:LessonCard;open:(lesson:LessonCard)=>void;openRoute:(route:Field)=>void;allLessons:()=>void;showProgress:()=>void;practice:()=>void;library:()=>void;review:()=>void};
export function StudioHome({catalog,progress,next,open,openRoute,allLessons,showProgress,practice,library,review}:HomeProps){
  const known=new Set(catalog.map(l=>l.id)),seen=new Set(progress.filter(a=>known.has(a.lesson_id)).map(a=>a.lesson_id));
  const mistakes=progress.filter(row=>row.score<row.total).reduce((n,r)=>n+(r.total-r.score),0);
  return <div className="studio-home">
    <div className="home-heading"><h1>Сегодня в студии</h1><span className="date-note"><CalendarDays size={16}/><span className="date-long">{new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"long",weekday:"long"}).format(new Date())}</span><span className="date-short">{new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"long"}).format(new Date())}</span></span></div>
    <div className="dashboard-lead"><section className="cover">
      <picture><source media="(max-width: 670px)" srcSet={asset("media/studio/atlas-cover-small.webp")}/><img src={asset("media/studio/atlas-cover.webp")} alt="Жёлтый трамвай пересекает арочный мост над рекой на фоне города и низкого солнца." width="1200" height="750" fetchPriority="high"/></picture>
      <div className="cover-copy"><span className="cover-label"><span/> {next?"Следующий урок":"Курс завершён"}</span>
      <h2>{next?.title??"Все уроки пройдены"}</h2>
      {next?<><p>{next.subtitle}</p><div className="cover-meta"><span>{next.level}</span><span><Clock3 size={15}/>{next.minutes} мин</span></div>
        <button className="cover-start" onClick={()=>open(next)}>Начать занятие <ArrowRight size={17}/></button></>:
        <button className="cover-start" onClick={showProgress}>Мои результаты <ArrowRight size={17}/></button>}
      </div></section>
      <aside className="practice-sheet"><div className="sheet-top"><span className="sheet-icon"><BookOpen size={19}/></span><h2>Моя практика</h2></div>
        <div className="count-label"><strong>{seen.size}</strong><span>из {catalog.length} уроков пройдено</span></div>
        <progress className="course-meter" value={seen.size} max={catalog.length} aria-label="Пройдено уроков"/>
        <div className="week-title">Последние попытки недели</div><Week progress={progress}/>
        <button className="text-button" onClick={mistakes?review:showProgress}>{mistakes?<><RotateCcw size={15}/>К ошибкам · {mistakes}</>:"Посмотреть прогресс"}<ArrowRight size={15}/></button>
      </aside>
    </div>
    <div className="section-heading"><div><span className="kicker"><Map size={15}/>Практика по ситуациям</span><h2>Учебные маршруты</h2></div><button className="text-button" onClick={allLessons}>Все уроки <ArrowRight size={16}/></button></div>
    <div className="route-spread">{fieldOrder.map(route=>{
      const list=catalog.filter(l=>l.field?.route===route),passed=list.filter(l=>seen.has(l.id)).length;
      return <button className="route-cover" key={route} onClick={()=>openRoute(route)}>
        <div className="route-visual"><img src={imageUrl(route)} alt="" loading="lazy" width="1020" height="680"/><span>{routeLabels[route]}</span></div>
        <small>{list.length} урока <i/> A2+ – B2 {passed>0&&<em>· {passed} пройдено</em>}</small>
        <div className="route-name"><h3>{fields[route].title}</h3><ArrowUpRight size={18}/></div>
      </button>;
    })}</div>
    <div className="practice-links"><button onClick={library}><span className="practice-icon"><Headphones/></span><div><strong>Послушать диалог</strong><small>Три коротких фильма с субтитрами</small></div><ArrowUpRight/></button>
    <button onClick={practice}><span className="practice-icon amber"><AudioLines/></span><div><strong>Начать разговор</strong><small>Жизнь в городе, работа и грамматика</small></div><ArrowUpRight/></button></div>
  </div>;
}
