import type { Field, Film, LessonCard, Attempt } from "./lesson-types";

type Landmark = { word: string; meaning: string; phrase: string; left: number; top: number };
type FieldGuide = {
  title: string; topic: string; intro: string; alt: string; color: string;
  landmarks: Landmark[];
};
export const fields: Record<Field, FieldGuide> = {
  bridge: {
    title: "На осмотре моста", topic: "BIM и проектирование", intro: "От названия опоры до защиты решения на совещании.",
    alt: "Дорожный настил проходит над водой. Под ним стоят две вертикальные бетонные опоры.", color: "#deddd4",
    landmarks: [
      {word:"deck", meaning:"настил моста", phrase:"Traffic crosses the bridge on the deck.", left:58, top:35},
      {word:"pier", meaning:"промежуточная опора", phrase:"The pier supports the deck.", left:32, top:55},
      {word:"clearance", meaning:"свободное расстояние по высоте", phrase:"A boat needs enough clearance under the deck.", left:60, top:51},
    ],
  },
  handover: {
    title: "Передача проекта", topic: "Рабочие встречи", intro: "От передачи чертежа до письма с условиями согласования.",
    alt: "Два инженера передают из рук в руки сложенный бумажный чертёж. Справа лежит рулон.", color: "#eae0d4",
    landmarks: [
      {word:"drawing", meaning:"чертёж", phrase:"Could you check this drawing?", left:60, top:65},
      {word:"roll", meaning:"рулон", phrase:"The spare plans are still in a roll.", left:81, top:88},
      {word:"hand over", meaning:"передать", phrase:"I'll hand over the drawing after the review.", left:49, top:55},
    ],
  },
  commute: {
    title: "По пути на работу", topic: "Путешествия", intro: "От покупки проездного до выбора маршрута при задержке.",
    alt: "Пассажирка держит синий проездной под навесом остановки. К платформе подходит трамвай.", color: "#dce7e2",
    landmarks: [
      {word:"transit pass", meaning:"проездной", phrase:"Does this transit pass cover the tram?", left:60, top:64},
      {word:"tram", meaning:"трамвай", phrase:"The next tram goes to Central.", left:66, top:47},
      {word:"shelter", meaning:"навес на остановке", phrase:"Let's wait under the shelter.", left:37, top:13},
    ],
  },
  cafe: {
    title: "Разговор в кафе", topic: "Повседневная жизнь", intro: "От заказа кофе до тактичного решения спорной ситуации.",
    alt: "Бариста передаёт бумажный стаканчик с крышкой. Покупатель держит банковскую карту над терминалом.", color: "#eddfd0",
    landmarks: [
      {word:"takeaway cup", meaning:"стаканчик навынос", phrase:"Could I have a takeaway cup?", left:46, top:51},
      {word:"bank card", meaning:"банковская карта", phrase:"I'd like to pay by card.", left:57, top:74},
      {word:"card reader", meaning:"платёжный терминал", phrase:"Tap your card on the card reader.", left:48, top:83},
    ],
  },
};

export const fieldOrder: Field[] = ["bridge","handover","commute","cafe"];
export const films: Record<Film, { title: string; focus: string; lesson: string }> = {
  handover: {title:"Which drawing is current?",focus:"Услышь, какую версию можно передавать дальше.",lesson:"field-handover-revision"},
  commute: {title:"Change at Central",focus:"Найди пересадку и условие, от которого зависит прибытие.",lesson:"field-commute-connection"},
  cafe: {title:"Could you make another one?",focus:"Услышь, что пошло не так и что просит гость.",lesson:"field-cafe-remake"},
};

export function nextInRoute<T extends Pick<LessonCard,"id"|"field"|"topic">>(catalog: T[], progress: Pick<Attempt,"lesson_id">[], current?: T): T | undefined {
  const seen = new Set(progress.map(row => row.lesson_id));
  if (current) seen.add(current.id);
  const available = catalog.filter(item => !seen.has(item.id));
  if (current?.field) {
    const sibling = available.find(item => item.field?.route === current.field?.route);
    if (sibling) return sibling;
  }
  if (current && !current.field) {
    const sibling = available.find(item => item.topic === current.topic);
    if (sibling) return sibling;
  }
  return available.find(item => item.field) ?? available[0];
}

export const imageUrl = (field: Field) => "/media/field/" + field + ".webp";
