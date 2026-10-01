export function speechText(text: string) {
 return text.replace(/\[([^\]]+)\]\([^)]*\)/g,"$1").replace(/https?:\/\/\S+/g,"").replace(/[*_`#<>]/g,"").split(/\n/).flatMap(line => line.split(/[А-Яа-яЁё]+/)).filter(part => /[A-Za-z]{2}/.test(part)).map(part => part.replace(/^\s*[-:()\d.]+\s*/, "").trim()).filter(Boolean).join(" ").replace(/\s+/g," ").trim();
}
export function speechChunks(text: string, limit=200) {
 const words=speechText(text).split(/\s+/).filter(Boolean), chunks:string[]=[];
 let chunk="";
 for(const word of words){
  if(word.length>limit) throw new Error("Слишком длинное слово для озвучивания.");
  if(chunk && chunk.length+1+word.length>limit){chunks.push(chunk);chunk="";}
  chunk+=(chunk?" ":"")+word;
 }
 if(chunk)chunks.push(chunk);
 return chunks;
}
