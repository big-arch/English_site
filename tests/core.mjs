import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { DatabaseSync } from "node:sqlite";

const require=createRequire(import.meta.url);
require.extensions[".ts"]=(module,filename)=>{
  const source=fs.readFileSync(filename,"utf8");
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  module._compile(compiled.outputText,filename);
};
const {lessons,grade,normalize}=require("../lib/curriculum.ts");
const {fieldOrder,fields,films,nextInRoute}=require("../lib/field-guide.ts");
const {filmLines}=require("../lib/film-transcripts.ts");
const {conversationTopics}=require("../lib/conversations.ts");
const {rounds}=require("../lib/guided-rounds.ts");
const {hashFor,locationFromHash}=require("../lib/studio-model.ts");
const {tutors}=require("../lib/curriculum.ts");
const recorded=require("../lib/recorded-speech.json");
assert.deepEqual(Object.keys(rounds).sort(),conversationTopics.map(t=>t.id).sort());
for(const [id,turns] of Object.entries(rounds))assert.ok(turns.length===3&&turns.every(t=>t.trim()),id);
const target={section:"library",lessonId:"field-bridge-walk",route:"bridge",mode:"review"};
assert.deepEqual(locationFromHash(hashFor(target)),target);
assert.equal(locationFromHash("#lesson/past-work?from=unknown").section,"lessons");
assert.equal(locationFromHash("#settings").section,"settings");
assert.equal(locationFromHash("#bad-route").section,"home");
const phrases=new Set([...lessons.flatMap(l=>[l.text,...l.examples]),...Object.values(fields).flatMap(f=>f.landmarks.map(p=>p.phrase)),...tutors.map(t=>t.opening)]);
assert.deepEqual(Object.keys(recorded).sort(),[...phrases].sort());
for(const phrase of phrases){
  assert.match(recorded[phrase],/^[a-f0-9]+\.mp3$/);
  assert.ok(fs.statSync(new URL("../public/media/speech/"+recorded[phrase],import.meta.url)).size>500);
}
const legacy=lessons.filter(l=>!l.field);
const fieldLessons=lessons.filter(l=>l.field);
assert.equal(new Set(lessons.map(l=>l.id)).size,49);
assert.equal(legacy.length,33);
assert.equal(fieldLessons.length,16);
assert.equal(lessons.reduce((sum,l)=>sum+l.exercises.length,0),179);
assert.equal(new Set(conversationTopics.map(t=>t.id)).size,27);
for(const l of lessons){
  const n=l.field?5:3;
  assert.equal(l.exercises.length,n);
  assert.equal(grade(l,l.exercises.map(e=>e.answers[0])).score,n);
  for(const e of l.exercises){
    assert.ok(e.explanation);
    assert.ok(e.answers.every(a=>typeof a==="string"&&a.trim().length));
    if(e.options)assert.ok(e.options.includes(e.answers[0]));
    if(e.activity?.kind==="order"){
      const tiles=e.activity.tiles;
      assert.notEqual(normalize(tiles.join(" ")),normalize(e.answers[0]));
      assert.deepEqual(normalize(tiles.join(" ")).split(" ").sort(),normalize(e.answers[0]).split(" ").sort());
    }
    if(e.activity?.kind==="model")assert.ok(fields.bridge.landmarks.some(p=>p.word===e.answers[0]));
  }
}
assert.ok(legacy.filter(l=>l.exercises.some(e=>!e.options)).length>=8);
for(const route of fieldOrder){
  const chain=fieldLessons.filter(l=>l.field.route===route);
  assert.deepEqual(chain.map(l=>l.level),["A2+","B1","B1","B2"]);
  assert.equal(nextInRoute(lessons,[{lesson_id:chain[0].id}],chain[0]),chain[1]);
  assert.ok(fs.statSync(new URL("../public/media/field/"+route+".webp",import.meta.url)).size>2000);
}
for(const [id,film] of Object.entries(films)){
  const l=lessons.find(l=>l.id===film.lesson);
  assert.ok(l?.exercises.some(e=>e.activity?.kind==="film"&&e.activity.film===id));
  for(const ext of [".webp",".mp4",".en.vtt"])assert.ok(fs.statSync(new URL("../public/media/films/"+id+ext,import.meta.url)).size>100);
  assert.ok(filmLines[id].length>=5);
}
assert.equal(nextInRoute(lessons,[]),fieldLessons[0]);
assert.equal(nextInRoute(lessons,lessons.map(l=>({lesson_id:l.id}))),undefined);
assert.equal(normalize(" If we change here,  we can arrive. "),normalize("If we change here we can arrive"));
const past=lessons.find(l=>l.id==="past-work");
assert.equal(grade(past,["created","did","I did not send the drawings."]).score,3);
assert.equal(grade(past,["am created","are","I didn't sent the drawings"]).score,0);
assert.equal(grade(past,["created","did","I didn’t send the drawings!"]).score,3);
const sql=fs.readFileSync(new URL("../drizzle/0000_dashing_doctor_faustus.sql",import.meta.url),"utf8");
const db=new DatabaseSync(":memory:"); db.exec(sql);
const reserve=db.prepare("INSERT INTO quotas(user_id,day,count) VALUES(?,?,1) ON CONFLICT(user_id,day) DO UPDATE SET count=count+1 WHERE count<40 RETURNING count");
for(let i=1;i<=40;i++)assert.equal(reserve.get("u1","2026-10-01").count,i);
assert.equal(reserve.get("u1","2026-10-01"),undefined);
assert.equal(reserve.get("u2","2026-10-01").count,1);
assert.equal(reserve.get("u1","2026-10-02").count,1);
const save=db.prepare("INSERT INTO progress(user_id,lesson_id,score,total,answers,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET score=excluded.score,total=excluded.total,answers=excluded.answers,updated_at=excluded.updated_at");
save.run("u1","past-work",1,3,"[]","2026-10-01");save.run("u1","past-work",3,3,"[]","2026-10-02");save.run("u2","past-work",0,3,"[]","2026-10-01");
assert.equal(db.prepare("SELECT score FROM progress WHERE user_id=?").get("u1").score,3);
assert.equal(db.prepare("SELECT COUNT(*) AS n FROM progress WHERE user_id=?").get("u1").n,1);

