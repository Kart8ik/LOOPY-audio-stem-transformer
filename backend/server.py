from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
import shutil
import subprocess
import logging
import os
from pathlib import Path
import uuid
from loopy import separate_vocals, create_loop, process_audio_segment, set_demucs_runtime
from pydantic import BaseModel
from typing import Literal
from demucs.pretrained import get_model
import torch
from contextlib import asynccontextmanager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

model = None
device = "cuda" if torch.cuda.is_available() else "cpu"


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    logger.info("Loading Demucs model at startup", extra={"model": "htdemucs", "device": device})
    try:
        model = get_model("htdemucs")
        model.to(device)
        model.eval()
        set_demucs_runtime(model, device)
        logger.info("Demucs model loaded", extra={"model": "htdemucs", "device": device})
    except Exception:
        logger.exception("Failed to load Demucs model")
        raise
    yield


app = FastAPI(lifespan=lifespan)

# CORS middleware for frontend access
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# function to clean directories
def cleanup_directory(directory: Path):
    if directory.exists():
        for item in directory.iterdir():
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()

# Create a temp upload folder in your project directory
TEMP_UPLOAD_DIR = Path("temp_uploads")
TEMP_UPLOAD_DIR.mkdir(exist_ok=True)
PROCESSED_DIR = Path("separated")
PROCESSED_DIR.mkdir(exist_ok=True)

app.mount("/processed", StaticFiles(directory=PROCESSED_DIR), name="processed")

ALLOWED_EXTENSIONS = {"mp3", "wav"}

class LoopRequest(BaseModel):
    filepath: str
    startTime: float
    endTime: float
    loopDuration: int

class ProcessRequest(BaseModel):
    job_id: str
    startTime: float
    endTime: float
    loopDuration: int
    mode: Literal["loop", "vocals", "both"]

class URLRequest(BaseModel):
    url: str

def download_audio_from_youtube(url: str, output_template: Path) -> Path:
    base_cmd = [
        "yt-dlp",
        "-x",
        "--audio-format", "mp3",
        "--no-playlist",
        "--retries", "5",
        "--fragment-retries", "5",
        "--extractor-retries", "3",
        "--socket-timeout", "30",
        "-o", str(output_template),
        url,
    ]

    commands_to_try = [base_cmd]

    cookies_file = os.getenv("YTDLP_COOKIES_FILE", "").strip()
    cookies_from_browser = os.getenv("YTDLP_COOKIES_FROM_BROWSER", "").strip()

    if cookies_file:
        commands_to_try.append(base_cmd[:-1] + ["--cookies", cookies_file, url])
    if cookies_from_browser:
        commands_to_try.append(base_cmd[:-1] + ["--cookies-from-browser", cookies_from_browser, url])

    last_error = None
    for idx, cmd in enumerate(commands_to_try, start=1):
        try:
            logger.info("Running yt-dlp attempt", extra={"attempt": idx, "url": url})
            subprocess.run(cmd, check=True, capture_output=True, text=True)
            return output_template.parent / f"{output_template.stem}.mp3"
        except subprocess.CalledProcessError as e:
            last_error = e
            logger.error(
                "yt-dlp attempt failed",
                extra={
                    "attempt": idx,
                    "url": url,
                    "returncode": e.returncode,
                    "stderr": (e.stderr or "")[-2000:],
                },
            )

    assert last_error is not None
    raise last_error

@app.get("/trial")
def trial():
    return {"message": "Welcome to the loopy backend"}

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    """
    Upload audio file and save it for later processing.
    Returns job_id that will be used to identify this file during processing.
    """
    # Clean up old files from previous sessions
    cleanup_directory(TEMP_UPLOAD_DIR)
    cleanup_directory(PROCESSED_DIR)
    
    # Validate file extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        logger.warning("Rejected upload with invalid extension", extra={"uploaded_filename": file.filename, "extension": ext})
        raise HTTPException(status_code=400, detail="Only .mp3 and .wav files are allowed.")

    # Generate a unique job_id
    job_id = str(uuid.uuid4())
    unique_filename = f"{job_id}.{ext}"
    file_path = TEMP_UPLOAD_DIR / unique_filename
    file_path.parent.mkdir(parents=True, exist_ok=True)

    # Save the uploaded file to the temp folder
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Return job_id and filename
    logger.info("Upload successful", extra={"job_id": job_id, "uploaded_filename": file.filename, "stored_path": str(file_path)})
    return {
        "job_id": job_id,
        "filename": file.filename
    }

