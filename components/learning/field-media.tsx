"use client";
import { useState } from "react";
import { Volume2 } from "lucide-react";
import { fields, films, imageUrl } from "../../lib/field-guide";
import { filmLines } from "../../lib/film-transcripts";
import type { Field, Film } from "../../lib/lesson-types";

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
  const path="./media/films/"+film;
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
