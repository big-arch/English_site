"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {ArrowRight,AudioLines,BookOpen,ChartNoAxesColumnIncreasing,Clapperboard,Compass,GraduationCap,Settings2,UserRound,X} from "lucide-react";
import {nextInRoute} from "../lib/field-guide";
import {asset,hashFor,locationFromHash,type Catalog,type DeviceModel,type Location,type Section,type Snapshot,type StudioAPI} from "../lib/studio-model";
import {serverAPI} from "../lib/studio-api";
import type {Attempt,LessonCard,LessonResult} from "../lib/lesson-types";
import LessonPlayer from "../components/learning/lesson-player";
import {StudioHome} from "../components/learning/studio-home";
import {CatalogView} from "../components/learning/catalog";
import {Library} from "../components/learning/library";
import {ProgressView} from "../components/learning/journal";
import {PracticeRoom} from "../components/learning/practice-room";
import {SettingsView} from "../components/learning/settings";
import {useLessonAudio} from "../components/learning/audio";

const nav=[
  {id:"home",name:"Сегодня",short:"Сегодня",icon:Compass},{id:"lessons",name:"Уроки",short:"Уроки",icon:BookOpen},
  {id:"library",name:"Медиатека",short:"Медиа",icon:Clapperboard},{id:"tutors",name:"Разговор",short:"Разговор",icon:AudioLines},
  {id:"progress",name:"Прогресс",short:"Прогресс",icon:ChartNoAxesColumnIncreasing},
] as const;
export default function Studio({lessons,tutors,topics,conversationTopics,device}:Catalog&{device?:{api:StudioAPI;model:DeviceModel}}){
  const api=device?.api??serverAPI;
  const [snapshot,setSnapshot]=useState<Snapshot>(),[error,setError]=useState(""),[loading,setLoading]=useState(true);
  const [loc,setLocation]=useState<Location>({section:"home"}),[instance,setInstance]=useState(0),[reviewSet,setReview]=useState<number[]>();
  const [draft,setDraft]=useState(""),[reload,setReload]=useState(0);
  const heading=useRef<HTMLElement>(null);
  const {speak,stop,bar}=useLessonAudio(!!device);
  useEffect(()=>{
    let active=true;setLoading(true);api().then(s=>{if(active){setSnapshot(s);setError("");}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[api,reload]);
  useEffect(()=>{
    function read(){stop();setReview(undefined);setDraft("");setLocation(locationFromHash(window.location.hash));setInstance(s=>s+1);window.scrollTo(0,0);}
    setLocation(locationFromHash(window.location.hash));window.addEventListener("hashchange",read);
    const install=(event:Event)=>{event.preventDefault();(window as Window&{studioInstall?:Event}).studioInstall=event;};
    window.addEventListener("beforeinstallprompt",install);
    if("serviceWorker" in navigator)navigator.serviceWorker.register(asset("sw.js")).catch(()=>{});
    return()=>{window.removeEventListener("hashchange",read);window.removeEventListener("beforeinstallprompt",install);};
  },[stop]);
  const go=useCallback((target:Location,indices?:number[])=>{
    stop();const hash=hashFor(target);
    if(window.location.hash!==hash)window.history.pushState(null,"",hash);
    setLocation(target);setReview(indices);setInstance(n=>n+1);setDraft("");setError("");window.scrollTo({top:0,behavior:"instant"});heading.current?.focus({preventScroll:true});
  },[stop]);
  const progress=snapshot?.progress??[],next=nextInRoute(lessons,progress,lessons.find(l=>l.id===progress[0]?.lesson_id));
  const lesson=lessons.find(l=>l.id===loc.lessonId);
  function open(l:LessonCard,reading=false,errors?:number[]){go({section:loc.section,lessonId:l.id,route:loc.route,mode:errors?.length?"review":reading?"reading":undefined},errors);}
  function remember(l:LessonCard,r:LessonResult,answers:string[]){
    const row:Attempt={lesson_id:l.id,score:r.score,total:r.total,answers:JSON.stringify(answers),updated_at:new Date().toISOString(),missed:r.results.flatMap((a,i)=>a.correct?[]:[i])};
    setSnapshot(s=>s?{...s,progress:[row,...s.progress.filter(p=>p.lesson_id!==l.id)]}:s);
  }
  const navItems=(mobile=false)=>nav.map(n=><a key={n.id} href={hashFor({section:n.id})} aria-current={loc.section===n.id?"page":undefined}
    onClick={e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();go({section:n.id});}}><n.icon size={mobile?20:16}/><span>{mobile?n.short:n.name}</span></a>);
  const step=(section:Section)=>go({section});
  const needsReview=progress.find(p=>p.missed?.length&&lessons.some(l=>l.id===p.lesson_id));
  return <div className="studio"><a className="skip-link" href="#studio-main" onClick={e=>{e.preventDefault();heading.current?.focus();}}>К содержанию</a>
    <header className="masthead"><div className="mast-inner"><a className="wordmark" href="#home" aria-label="English Studio, главная" onClick={e=>{e.preventDefault();step("home");}}>
      <span className="press-mark" aria-hidden="true"><i/><i/><i/></span><span>English <em>Studio</em></span></a>
      <nav className="top-nav" aria-label="Разделы студии">{navItems()}</nav>
      <button className="account-control" aria-label="Настройки профиля" onClick={()=>step("settings")}><GraduationCap size={17}/><span>{snapshot?.profile.level??"A2"}</span><i/><UserRound size={17}/></button></div></header>
    <main id="studio-main" ref={heading} tabIndex={-1} className="studio-main">
      {error&&<div className="error-banner" role="alert">{error}<button className="icon-button" aria-label="Закрыть сообщение" onClick={()=>setError("")}><X size={17}/></button></div>}
      {loading?<div className="skeleton" role="status" aria-label="Открываем студию"><div/><div/><div/></div>:!snapshot?<div className="empty"><h1>Не удалось открыть профиль</h1><button className="primary" onClick={()=>setReload(n=>n+1)}>Попробовать ещё раз</button></div>:
      <div className="view-enter" key={loc.lessonId??loc.section}>
      {lesson?<LessonPlayer key={instance} lesson={lesson} reading={loc.mode==="reading"} review={loc.mode==="review"?(reviewSet??progress.find(p=>p.lesson_id===lesson.id)?.missed):undefined}
        next={nextInRoute(lessons,progress,lesson)} close={()=>go({section:loc.section,route:loc.route})} open={open} send={api} saved={(r,a)=>remember(lesson,r,a)} speak={speak} stopAudio={stop}
        discuss={text=>{step("tutors");setDraft(text);}}/>:loc.lessonId?<div className="empty"><h1>Урок не найден</h1><button className="primary" onClick={()=>step("lessons")}>В каталог</button></div>:
      loc.section==="home"?<StudioHome catalog={lessons} progress={progress} next={next} open={open} openRoute={route=>go({section:"lessons",route})} allLessons={()=>step("lessons")} showProgress={()=>step("progress")}
        practice={()=>step("tutors")} library={()=>step("library")} review={()=>{const l=lessons.find(i=>i.id===needsReview?.lesson_id);if(l)open(l,false,needsReview?.missed);else step("progress");}}/>:
      loc.section==="lessons"?<CatalogView key={loc.route??"all"} items={lessons} topics={topics} progress={progress} route={loc.route} clearRoute={()=>step("lessons")} open={open}/>:
      loc.section==="library"?<Library lessons={lessons} progress={progress} open={open} stop={stop}/>:
      loc.section==="tutors"?<PracticeRoom tutors={tutors} topics={conversationTopics} api={api} cloudReady={snapshot.aiReady} model={device?.model} initialDraft={draft} speak={speak} stop={stop}/>:
      loc.section==="progress"?<ProgressView lessons={lessons} progress={progress} first={()=>open(next??lessons[0])} open={open} review={l=>open(l,false,progress.find(p=>p.lesson_id===l.id)?.missed)}/>:
      <SettingsView profile={snapshot.profile} device={!!device} api={api} saved={profile=>setSnapshot(s=>s?{...s,profile}:s)}/>}</div>}
    </main>
    <footer className="studio-footer"><span>English <em>Studio</em></span><button className="text-button" onClick={()=>step("settings")}><Settings2 size={15}/>Мои настройки <ArrowRight size={14}/></button></footer>
    <nav className="bottom-nav" aria-label="Мобильная навигация">{navItems(true)}</nav>{bar}</div>;
}