@app.post("/process")
async def process_audio(request: ProcessRequest):
    """
    Process uploaded audio:
    1. Locate the file using job_id
    2. Slice the selected segment
    3. Apply mode-based processing
    4. Return the final audio file
    """
    # Locate the uploaded file
    uploaded_file = None
    for ext in ALLOWED_EXTENSIONS:
        potential_path = TEMP_UPLOAD_DIR / f"{request.job_id}.{ext}"
        if potential_path.exists():
            uploaded_file = potential_path
            break
    
    if not uploaded_file:
        logger.warning("Process requested for missing file", extra={"job_id": request.job_id, "mode": request.mode})
        raise HTTPException(status_code=404, detail=f"File not found for job_id: {request.job_id}")

    try:
        logger.info(
            "Processing request received",
            extra={
                "job_id": request.job_id,
                "mode": request.mode,
                "start_time": request.startTime,
                "end_time": request.endTime,
                "loop_duration": request.loopDuration,
                "uploaded_file": str(uploaded_file),
            },
        )
        # Process the audio segment
        output_audio_path = process_audio_segment(
            input_filepath=str(uploaded_file),
            start_time=request.startTime,
            end_time=request.endTime,
            loop_duration_minutes=request.loopDuration,
            job_id=request.job_id,
            mode=request.mode,
        )
        logger.info("Processing completed", extra={"job_id": request.job_id, "output_audio_path": output_audio_path})
        return FileResponse(path=output_audio_path, media_type="audio/mpeg", filename="looped_audio.mp3")
    except Exception as e:
        logger.exception("Processing failed", extra={"job_id": request.job_id, "mode": request.mode})
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/from-url")
def from_url(request: URLRequest):
    # Keep storage behavior aligned with /upload so /process works unchanged.
    cleanup_directory(TEMP_UPLOAD_DIR)
    cleanup_directory(PROCESSED_DIR)

    job_id = str(uuid.uuid4())
    output_template = TEMP_UPLOAD_DIR / f"{job_id}.%(ext)s"
    output_template.parent.mkdir(parents=True, exist_ok=True)

    try:
        logger.info("YouTube processing request received", extra={"url": request.url})
        audio_path = download_audio_from_youtube(request.url, output_template)

        if not audio_path.exists():
            raise HTTPException(status_code=500, detail="Audio download failed")

        return {
            "job_id": job_id,
            "filename": audio_path.name,
        }
    except subprocess.CalledProcessError:
        logger.exception("YouTube download failed", extra={"url": request.url})
        raise HTTPException(
            status_code=400,
            detail="Failed to process YouTube URL. If this video requires authentication, set YTDLP_COOKIES_FILE or YTDLP_COOKIES_FROM_BROWSER.",
        )
    except Exception as e:
        logger.exception("Unexpected /from-url failure", extra={"url": request.url})
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/uploaded/{job_id}")
def get_uploaded_audio(job_id: str):
    for ext in ALLOWED_EXTENSIONS:
        potential_path = TEMP_UPLOAD_DIR / f"{job_id}.{ext}"
        if potential_path.exists():
            media_type = "audio/mpeg" if ext == "mp3" else "audio/wav"
            return FileResponse(path=potential_path, media_type=media_type, filename=potential_path.name)

    raise HTTPException(status_code=404, detail=f"File not found for job_id: {job_id}")

@app.post("/loop")
async def loop_audio(request: LoopRequest):
    try:
        logger.info(
            "Loop request received",
            extra={
                "filepath": request.filepath,
                "start_time": request.startTime,
                "end_time": request.endTime,
                "loop_duration": request.loopDuration,
            },
        )
        looped_audio_path = create_loop(
            filepath=request.filepath,
            start_time=request.startTime,
            end_time=request.endTime,
            loop_duration_minutes=request.loopDuration
        )
        logger.info("Loop request completed", extra={"looped_audio_path": looped_audio_path})
        return FileResponse(path=looped_audio_path, media_type="audio/mpeg", filename="looped_audio.mp3")
    except Exception as e:
        logger.exception("Loop request failed", extra={"filepath": request.filepath})
        raise HTTPException(status_code=500, detail=str(e))