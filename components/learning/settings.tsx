"use client";
import {useEffect,useState,type FormEvent} from "react";
import {ArrowUpRight, Check, Download, Settings2} from "lucide-react";
import {accountURL,type Profile,type StudioAPI} from "../../lib/studio-model";
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export function SettingsView({profile,device,api,saved}:{profile:Profile;device:boolean;api:StudioAPI;saved:(p:Profile)=>void}){
  const [goal,setGoal]=useState(profile.goal),[level,setLevel]=useState(profile.level),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
  const [offer,setOffer]=useState<InstallEvent|undefined>(undefined);
  useEffect(()=>{const listener=(e:Event)=>{e.preventDefault();setOffer(e as InstallEvent);};window.addEventListener("beforeinstallprompt",listener);
    const ready=(window as Window & {studioInstall?:InstallEvent}).studioInstall;if(ready)setOffer(ready);
    return()=>window.removeEventListener("beforeinstallprompt",listener);},[]);
  async function save(e:FormEvent){e.preventDefault();setBusy(true);setStatus("");try{await api({action:"profile",goal:goal.trim(),level});saved({goal:goal.trim(),level});setStatus("Настройки сохранены");}
    catch(e){setStatus((e as Error).message);}finally{setBusy(false);}}
  return <><header className="page-intro"><span className="kicker"><Settings2 size={15}/>Профиль</span><h1>Мои настройки</h1></header>
    <div className="settings-grid"><form onSubmit={save} className="settings-sheet"><h2>Учебная цель</h2>
      <label className="stack-label">Для чего тебе английский?<textarea value={goal} minLength={3} maxLength={300} required onChange={e=>{setGoal(e.target.value);setStatus("");}}/></label>
      <label className="stack-label">Учебный уровень<select value={level} onChange={e=>{setLevel(e.target.value);setStatus("");}}>{["A1","A2","B1","B2","C1","C2"].map(l=><option key={l}>{l}</option>)}</select></label>
      <p className="muted">Этот ориентир учитывает ИИ-репетитор. Сложность каждого урока можно выбрать в каталоге.</p>
      <button className="primary" disabled={busy||goal.trim().length<3}><Check size={16}/>{busy?"Сохраняем…":"Сохранить"}</button>{status&&<p role="status">{status}</p>}</form>
      <aside className="settings-side"><section><h3>Где хранится прогресс</h3><p>{device?"На этом устройстве, в базе браузера GitHub Pages. У каждого браузера своя история.":"В твоём аккаунте English Studio. После входа с другого устройства результаты будут доступны там."}</p>
       {device?<a className="text-button" href={accountURL}>Закрытая студия владельца <ArrowUpRight size={15}/></a>:<a className="text-button" href="/signout-with-chatgpt?return_to=/" target="_top">Выйти из аккаунта <ArrowUpRight size={15}/></a>}</section>
      <section><h3><Download size={18}/> На главный экран</h3>{offer?<button className="secondary" onClick={async()=>{await offer.prompt();await offer.userChoice;setOffer(undefined);delete (window as Window&{studioInstall?:InstallEvent}).studioInstall;}}>Установить приложение</button>:<p>На iPhone открой «Поделиться» в Safari и выбери «На экран Домой». На Android выбери установку приложения в меню браузера.</p>}</section>
      <section><h3>Голос и ИИ</h3><p>{device?"Уроки используют готовые аудиозаписи. Для собственного голоса применяется распознавание браузера, если оно доступно. Локальный ИИ включается отдельно в разговорной студии.":"Учебные записи доступны сразу. Чат и распознавание используют Groq с серверным лимитом 40 обращений в сутки. Озвучивание произвольных реплик имеет отдельную квоту. Текст чата сохраняется в профиле."}</p></section></aside></div></>;
}
