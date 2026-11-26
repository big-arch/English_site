import {createRoot} from "react-dom/client";
import Studio from "../app/studio";
import {lessons,tutors,topics} from "../lib/curriculum";
import {conversationTopics} from "../lib/conversations";
import {deviceAPI,deviceModel} from "./device-store";
import "../app/globals.css";
import "../app/learning.css";

createRoot(document.getElementById("root")!).render(
  <Studio lessons={lessons} tutors={tutors} topics={topics} conversationTopics={conversationTopics} device={{api:deviceAPI,model:deviceModel}}/>
);
