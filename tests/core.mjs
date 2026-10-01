import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { DatabaseSync } from "node:sqlite";

const extended=fs.readFileSync(new URL("../lib/expanded-lessons.ts",import.meta.url),"utf8").replace(/import type[^\n]+\n/,"");
const source=fs.readFileSync(new URL("../lib/curriculum.ts",import.meta.url),"utf8");
const compiled=ts.transpileModule(source.replace('import { expandedLessons } from "./expanded-lessons";',extended),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {lessons,grade}=await import("data:text/javascript;base64,"+Buffer.from(compiled).toString("base64"));
assert.equal(new Set(lessons.map(l=>l.id)).size,lessons.length);
assert.equal(lessons.length,33);
for(const l of lessons){assert.equal(l.exercises.length,3);assert.equal(grade(l,l.exercises.map(e=>e.answers[0])).score,3);for(const e of l.exercises){assert.ok(e.explanation);if(e.options)assert.ok(e.options.includes(e.answers[0]));}}
assert.ok(lessons.filter(l=>l.exercises.some(e=>!e.options)).length>=8);
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
db.close();console.log("Passed: grading variants, incorrect grammar, migration, per-user quota, next-day reset, isolated progress updates.");



