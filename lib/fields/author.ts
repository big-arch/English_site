import { fields } from "../field-guide";
import type { Activity, Exercise, Field, Lesson } from "../lesson-types";

type Unit = Pick<Lesson, "title" | "rule" | "text" | "examples" | "glossary" | "exercises"> & {
  slug: string; level: string; minutes: number; goal: string; transfer: string; exampleReply: string;
};
export function unit(route: Field, data: Unit): Lesson {
  const {slug, goal, transfer, exampleReply, ...lesson} = data;
  return {...lesson, id: "field-" + route + "-" + slug, topic: fields[route].topic,
    subtitle: goal, field: {route, goal, transfer, exampleReply}};
}
export function choice(prompt: string, options: string[], index: number, explanation: string, activity?: Activity): Exercise {
  return {prompt, options, answers: [options[index]], explanation, activity};
}
export function write(prompt: string, answers: string[], explanation: string): Exercise {
  return {prompt, answers, explanation};
}
export function order(prompt: string, tiles: string[], answer: string, explanation: string): Exercise {
  return {prompt, activity: {kind: "order", tiles}, answers: [answer], explanation};
}
export function locate(prompt: string, answer: "deck" | "pier" | "clearance", explanation: string): Exercise {
  return {prompt, activity: {kind: "model"}, answers: [answer], explanation};
}