// Exercise the same handlers as the UI with two synthetic identities and a real SQL database.
let profileId="reader-a";
const testDb={prepare(sql){
  const statement=db.prepare(sql);
  return {bind(...values){return {
    all:()=>({results:statement.all(...values)}),first:()=>statement.get(...values),run:()=>statement.run(...values)
  };}};
}};
const serverPath=require.resolve("../lib/server.ts");
require.cache[serverPath]={exports:{
  authorize:async()=>({userId:profileId,fullName:"Test reader"}),database:()=>testDb,groqKey:()=>undefined,
  errorResponse:e=>{throw e;}
}};
const api=require("../app/api/studio/route.ts");
const unit=fieldLessons[0];
const responses=unit.exercises.map(e=>e.answers[0]);
responses[1]="An incorrect answer";
const request=()=>new Request("http://localhost/api/studio");
const submitAnswers=answers=>api.POST(new Request(request(),{method:"POST",body:JSON.stringify({action:"submit",lessonId:unit.id,answers})}));
assert.equal((await (await submitAnswers(responses)).json()).score,4);
const first=await (await api.GET(request())).json();
assert.equal(first.aiReady,false);
assert.deepEqual(first.progress[0].missed,[1]);
profileId="reader-b";
assert.deepEqual((await (await api.GET(request())).json()).progress,[]);
await submitAnswers(unit.exercises.map(e=>e.answers[0]));
assert.deepEqual((await (await api.GET(request())).json()).progress[0].missed,[]);
profileId="reader-a";
assert.equal((await (await api.GET(request())).json()).progress[0].score,4);
db.close();console.log("Passed: 49 lessons, 179 exercises, route progression, local media, 27 conversation topics, grading, migration, quotas and two independent review histories.");
