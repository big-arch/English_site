export type Field = "bridge" | "handover" | "commute" | "cafe";
export type Film = Exclude<Field, "bridge">;
export type Activity =
  | { kind: "photo"; field: Field }
  | { kind: "film"; film: Film }
  | { kind: "model" }
  | { kind: "order"; tiles: string[] };

export type Exercise = {
  prompt: string;
  options?: string[];
  answers: string[];
  explanation: string;
  activity?: Activity;
};

export type FieldTask = {
  route: Field;
  goal: string;
  transfer: string;
  exampleReply: string;
};

export type Lesson = {
  id: string; topic: string; title: string; subtitle: string; level: string; minutes: number;
  rule: string; examples: string[]; text: string; glossary: [string, string][];
  exercises: Exercise[];
  field?: FieldTask;
};

export type LessonCard = Omit<Lesson, "exercises"> & {
  exercises: Pick<Exercise, "prompt" | "options" | "activity">[];
};

export type AnswerFeedback = {
  correct: boolean; answer: string; explanation: string; prompt: string; given: string;
};
export type LessonResult = {score: number; total: number; results: AnswerFeedback[]};
export type Attempt = {
  lesson_id: string; score: number; total: number; answers: string; updated_at: string;
  missed?: number[];
};
