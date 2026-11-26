export type ConversationTopic={id:string;tutor:string;title:string;description:string;prompt:string};
function topic(id:string,tutor:string,title:string,description:string,scenario:string,level="A2"):ConversationTopic{
 return {id,tutor,title,description,prompt:"Let's practise this situation at "+level+" level: "+scenario+" Ask me one question at a time in English. Let me answer before giving hints. Give brief corrections in Russian when helpful."};
}
export const conversationTopics:ConversationTopic[]=[
topic("yesterday","emma","Вчерашний день","Past Simple без am и is","Ask about what I did yesterday and help me use Past Simple."),
topic("habits","emma","Обычно и сейчас","Present Simple или Continuous","Ask about my usual workday and what I am doing today."),
topic("plans","emma","Планы на неделю","Going to в живом разговоре","Ask about my plans for next week and help me use going to."),
topic("compare","emma","Какой инструмент удобнее?","Сравнения на рабочих примерах","Ask me to compare two software tools that I use."),
topic("movies","emma","Фильмы и книги","Расскажи о своих интересах","Ask about a film or book I like. Help me explain why and give a recommendation."),
topic("opinions","emma","Удалённая работа","Мнение и вежливое несогласие","Discuss working from home with me. Ask for reasons and practise polite disagreement."),
topic("clash","marcus","Совещание по коллизии","Проблема, решение, следующий шаг","You are a project designer. A pipe clashes with a beam. I am the BIM manager. Discuss possible solutions and agree on the next step."),
topic("coordinates","marcus","Модели не совпадают","Единицы, координаты и начало отсчёта","You are an engineer. The road and bridge models do not line up. I am the BIM manager. Help us clarify the units and project origin."),
topic("deadline","marcus","Перенос срока","Объясни задержку и предложи план","You are my project manager. A source drawing is missing. I need more time to finish the model. Ask me to explain the problem and suggest a realistic next step."),
topic("interview","marcus","Собеседование BIM-менеджера","Опыт, инструменты, вклад в проект","You are interviewing me for a BIM manager role. Ask about my experience, software and one project from my portfolio."),
topic("automation","marcus","Скрипт для рутины","Расскажи, что автоматизировал","You are a colleague. Ask me about a repetitive task I would like to automate, how I would test the script and what result I expect."),
topic("ai","marcus","ИИ в моей работе","Возможности и проверка результата","You are a colleague. Discuss how I use AI at work, what I check in its answers and how I avoid sharing confidential project data."),
topic("airport","ava","В аэропорту","Регистрация, багаж и выход на посадку","You are a check-in agent. I am a passenger with a suitcase and a small bag. Practise check-in questions; keep airline details fictional."),
topic("cafe","ava","Заказ в кафе","Напиток, еда и оплата","You are a café server. I want to order a drink and a sandwich. Ask what I would like and practise polite requests."),
topic("housing","ava","Просмотр квартиры","Аренда, район и дорога на работу","You are showing me an apartment in a fictional Canadian city. I want to ask about rent, transport and the commute. Do not give legal advice or invent real current prices."),
topic("hotel","ava","Заселение в отель","Бронь и просьба о тихом номере","You are a hotel receptionist. I have a reservation for three nights and want a quiet room. Ask one question at a time."),
topic("networking","ava","Знакомство с инженером","Представься и поддержи беседу","You are an engineer I meet at a professional event in Canada. Ask about my job, projects and interests, then practise staying in touch."),
topic("weekend","ava","Разговор с новым коллегой","Выходные и повседневные интересы","You are a new colleague. Have a friendly conversation about our weekend, hobbies and favourite places. Use short questions."),
topic("inspection","emma","Что видно на фотографии?","B1 · наблюдение и догадка","I saw a dark patch on a bridge pier. Ask what I actually observed and what might explain it.","B1"),
topic("alternatives","emma","Если бы условия изменились","B2 · условные предложения","Compare commuting by train and bus. Give me a new constraint and ask how my decision would change.","B2"),
topic("retro","emma","Ретроспектива IT-команды","B2 · нереализованные возможности","We shipped an update late. Ask what happened and what we could have done differently. Help me express a past counterfactual.","B2"),
topic("rev-b","marcus","Передача ревизии B","B1 · сообщение о результате","You found an old printout and a new drawing. Ask me to confirm the current version and when the change was made.","B1"),
topic("release","marcus","Согласование выпуска","B2 · аргументы и ограничения","You want to issue a model externally. Two assumptions remain open. Negotiate what can be shared internally and what sign-off is needed.","B2"),
topic("incident","marcus","Разбор сбоя экспорта","B1 · последовательность событий","You are the IT lead. Yesterday our model export stopped midway. Ask me what I observed, what I tried and what I need from you.","B1"),
topic("central","ava","Пересадка по пути в офис","B1 · запасной маршрут","We're on a delayed tram. Ask how we can still get to the office by nine and which stop we need.","B1"),
topic("remake","ava","Перепутанный заказ","B1 · тактичная просьба","You are a barista. My order is wrong. Let me explain the problem, request a replacement and respond to your offer.","B1"),
topic("neighbourhood","ava","Два района для переезда","B2 · выбор с оговоркой","Compare two fictional neighbourhoods in Canada with me. One is close to work and one has more reliable transit. Ask for my trade-off and what would change my mind.","B2"),
];
