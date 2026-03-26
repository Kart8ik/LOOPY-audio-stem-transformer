from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
import shutil
from pathlib import Path
import uuid
from loopy import separate_vocals, create_loop
from pydantic import BaseModel

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

@app.get("/trial")
def trial():
    return {"message": "Welcome to the loopy backend"}

@app.post("/upload-and-process")
async def upload_audio(file: UploadFile = File(...)):
    # Clean up old files from previous sessions
    cleanup_directory(TEMP_UPLOAD_DIR)
    cleanup_directory(PROCESSED_DIR)
    
    # Validate file extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only .mp3 and .wav files are allowed.")

    # Generate a unique filename to avoid conflicts
    unique_filename = f"{uuid.uuid4()}.{ext}"
    file_path = TEMP_UPLOAD_DIR / unique_filename

    # Save the uploaded file to the custom temp folder
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Process the file
    separate_vocals(file_path)

    # Correctly determine the output path
    unique_filename_stem = Path(unique_filename).stem
    processed_audio_path = PROCESSED_DIR / f"mdx_extra/{unique_filename_stem}/no_vocals.mp3"

    if not processed_audio_path.exists():
        raise HTTPException(status_code=500, detail="Error processing file. Output not found.")

    # Return the processed audio file path
    return {"processed_url": f"/processed/mdx_extra/{unique_filename_stem}/no_vocals.mp3",
            "processed_filepath": str(processed_audio_path)}

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