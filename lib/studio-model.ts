import type { Field, LessonCard } from "./lesson-types";
import type { Attempt } from "./lesson-types";
import type { ConversationTopic } from "./conversations";

export type Tutor = {id:string; name:string; role:string; initials:string; description:string; opening:string};
export type Message = {role:"user"|"assistant"; content:string};
export type Profile = {level:string;goal:string};
export type Snapshot = {profile:Profile;progress:Attempt[];messages:Message[];aiReady:boolean;name:string};
export type Catalog = {lessons:LessonCard[];tutors:Tutor[];topics:string[];conversationTopics:ConversationTopic[]};
export type Action =
  | {action:"check";lessonId:string;index:number;answer:string}
  | {action:"submit";lessonId:string;answers:string[]}
  | {action:"profile";goal:string;level:string}
  | {action:"chat";tutor:string;message:string};
export type StudioAPI = <T=Snapshot>(body?:Action,tutor?:string)=>Promise<T>;
export type DeviceModel = {status:()=>Promise<string>;enable:(progress:(fraction:number)=>void)=>Promise<void>;disable:()=>void};

export const accountURL="https://artur-english-studio.bimmanager981.chatgpt.site/";
export const sections=["home","lessons","library","tutors","progress","settings"] as const;
export type Section=typeof sections[number];
export type Location={section:Section;lessonId?:string;mode?:"reading"|"review";route?:Field};
export function locationFromHash(hash:string):Location{
  const [path,query]=hash.replace(/^#\/?/,"").split("?");
  const params=new URLSearchParams(query);
  const id=params.get("route");
  const route=id==="bridge"||id==="handover"||id==="commute"||id==="cafe"?id:undefined;
  if(path?.startsWith("lesson/")){
    const from=params.get("from") as Section;
    const mode=params.get("mode");
    return {section:sections.includes(from)?from:"lessons",lessonId:path.slice(7),mode:mode==="reading"||mode==="review"?mode:undefined,route};
  }
  return {section:sections.includes(path as Section)?path as Section:"home",route};
}
export function hashFor(target:Location){
  if(!target.lessonId)return "#"+target.section+(target.route?"?route="+target.route:"");
  const params=new URLSearchParams({from:target.section});
  if(target.mode)params.set("mode",target.mode);
  if(target.route)params.set("route",target.route);
  return "#lesson/"+target.lessonId+"?"+params.toString();
}
export const asset=(path:string)=>"./"+path.replace(/^\/+/, "");
