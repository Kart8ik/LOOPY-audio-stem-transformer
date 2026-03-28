# CURRENT_IMPLEMENTATION

## 1) Project Snapshot

LOOPY is a monorepo with:
- `frontend`: React + Vite app for upload, region selection, mode selection, and download
- `backend`: FastAPI service for file handling and audio processing pipeline

Current primary flow:
1. Upload file -> `POST /upload`
  or fetch from YouTube -> `POST /from-url`
2. Select segment and mode on Create Loop page
3. Process request -> `POST /process`
4. Download/play resulting mp3

Supported modes in `/process`:
- `loop`
- `vocals`
- `both`

---

## 2) Runtime Flow (Current)

### Frontend Flow

1. User opens `/loop-lab`.
2. User selects file (drag/drop or file picker) or enters a YouTube URL.
3. Frontend sends either `POST /upload` or `POST /from-url`.
4. Backend returns `{ job_id, filename }`.
5. Frontend navigates to `/create-loop` with in-memory state including `job_id` and blob URL.
6. User selects waveform region and mode toggles.
7. Frontend sends:

```json
{
  "job_id": "...",
  "startTime": 0,
  "endTime": 15,
  "loopDuration": 1,
  "mode": "loop|vocals|both"
}
```

8. Backend returns final mp3 as `FileResponse`.
9. Frontend creates blob URL and enables playback/download.

### Backend Flow (`/process`)

For every request:
1. Locate uploaded file by `job_id` in `temp_uploads/`.
2. Slice selected region first using ffmpeg.
3. Branch by `mode`:
- `loop`: slice -> loop
- `vocals`: slice -> demucs vocal removal
- `both`: slice -> demucs -> loop
4. Return resulting audio file.

Backend processing notes:
- Demucs model is loaded once at startup and reused for processing.
- Primary loop generation in `/process` uses ffmpeg `-stream_loop`.
- Parent directories are created automatically before writing output files.

---

## 3) Key Files and Responsibilities

## Root

### `package.json`
- npm workspaces definition for `frontend` and `backend`
- orchestrated run scripts

### `README.md`
- top-level setup/run/API overview

### `CURRENT_IMPLEMENTATION.md`
- this technical status document

### `SYSTEM_FLAWS_AND_INEFFICIENCIES.md`
- known issues and inefficiencies (current state)

## Frontend

### `frontend/src/App.tsx`
- route registration (`/`, `/how-to-use`, `/loop-lab`, `/create-loop`)

### `frontend/src/pages/Loopy.tsx`
- upload screen
- calls `POST /upload`
- navigates to create-loop with uploaded state

### `frontend/src/pages/CreateLoop.tsx`
- waveform region selection and playback preview
- mode toggle logic (`loop`, `vocals`, `both`)
- safety guard: at least one mode must remain enabled
- calls `POST /process` with `mode`
- result playback + download

### `frontend/src/pages/Processing.tsx`
- processing animation screen

### `frontend/src/components/ui/toast.tsx`
### `frontend/src/components/ui/toaster.tsx`
### `frontend/src/hooks/use-toast.ts`
- shadcn-style toast setup used for mode guard feedback

## Backend

### `backend/server.py`
- FastAPI app and route definitions
- `/upload`: receives and stores uploads by `job_id`
- `/from-url`: downloads YouTube audio and stores it by `job_id`
- `/process`: primary processing endpoint with mode support
- auxiliary endpoint:
- `/loop`

### `backend/loopy.py`
- audio processing helpers:
- ffmpeg segment slicing
- demucs vocal separation
- ffmpeg-based looping logic
- mode-aware pipeline function (`process_audio_segment`)

---

## 4) API Contract (Current Primary)

### `POST /upload`

Request:
- `multipart/form-data` with `file` (`mp3`/`wav`)

Response:

```json
{
  "job_id": "uuid",
  "filename": "song.mp3"
}
```

### `POST /from-url`

Request:

```json
{
  "url": "https://youtu.be/<video-id>"
}
```

Response:

```json
{
  "job_id": "uuid",
  "filename": "downloaded-audio.mp3"
}
```

### `POST /process`

Request:

```json
{
  "job_id": "uuid",
  "startTime": 12.5,
  "endTime": 24.0,
  "loopDuration": 2,
  "mode": "both"
}
```

Response:
- `audio/mpeg` stream via `FileResponse`

---

## 5) Operational Notes

- Upload cleanup currently clears old temp/processed directories on new upload.
- Processing is synchronous in request lifecycle.
- Frontend stores upload state in route state and local storage fallback for `/create-loop` continuity.
- Backend write paths auto-create missing parent folders before writing files.

---

## 6) Date of This Snapshot

This document reflects repository behavior as of 2026-03-28.
