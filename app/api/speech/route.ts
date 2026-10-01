import { z } from "zod";
import { authorize, errorResponse, AppError, groqKey, reserveQuota, groq } from "../../../lib/server";
const inputSchema=z.object({text:z.string().trim().min(1).max(200)});
export async function POST(request:Request) {
 try {
  const user=await authorize(request,true);
  if(Number(request.headers.get("content-length")||0)>3000)throw new AppError(413,"Слишком длинный текст.");
  const raw=await request.text(); if(raw.length>3000)throw new AppError(413,"Слишком длинный текст.");
  let body:unknown;try{body=JSON.parse(raw);}catch{throw new AppError(400,"Некорректный запрос.");}
  const parsed=inputSchema.safeParse(body);
  if(!parsed.success || !/[A-Za-z]/.test(parsed.data.text) || /[А-Яа-яЁё]/.test(parsed.data.text))throw new AppError(400,"Озвучивание доступно для английских фраз до 200 символов.");
  if(!groqKey())throw new AppError(503,"Озвучивание ещё не подключено на сервере.");
  await reserveQuota(user.userId,"speech");
  const audio=await groq("audio/speech",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"canopylabs/orpheus-v1-english",voice:"hannah",input:parsed.data.text,response_format:"wav"})});
  const data=await audio.arrayBuffer();
  if(data.byteLength<44)throw new AppError(503,"Не удалось получить аудио. Попробуй ещё раз.");
  return new Response(data,{headers:{"Content-Type":"audio/wav","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch(error){return errorResponse(error);}
}
