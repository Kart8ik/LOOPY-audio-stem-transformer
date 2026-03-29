# LOOPY - Audio Stem Transformer

LOOPY is an audio loop generator with optional vocal removal. It supports local file uploads and YouTube links, perfect for creating study background music (that's what I use it for).

![LOOPY](frontend/public/loopy.png)

## 1. Project Overview

LOOPY helps you create loop-ready audio clips quickly. You can upload audio or fetch it from YouTube, select a region on the waveform, and process it for looping, vocal removal, or both.

## 2. Features

- Upload audio file or use YouTube link
- Select loop region using waveform editor
- Vocal removal with Demucs
- Fast loop generation with ffmpeg

## 3. Prerequisites

- Python 3.10+ (3.11 recommended)
- Node.js v18+
- ffmpeg installed and available in PATH


```text
LOOPY-audio-stem-transformer/
├── backend/
│   ├── .venv/                    # Python virtual environment (generated)
│   ├── loopy.py                  # Core audio processing helpers
│   ├── server.py                 # FastAPI app and API routes
│   ├── requirements.txt          # Backend Python dependencies
│   ├── package.json              # Backend run scripts
│   ├── temp_uploads/             # Uploaded source files (generated at runtime)
│   ├── temp_processing/          # Intermediate processing artifacts (generated)
│   └── separated/                # Stem separation outputs (generated)
├── frontend/
│   ├── public/
│   │   └── loopy.png             # README/app branding image
│   ├── src/
│   │   ├── api/
│   │   │   └── audio.ts          # Frontend API calls to backend
│   │   ├── components/
│   │   │   ├── navbar.tsx
│   │   │   └── ui/               # Reusable UI primitives
│   │   ├── features/
│   │   │   └── loop/             # Upload, preview, editor, and loop controls
│   │   ├── hooks/
│   │   │   └── use-toast.ts
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Loopy.tsx
│   │   │   ├── CreateLoop.tsx
│   │   │   ├── Processing.tsx
│   │   │   └── HowToUse.tsx
│   │   ├── types/                # Shared frontend TypeScript types
│   │   ├── App.tsx               # App routes and shell
│   │   ├── main.tsx              # React entry point
│   │   └── index.css             # Global styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── CURRENT_IMPLEMENTATION.md     # Technical implementation notes
├── package.json                  # Monorepo scripts (frontend + backend)
├── package-lock.json
├── setup.sh                      # macOS/Linux setup script
├── setup.bat                     # Windows setup script
└── README.md
```


## 4. Setup Steps

### Step 1 - Verify prerequisites

```bash
python --version
node -v
ffmpeg -version
```

### Step 2 - Run setup script

Mac/Linux:

```bash
./setup.sh
```

Windows:

```bat
./setup.bat
```

### Step 3 - Install PyTorch (inside venv)

```bash
cd backend
source .venv/bin/activate   # Mac/Linux
.venv\Scripts\activate      # Windows
```
either CPU or GPU from below depending on your system availabilities:

CPU:

```bash
uv pip install torch torchaudio
```
(or)

GPU (example CUDA 12.1):

```bash
uv pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121
```

Verify:

```bash
python -c "import torch; print('CUDA available:', torch.cuda.is_available())"
```
> If it says `False` when you installed the GPU version, it might be because you have the CPU version installed already. Run these below commands and retry the verification. If the issue still persists, it's probably an issue with your GPU drivers (check them out).



```bash
uv pip uninstall torch torchaudio 

uv pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### Step 4 - Run app in the root folder

```bash
cd ..
npm run dev
```

## 5. Usage

1. Upload audio file or paste YouTube link
2. Select the audio region on waveform
3. Choose mode: loop, vocals, or both
4. Process and download result

## 6. Notes

- First run may be slower because model loading takes time
- GPU acceleration significantly improves performance (whole process finishes in 30s to a minute)
- ffmpeg is required for audio processing
