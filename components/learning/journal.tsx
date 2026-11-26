"use client";
import {ArrowRight, BookOpen, ChartNoAxesColumnIncreasing, ListChecks, RotateCcw} from "lucide-react";
import type {Attempt, LessonCard} from "../../lib/lesson-types";
import {fieldOrder,fields} from "../../lib/field-guide";
import {Week} from "./studio-home";

export function ProgressView({progress,lessons,first,open,review}:{progress:Attempt[];lessons:LessonCard[];first:()=>void;open:(l:LessonCard)=>void;review:(l:LessonCard)=>void}){
  const history=progress.flatMap(p=>{const l=lessons.find(item=>item.id===p.lesson_id);return l?[{p,l}]:[];});
  const totals=history.reduce((a,{p})=>({right:a.right+p.score,all:a.all+p.total}),{right:0,all:0});
  const errors=history.filter(({p})=>p.score<p.total);
  return <><header className="page-intro"><span className="kicker"><ChartNoAxesColumnIncreasing size={15}/>Личный журнал</span><h1>Мой прогресс</h1><p>Твои занятия, результаты полных попыток и задания для повторения.</p></header>
    <div className="journal-grid"><div className="journal-main">
    <div className="journal-line"><span><BookOpen size={18}/>Уроков с результатом</span><strong>{history.length} <small>/ {lessons.length}</small></strong></div>
    <div className="journal-line"><span><ListChecks size={18}/>Верных ответов</span><strong>{totals.all?Math.round(totals.right*100/totals.all)+"%":"Пока нет"}</strong></div>
    <div className="section-heading"><h2>История занятий</h2></div>
    {!history.length?<div className="empty"><BookOpen size={27}/><h3>Первое занятие впереди</h3><p>Здесь появятся название урока, дата и результат.</p><button className="primary" onClick={first}>Выбрать первый урок <ArrowRight size={16}/></button></div>:
      history.map(({l,p})=><button key={l.id} className="journal-entry" onClick={()=>open(l)}><span><small>{new Date(p.updated_at).toLocaleDateString("ru-RU",{day:"numeric",month:"long"})} · {l.level}</small><strong>{l.title}</strong></span><b>{p.score}/{p.total}</b><ArrowRight size={16}/></button>)}
    <div className="section-heading"><h2>Повторение ошибок</h2></div>{errors.length?errors.map(({l,p})=><button className="journal-entry" key={l.id} onClick={()=>review(l)}><RotateCcw size={17}/><span><strong>{l.title}</strong><small>Заданий для повторения · {p.total-p.score}</small></span><ArrowRight size={16}/></button>):
    <p className="muted">{history.length?"Все ответы в последних полных попытках верны.":"После первой попытки здесь появятся задания, которые стоит повторить."}</p>}</div>
    <aside className="journal-aside"><h3>Эта неделя</h3><Week progress={progress}/><h3>По маршрутам</h3>{fieldOrder.map(id=>{
      const list=lessons.filter(l=>l.field?.route===id),ids=new Set(list.map(l=>l.id)),n=history.filter(({p})=>ids.has(p.lesson_id)).length;
      return <div className="route-progress" key={id}><div><span>{fields[id].title}</span><b>{n}/{list.length}</b></div><progress value={n} max={list.length} className="course-meter"/></div>;})}</aside></div></>;
}
