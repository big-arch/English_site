import { build } from "vite";
import { fileURLToPath } from "node:url";
import { writeFile, readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import {execFileSync} from "node:child_process";
const root=fileURLToPath(new URL("../",import.meta.url));
const out=path.join(root,"outputs","pages");
await build({
  configFile:false,root:path.join(root,"static-app"),base:"./",publicDir:path.join(root,"public"),
  esbuild:{jsx:"automatic"},
  build:{outDir:out,emptyOutDir:true,assetsDir:"assets"},
});
// Cache the application shell and its dependencies on install. Lesson media is cached as it is opened.
const files=await readdir(path.join(out,"assets"));
const assets=files.filter(n=>!n.startsWith("bridge-engine-"));
const fontFiles=await readdir(path.join(out,"fonts","studio"));
const fieldPhotos=await readdir(path.join(out,"media","field"));
const shell=["./","./index.html","./offline.html","./manifest.webmanifest","./favicon.svg","./icon-192.png","./icon-512.png","./media/studio/atlas-cover-small.webp","./media/studio/atlas-cover.webp",
  ...fieldPhotos.filter(n=>n.endsWith(".webp")).map(n=>"./media/field/"+n),
  ...assets.map(n=>"./assets/"+n),...fontFiles.filter(n=>/\.(woff2|css)$/.test(n)).map(n=>"./fonts/studio/"+n)];
const revision=process.env.GITHUB_SHA||execFileSync("git",["rev-parse","HEAD"],{cwd:root,encoding:"utf8"}).trim();
const workerTemplate=await readFile(path.join(root,"static-app","worker.js"),"utf8");
const signature=createHash("sha256").update(workerTemplate).update(await readFile(path.join(out,"index.html"))).update(JSON.stringify(files)).update(revision).digest("hex").slice(0,12);
const worker=workerTemplate.replace('"__VERSION__"',JSON.stringify(signature)).replace('"__SHELL__"',JSON.stringify(shell));
await writeFile(path.join(out,"sw.js"),worker);
await writeFile(path.join(out,".nojekyll"),"");
await writeFile(path.join(out,"site-version.json"),JSON.stringify({commit:revision})+"\n");
