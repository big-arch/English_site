import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../app/chatgpt-auth";
export class AppError extends Error { constructor(public status: number, message: string){super(message);} }
export function database() { if(!env.DB) throw new AppError(503,"Хранилище временно недоступно. Попробуй позже."); return env.DB; }
export function groqKey() { return (env as unknown as Record<string,string>).GROQ_API_KEY || process.env.GROQ_API_KEY; }
export async function authorize(request: Request, write=false) {
 const user = await getChatGPTUser();
 if(!user) throw new AppError(401,"Войди в аккаунт, чтобы сохранить свой прогресс.");
 if(write){ const origin=request.headers.get("origin"); if(!origin || origin!==new URL(request.url).origin) throw new AppError(403,"Обнови страницу и повтори запрос."); }
 return user;
}
export async function reserveQuota(userId: string, scope: "practice" | "speech" = "practice") {
 const day=new Date(Date.now()+3*60*60*1000).toISOString().slice(0,10)+(scope==="speech"?"/speech":"");
 const row=await database().prepare("INSERT INTO quotas(user_id,day,count) VALUES(?,?,1) ON CONFLICT(user_id,day) DO UPDATE SET count=count+1 WHERE count<40 RETURNING count").bind(userId,day).first();
 if(!row) throw new AppError(429,"На сегодня лимит ИИ-практики исчерпан. Уроки и тексты остаются доступны.");
}
export function errorResponse(error: unknown) {
 if(error instanceof AppError) return Response.json({error:error.message},{status:error.status});
 console.error("studio_request_failed", error instanceof Error ? error.name : "unknown");
 return Response.json({error:"Не удалось выполнить запрос. Твой ввод сохранён на экране; попробуй ещё раз."},{status:503});
}
export async function groq(path:string, init:RequestInit) {
 const key=groqKey(); if(!key) throw new AppError(503,"ИИ ещё не подключён: владельцу нужно добавить ключ Groq в настройках сервера.");
 let response: Response;
 try { response=await fetch("https://api.groq.com/openai/v1/"+path,{...init,headers:{...init.headers,Authorization:"Bearer "+key},signal:AbortSignal.timeout(45000)}); }
 catch {throw new AppError(503,"ИИ временно не отвечает. Попробуй ещё раз чуть позже.");}
 if(response.status===429) throw new AppError(429,"Бесплатная квота ИИ временно исчерпана. Продолжи урок или попробуй позже.");
 if(!response.ok) throw new AppError(503,"ИИ временно недоступен. Проверь подключение на сервере.");
 return response;
}


