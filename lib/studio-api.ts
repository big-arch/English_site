import type { StudioAPI, Snapshot, Action } from "./studio-model";
export const serverAPI:StudioAPI=async <T=Snapshot>(body?:Action,tutor?:string)=>{
  const response=await fetch("/api/studio"+(tutor?"?tutor="+encodeURIComponent(tutor):""),body?
    {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}:{cache:"no-store"});
  if(!response.ok){const failure=await response.json().catch(()=>null) as {error?:string}|null;throw new Error(failure?.error||"Не удалось связаться со студией. Повтори попытку.");}
  return response.json() as Promise<T>;
};
