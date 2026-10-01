import { requireChatGPTUser } from "./chatgpt-auth";
import Studio from "./studio";
import { lessons, tutors, topics } from "../lib/curriculum";
import { conversationTopics } from "../lib/conversations";
export const dynamic="force-dynamic";
async function AuthenticatedStudio(){
 await requireChatGPTUser("/");
 const catalog=lessons.map(l=>({...l,exercises:l.exercises.map(e=>({prompt:e.prompt,options:e.options}))}));
 return <Studio lessons={catalog} tutors={tutors.map(({instruction,...t})=>t)} topics={topics} conversationTopics={conversationTopics}/>;
}
export default function Page(){return <AuthenticatedStudio/>;}


