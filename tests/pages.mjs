import assert from "node:assert/strict";
import {access,readFile} from "node:fs/promises";

const out=new URL("../outputs/pages/",import.meta.url);
const read=name=>readFile(new URL(name,out),"utf8");
const html=await read("index.html");
for(const [,href] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  assert.ok(href.startsWith("./"),"Expected a subpath-relative asset: "+href);
  await access(new URL(href,out));
}
const manifest=JSON.parse(await read("manifest.webmanifest"));
assert.equal(manifest.start_url,"./");
for(const icon of manifest.icons)await access(new URL(icon.src,out));
const worker=await read("sw.js");
const entries=JSON.parse(worker.match(/const shell=(\[[^;]+\]);/)[1]);
for(const path of entries){
  assert.ok(path.startsWith("./"));
  await access(new URL(path,out));
}
assert.ok(entries.includes("./index.html")&&entries.includes("./media/studio/atlas-cover.webp"));
assert.match(JSON.parse(await read("site-version.json")).commit,/^[a-f0-9]{40}$/);
console.log("Project-relative HTML, manifest, version stamp and "+entries.length+" offline assets checked.");
