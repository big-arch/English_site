import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(outputText, filename);
};
const { lessons, tutors } = require('../lib/curriculum.ts');
const { fields } = require('../lib/field-guide.ts');

const recordings = new Map();
function enqueue(text, voice) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Missing English text');
  if (recordings.has(text)) return;
  const stem = createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 24);
  // SAPI reads technical initials and BIM more naturally with these spellings.
  const spoken = text.replace(/\b(DWG|PDF|IFC|AI)\b/g, word => word.split('').join(' '))
    .replace(/\bBIM\b/g, 'bim').replace(/\bNanoCAD\b/g, 'nano cad');
  recordings.set(text, { stem, spoken, voice });
}
for (const lesson of lessons) {
  enqueue(lesson.text, 'David');
  for (const example of lesson.examples) enqueue(example, 'Zira');
}
for (const field of Object.values(fields)) {
  for (const landmark of field.landmarks) enqueue(landmark.phrase, 'Zira');
}
for (const tutor of tutors) enqueue(tutor.opening, tutor.id === 'marcus' ? 'David' : 'Zira');

const runtime = path.join(root, '.sites-runtime');
fs.mkdirSync(runtime, { recursive: true });
const staging = fs.mkdtempSync(path.join(runtime, 'course-audio-'));
const jobs = [...recordings.values()];
const jobsPath = path.join(staging, 'jobs.json');
fs.writeFileSync(jobsPath, JSON.stringify(jobs));

const run = (name, args) => execFileSync(name, args, { encoding: 'utf8', windowsHide: true });
const filters = [
  'silenceremove=start_periods=1:start_duration=0.002:start_threshold=-60dB:start_silence=0.025',
  'areverse',
  'silenceremove=start_periods=1:start_duration=0.002:start_threshold=-60dB:start_silence=0.09',
  'areverse',
  'loudnorm=I=-18:TP=-1.5:LRA=7',
].join(',');

run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'RemoteSigned', '-File',
  path.join(root, 'scripts', 'generate-course-audio.ps1'), '-JobsPath', jobsPath]);
let seconds = 0;
let bytes = 0;
for (const { stem } of jobs) {
  const wav = path.join(staging, stem + '.wav');
  const mp3 = path.join(staging, stem + '.mp3');
  run('ffmpeg', ['-nostdin', '-v', 'error', '-i', wav, '-map_metadata', '-1', '-af', filters,
    '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', mp3]);
  const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-select_streams', 'a:0',
    '-show_entries', 'stream=codec_name,sample_rate,channels:format=duration', '-of', 'json', mp3]));
  const { codec_name, sample_rate, channels } = probe.streams[0];
  const duration = Number(probe.format.duration);
  if (codec_name !== 'mp3' || sample_rate !== '24000' || channels !== 1 || !(duration > 0.35)) {
    throw new Error('Unexpected audio encoding or duration: ' + mp3);
  }
  seconds += duration;
  bytes += fs.statSync(mp3).size;
}

const output = path.join(root, 'public', 'media', 'speech');
fs.mkdirSync(output, { recursive: true });
const index = {};
for (const [text, { stem }] of recordings) {
  const filename = stem + '.mp3';
  fs.copyFileSync(path.join(staging, filename), path.join(output, filename));
  index[text] = filename;
}
fs.writeFileSync(path.join(root, 'lib', 'recorded-speech.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`Validated ${jobs.length} recordings: ${seconds.toFixed(2)} s, ${bytes} bytes.`);
// Only remove the unique work directory made by this invocation.
if (path.dirname(staging) === runtime && path.basename(staging).startsWith('course-audio-')) {
  fs.rmSync(staging, { recursive: true });
}
