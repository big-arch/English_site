import { grade, lessons, tutors } from "../lib/curriculum";
import type { Action, DeviceModel, Message, Profile, Snapshot, StudioAPI } from "../lib/studio-model";
import type { Attempt } from "../lib/lesson-types";

const stores=["profile","attempts","messages"] as const;
type Table=typeof stores[number];
let opening:Promise<IDBDatabase>|undefined;
function database(){
  if(!opening)opening=new Promise<IDBDatabase>((resolve,reject)=>{
    const request=indexedDB.open("english-studio-public-v1",1);
    request.onupgradeneeded=()=>{for(const name of stores)request.result.createObjectStore(name);};
    request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();opening=undefined;};resolve(db);};
    request.onerror=()=>{opening=undefined;reject(new Error("Браузер не разрешил сохранить данные. Проверь доступ к хранилищу сайта."));};
    request.onblocked=()=>{opening=undefined;reject(new Error("Закрой другие вкладки студии и обнови страницу."));};
  });
  return opening;
}
async function read<T>(table:Table,key?:string):Promise<T>{
  const db=await database();return new Promise((resolve,reject)=>{
    const s=db.transaction(table).objectStore(table);
    const r=key===undefined?s.getAll():s.get(key);
    r.onsuccess=()=>resolve(r.result as T);r.onerror=()=>reject(r.error);
  });
}
async function put(table:Table,key:string,value:unknown,append=false){
  const db=await database();
  await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction(table,"readwrite"),s=tx.objectStore(table);
    if(append){const r=s.get(key);r.onsuccess=()=>s.put([...(r.result||[]),...value as Message[]].slice(-60),key);}
    else s.put(value,key);
    tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(new Error("Не удалось сохранить результат на устройстве. Проверь свободное место и повтори попытку."));
  });
}
type ModelSession={clone:()=>Promise<ModelSession>;prompt:(text:string)=>Promise<string>;destroy:()=>void};
type ModelOptions={expectedInputs:{type:"text";languages:string[]}[];expectedOutputs:{type:"text";languages:string[]}[]};
type ModelAPI={
  availability:(options:ModelOptions)=>Promise<string>;
  create:(options:ModelOptions&{initialPrompts?:{role:"system";content:string}[];monitor?:(m:EventTarget)=>void})=>Promise<ModelSession>;
};
const options:ModelOptions={expectedInputs:[{type:"text",languages:["en"]}],expectedOutputs:[{type:"text",languages:["en"]}]};
const model=()=>(window as unknown as {LanguageModel?:ModelAPI}).LanguageModel;
let session:ModelSession|undefined;
export const deviceModel:DeviceModel={
  status:async()=>session?"active":await model()?.availability(options)??"unavailable",
  enable:async(progress)=>{
    const provider=model();if(!provider)throw new Error("В этом браузере локальная модель недоступна.");
    session=await provider.create({...options,initialPrompts:[{role:"system",content:"You are an English tutor. Respond in English. Give one short correction if needed and ask one relevant follow-up. Accept US and UK English. Do not infer pronunciation from text."}],
      monitor:m=>m.addEventListener("downloadprogress",e=>progress((e as Event & {loaded:number}).loaded))});
  },
  disable:()=>{session?.destroy();session=undefined;},
};
const defaults:Profile={level:"A2",goal:"Английский для работы, поездок и повседневных разговоров"};
async function request(body?:Action,tutor?:string){
  if(!body){
    const [profile,progress,messages]=await Promise.all([read<Profile|undefined>("profile","me"),read<Attempt[]>("attempts"),tutor?read<Message[]|undefined>("messages",tutor):Promise.resolve([])]);
    return {profile:profile??defaults,progress:progress.sort((a,b)=>b.updated_at.localeCompare(a.updated_at)),messages:messages??[],aiReady:!!session,name:"Личный профиль"} satisfies Snapshot;
  }
  if(body.action==="profile"){await put("profile","me",{goal:body.goal,level:body.level});return {saved:true};}
  if(body.action==="chat"){
    if(!session)throw new Error("Включи локальный ИИ или открой разговор по сценарию.");
    const teacher=tutors.find(item=>item.id===body.tutor);
    const subject=teacher?.id==="marcus"?"Practise engineering and work conversations.":teacher?.id==="ava"?"Roleplay daily life in the USA or Canada.":"Focus on one grammar point in a short exchange.";
    const profile=await read<Profile|undefined>("profile","me");
    const messages=await read<Message[]|undefined>("messages",body.tutor)??[];
    const input="English level: "+(profile?.level??"A2")+". Tutor role: "+(teacher?.name??"Emma")+". "+subject+
      ". Recent turns: "+JSON.stringify(messages.slice(-4))+"\nLearner: "+body.message;
    const turn=await session.clone();
    let content:string;
    try {content=(await turn.prompt(input)).trim();} finally {turn.destroy();}
    if(!content)throw new Error("Модель вернула пустой ответ. Попробуй ещё раз.");
    await put("messages",body.tutor,[{role:"user",content:body.message},{role:"assistant",content}],true);
    return {content};
  }
  const lesson=lessons.find(l=>l.id===body.lessonId);
  if(!lesson)throw new Error("Урок не найден.");
  if(body.action==="check"){
    if(!lesson.exercises[body.index])throw new Error("Задание не найдено.");
    return grade(lesson,lesson.exercises.map((_,i)=>i===body.index?body.answer:"")).results[body.index];
  }
  if(body.answers.length!==lesson.exercises.length)throw new Error("Ответь на все задания.");
  const result=grade(lesson,body.answers);
  const row:Attempt={lesson_id:lesson.id,score:result.score,total:result.total,answers:JSON.stringify(body.answers),updated_at:new Date().toISOString(),missed:result.results.flatMap((v,i)=>v.correct?[]:[i])};
  await put("attempts",lesson.id,row);return result;
}
export const deviceAPI:StudioAPI=async <T=Snapshot>(body?:Action,tutor?:string)=>await request(body,tutor) as T;
