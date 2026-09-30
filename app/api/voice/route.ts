import { authorize, errorResponse, AppError, groqKey, reserveQuota, groq } from "../../../lib/server";
export async function POST(request:Request) {
 try {
 const user=await authorize(request,true);
 if(!groqKey()) throw new AppError(503,"Для распознавания речи нужен ключ Groq на сервере.");
 if(Number(request.headers.get("content-length")||0)>8_500_000) throw new AppError(413,"Запись слишком большая. Запиши короткий ответ.");
 const form=await request.formData();const file=form.get("audio");
 if(!(file instanceof File) || file.size>8_000_000 || file.size===0 || !["audio/webm","audio/mp4","audio/ogg","audio/wav","audio/mpeg"].includes(file.type.split(";")[0])) throw new AppError(400,"Нужна короткая аудиозапись поддерживаемого формата.");
 await reserveQuota(user.userId);
 const upstream=new FormData(); upstream.set("file",file);upstream.set("model","whisper-large-v3-turbo");upstream.set("language","en");upstream.set("response_format","json");
 const response=await groq("audio/transcriptions",{method:"POST",body:upstream});
 const data=await response.json() as {text?:string};
 if(!data.text?.trim()) throw new AppError(400,"Не удалось распознать речь. Попробуй записать ещё раз.");
 return Response.json({text:data.text});
 } catch(e){return errorResponse(e);}
}

