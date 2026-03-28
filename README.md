# LOOPY - Audio Stem Transformer

LOOPY is a monorepo for audio stem processing and loop generation.

![LOOPY](frontend/public/loopy.png)

Tech stack:
- Frontend: React + TypeScript + Vite
- Backend: FastAPI + Demucs + ffmpeg + torchaudio/pydub

## Current User Flow

1. Add audio from local file (`mp3`/`wav`) or YouTube URL.
2. Frontend calls `POST /upload` or `POST /from-url` and receives a `job_id`.
3. User moves to Create Loop screen and selects a waveform region.
4. User selects processing mode:
- `loop`
- `vocals`
- `both`
5. Frontend calls `POST /process` with:
- `job_id`
- `startTime`
- `endTime`
- `loopDuration`
- `mode`
6. Backend slices selected segment first, then applies mode-based processing, and returns final mp3 as file response.

## Monorepo Structure

```text
LOOPY-audio-stem-transformer/
├── backend/
│   ├── server.py
│   ├── loopy.py
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── package.json
├── setup.bat
├── setup.sh
├── CURRENT_IMPLEMENTATION.md
├── SYSTEM_FLAWS_AND_INEFFICIENCIES.md
└── README.md
```

## Prerequisites

- Node.js 18+
- npm
- Python 3.8+
- pip
- ffmpeg installed and available on PATH

## Setup

### Option 1: Scripts

Windows:

```powershell
.\setup.bat
```

macOS/Linux:

```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual

From repo root:

```bash
npm install
```

Setup backend virtual environment:

```bash
cd backend
python -m venv .venv
```

Activate venv:

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

## Run

From repo root:

```bash
npm run dev
```

Or run services separately:

```bash
npm run frontend:dev
npm run backend:dev
```

Default endpoints:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- OpenAPI docs: http://localhost:3000/docs

## API Summary

### POST /upload

Upload audio file (`mp3`/`wav`) and receive job handle.

Request:
- multipart/form-data
- field: `file`

Response:

```json
{
  "job_id": "uuid",
  "filename": "original-name.mp3"
}
```

### POST /from-url

Fetch audio from YouTube URL and receive job handle.

Request JSON:

```json
{
  "url": "https://youtu.be/<video-id>"
}
```

Response:

```json
{
  "job_id": "uuid",
  "filename": "<downloaded-file>.mp3"
}
```

### POST /process

Process selected region in mode.

Request JSON:

```json
{
  "job_id": "uuid",
  "startTime": 12.4,
  "endTime": 26.7,
  "loopDuration": 2,
  "mode": "loop"
}
```

`mode` values:
- `loop`: slice -> loop
- `vocals`: slice -> vocal removal
- `both`: slice -> vocal removal -> loop

Response:
- `audio/mpeg` file stream

### Additional Endpoint

- `POST /loop` (standalone loop generation)

## Useful Scripts

Root scripts:
- `npm run dev`
- `npm run build`
- `npm run frontend:dev`
- `npm run backend:dev`
- `npm run backend:start`

## Troubleshooting

- If upload fails with multipart errors:

```bash
pip install python-multipart
```

- If backend cannot find ffmpeg, install ffmpeg and ensure PATH is set.
- If ports are busy, change frontend/backend ports and CORS list accordingly.
- For restricted YouTube videos, configure one of:
  - `YTDLP_COOKIES_FILE=<absolute-path-to-cookies.txt>`
  - `YTDLP_COOKIES_FROM_BROWSER=chrome|edge|firefox`

## Processing Notes

- Demucs model is loaded once at backend startup and reused.
- Looping in the primary pipeline is ffmpeg-based (`-stream_loop`) for faster output generation.
- Backend write paths create missing parent directories automatically before writing output files.

## Documentation

- Current implementation details: `CURRENT_IMPLEMENTATION.md`
- Known flaws and inefficiencies: `SYSTEM_FLAWS_AND_INEFFICIENCIES.md`
- Backend notes: `backend/README.md`
