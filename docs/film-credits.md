# English Studio lesson films

Three original dialogues written and illustrated for the English Studio curriculum. Each film ends with a listening question. The transit route, project and café order are fictional.

| Asset stem | Film | Duration | Listen for |
| --- | --- | ---: | --- |
| `handover` | The revised drawing | 46.64 s | Past simple for yesterday’s work and present perfect for the file that has just become available |
| `commute` | Changing trams | 41.77 s | The difference between the transfer at Central and the destination at Park Street |
| `cafe` | The coffee order | 37.11 s | A polite request to replace the sweetened coffee |

The moving bridge elevation, transit map and café illustrations were drawn for these lessons with Pillow. The dialogue uses the offline US English Microsoft David and Zira speech voices provided by Windows. FFmpeg encoded the narration and illustrations to HTML5-ready H.264 video and AAC audio at 960 × 540, 15 fps. Each MP4 has its index at the start for progressive playback.

The MP4, English WebVTT captions and WebP poster for each asset stem live in `public/media/films/`. The readable transcripts are in `lib/film-transcripts.ts`. Timed cue boundaries come from the lengths of the narrated WAV takes.

## Course recordings

The static course includes all 49 lesson readings, 121 example sentences, 12 field-guide phrases and three tutor greetings. Two repeated strings share recordings. The 183 MP3 files total 7,031,220 bytes and 19 minutes 14 seconds of audio. Each file uses one channel at 24 kHz and 48 kbit/s.

Microsoft David Desktop reads the lesson passages and Marcus's greeting. Microsoft Zira Desktop reads the examples, field-guide phrases and the greetings from Emma and Ava. Both voices use US English at SAPI rate −1. The recordings were generated locally with Windows PowerShell 5.1, Microsoft Speech API 5.3.24512.00 and FFmpeg 9.0. FFmpeg trims the outer silence and normalizes loudness before MP3 encoding.

To rebuild on a Windows machine with the two desktop voices, install the project dependencies and put `ffmpeg` and `ffprobe` on PATH. Run `node scripts/generate-course-audio.mjs` from the project root. The generator reads the current curriculum and field guide, deduplicates exact text strings, and validates every encoded file with ffprobe. It writes the files to `public/media/speech/` and maps each original string to its filename in `lib/recorded-speech.json`. Browsers can play these recordings directly from static hosting.
