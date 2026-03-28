from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
import shutil
import subprocess
from pathlib import Path
import uuid
from loopy import separate_vocals, create_loop, process_audio_segment
from pydantic import BaseModel
from typing import Literal

app = FastAPI()

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
    cmd = [
        "yt-dlp",
        "-x",
        "--audio-format", "mp3",
        "-o", str(output_template),
        url,
    ]

    subprocess.run(cmd, check=True)

    return output_template.parent / f"{output_template.stem}.mp3"

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
        raise HTTPException(status_code=400, detail="Only .mp3 and .wav files are allowed.")

    # Generate a unique job_id
    job_id = str(uuid.uuid4())
    unique_filename = f"{job_id}.{ext}"
    file_path = TEMP_UPLOAD_DIR / unique_filename

    # Save the uploaded file to the temp folder
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Return job_id and filename
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
        raise HTTPException(status_code=404, detail=f"File not found for job_id: {request.job_id}")

    try:
        # Process the audio segment
        output_audio_path = process_audio_segment(
            input_filepath=str(uploaded_file),
            start_time=request.startTime,
            end_time=request.endTime,
            loop_duration_minutes=request.loopDuration,
            job_id=request.job_id,
            mode=request.mode,
        )
        return FileResponse(path=output_audio_path, media_type="audio/mpeg", filename="looped_audio.mp3")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/from-url")
def from_url(request: URLRequest):
    # Keep storage behavior aligned with /upload so /process works unchanged.
    cleanup_directory(TEMP_UPLOAD_DIR)
    cleanup_directory(PROCESSED_DIR)

    job_id = str(uuid.uuid4())
    output_template = TEMP_UPLOAD_DIR / f"{job_id}.%(ext)s"

    try:
        audio_path = download_audio_from_youtube(request.url, output_template)

        if not audio_path.exists():
            raise HTTPException(status_code=500, detail="Audio download failed")

        return {
            "job_id": job_id,
            "filename": audio_path.name,
        }
    except subprocess.CalledProcessError:
        raise HTTPException(status_code=400, detail="Failed to process YouTube URL")
    except Exception as e:
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
        looped_audio_path = create_loop(
            filepath=request.filepath,
            start_time=request.startTime,
            end_time=request.endTime,
            loop_duration_minutes=request.loopDuration
        )
        return FileResponse(path=looped_audio_path, media_type="audio/mpeg", filename="looped_audio.mp3")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))