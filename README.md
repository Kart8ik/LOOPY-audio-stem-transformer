# LOOPY - Audio Stem Transformer

LOOPY is a monorepo that turns songs into vocal-removed looping background tracks.

It includes:
- Frontend: React + TypeScript + Vite
- Backend: FastAPI + Demucs + Pydub

## Monorepo Structure

```text
LOOPY-audio-stem-transformer/
├── backend/                     # FastAPI + processing logic
│   ├── server.py                # API routes
│   ├── loopy.py                 # Demucs + loop generation
│   ├── requirements.txt         # Python dependencies
│   └── README.md                # Backend-focused notes
├── frontend/                    # React app
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── package.json                 # Root workspace scripts
├── setup.bat                    # Windows setup helper
├── setup.sh                     # macOS/Linux setup helper
├── CURRENT_IMPLEMENTATION.md    # Detailed file-by-file implementation docs
└── README.md
```

## Prerequisites

- Node.js 18+
- npm
- Python 3.8+
- pip

Recommended:
- ffmpeg installed on your machine (required by pydub at runtime)

## Setup

Choose one method.

### Method 1: Setup Script

Windows:

```powershell
.\setup.bat
```

macOS/Linux:

```bash
chmod +x setup.sh
./setup.sh
```

### Method 2: Manual Setup

From repo root:

```bash
npm install
```

Then for backend:

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

Install backend deps:

```bash
pip install -r requirements.txt
```

## Run

From repo root:

Run both services:

```bash
npm run dev
```

Run individually:

```bash
npm run frontend:dev
npm run backend:dev
```

Endpoints:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Backend docs: http://localhost:3000/docs

## How It Works (High Level)

1. Frontend uploads an audio file to POST /upload-and-process.
2. Backend runs Demucs and exposes instrumental output under /processed.
3. Frontend lets user select a region on waveform.
4. Frontend sends region + desired duration to POST /loop.
5. Backend creates a looped mp3 and returns it for download.

## Useful Scripts

Root scripts (see package.json):
- npm run dev
- npm run build
- npm run frontend:dev
- npm run backend:dev
- npm run backend:start

## Troubleshooting

- If upload endpoint fails with multipart error, install python-multipart in backend venv:

```bash
pip install python-multipart
```

- If backend cannot import packages, ensure backend venv is activated before running backend.
- If ports are busy, run frontend/backend on alternate ports.

## Documentation

- Detailed implementation walkthrough: CURRENT_IMPLEMENTATION.md
- Backend guide: backend/README.md
- **Monorepo setup or general questions**: Refer to this README

Happy coding! 🎵
**Backend only**:
```bash
npm run backend:dev
```
The API will be available at `http://localhost:3000`.

### Building for Production

```bash
npm run build
```

This builds the frontend for production. The backend is deployed separately using Python's standard deployment methods.

---

## 📦 Available Scripts

### Root Commands
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build frontend for production
- `npm run clean` - Remove all node_modules and build artifacts

### Frontend Commands
- `npm run frontend:dev` - Start frontend development server
- `npm run frontend:build` - Build frontend for production
- `npm run frontend:preview` - Preview production build
- `npm run frontend:lint` - Run ESLint

### Backend Commands
- `npm run backend:dev` - Start backend with hot reload (via Uvicorn)
- `npm run backend:start` - Start backend server

---

## 🔌 API Integration

By default, the frontend expects the backend to be available at `http://localhost:3000`. The API handles:
- File uploads (`.mp3`, `.wav`)
- Vocal removal via Demucs
- Loop generation and audio processing
- File downloads

---

## 📚 Workspace Management

This project uses **npm workspaces** for monorepo management. Each workspace (`frontend` and `backend`) maintains its own dependencies and configuration while sharing the root configuration.

To run a command in a specific workspace:
```bash
npm run <command> --workspace=<workspace-name>
# Example: npm run dev --workspace=frontend
```

---

## 📖 Additional Documentation

- See [frontend/README.md](./frontend/README.md) for frontend-specific details
- See [backend/README.md](./backend/README.md) for backend-specific details

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
