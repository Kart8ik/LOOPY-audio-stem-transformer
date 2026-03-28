import subprocess
import os
import logging
from pydub import AudioSegment
from pathlib import Path
import uuid
from demucs.apply import apply_model
from demucs.audio import convert_audio
import torch
import torchaudio

torchaudio.set_audio_backend("soundfile")

logger = logging.getLogger(__name__)

model = None
device = "cuda" if torch.cuda.is_available() else "cpu"
USE_PYTHON_DEMUCS = True


def set_demucs_runtime(loaded_model, runtime_device):
    global model, device
    model = loaded_model
    device = runtime_device
    logger.info("Demucs runtime set", extra={"device": str(device), "sources": getattr(model, "sources", None)})

def slice_audio_with_ffmpeg(input_file: str, start_time: float, end_time: float, output_file: str):
    """
    Slice audio file using ffmpeg from start_time to end_time (in seconds).
    Outputs sliced audio to output_file.
    """
    cmd = [
        "ffmpeg",
        "-i", input_file,
        "-ss", str(start_time),
        "-to", str(end_time),
        "-c", "copy",  # Copy without re-encoding for speed
        "-y",  # Overwrite output file if exists
        output_file
    ]
    Path(output_file).parent.mkdir(parents=True, exist_ok=True)
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        logger.exception("ffmpeg slice failed", extra={"input_file": input_file, "output_file": output_file, "stderr": e.stderr})
        raise

def separate_vocals(input_file, output_dir='separated', model='mdx_extra'):
    assert os.path.exists(input_file), "Input file doesn't exist"
    
    cmd = [
        "demucs",
        "--mp3",
        "--two-stems", "vocals",
        "-n", model,
        input_file,
        "--out", output_dir
    ]
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError:
        logger.exception("Demucs CLI separation failed", extra={"input_file": input_file, "output_dir": output_dir, "model": model})
        raise


def separate_vocals_python(input_path: str, output_path: str):
    if model is None:
        logger.error("Demucs Python model not loaded")
        raise RuntimeError("Demucs model is not loaded")

    try:
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        wav, sr = torchaudio.load(input_path, backend="soundfile")
        wav = convert_audio(wav, sr, model.samplerate, model.audio_channels)
        wav = wav.to(device)

        with torch.no_grad():
            sources = apply_model(model, wav.unsqueeze(0), device=device, progress=False)[0]

        source_map = {name: sources[idx] for idx, name in enumerate(model.sources)}
        if "vocals" not in source_map:
            raise RuntimeError(f"Demucs sources missing vocals stem: {model.sources}")
        instrumental = sum(stem for name, stem in source_map.items() if name != "vocals")

        torchaudio.save(output_path, instrumental.cpu(), model.samplerate, backend="soundfile")
    except Exception:
        logger.exception("Demucs Python separation failed", extra={"input_path": input_path, "output_path": output_path, "device": str(device)})
        raise

# # Usage
# separate_vocals("blue.mp3")

def process_audio_segment(
    input_filepath: str,
    start_time: float,
    end_time: float,
    loop_duration_minutes: int,
    job_id: str,
    mode: str,
):
    """
    Process a specific segment of audio in selected mode:
    1. Slice the segment from start_time to end_time
    2. Optionally run vocal separation (demucs)
    3. Optionally loop the segment
    
    Returns path to final looped audio.
    """
    temp_dir = Path("temp_processing") / job_id
    temp_dir.mkdir(parents=True, exist_ok=True)
    logger.info(
        "Starting audio segment processing",
        extra={
            "job_id": job_id,
            "input_filepath": input_filepath,
            "start_time": start_time,
            "end_time": end_time,
            "loop_duration_minutes": loop_duration_minutes,
            "mode": mode,
            "use_python_demucs": USE_PYTHON_DEMUCS,
        },
    )
    
    # Step 1: Slice the audio
    input_suffix = Path(input_filepath).suffix.lower()
    sliced_extension = input_suffix if input_suffix in [".mp3", ".wav"] else ".mp3"
    sliced_path = temp_dir / f"sliced{sliced_extension}"
    slice_audio_with_ffmpeg(input_filepath, start_time, end_time, str(sliced_path))
    
    current_audio_path = sliced_path

    # Step 2: Optional vocal removal
    if mode in ["vocals", "both"]:
        demucs_output_path = temp_dir / "separated" / "mdx_extra" / current_audio_path.stem / "no_vocals.mp3"

        if USE_PYTHON_DEMUCS:
            python_input_path = current_audio_path
            if current_audio_path.suffix.lower() == ".mp3":
                wav_input_path = temp_dir / "demucs_input.wav"
                AudioSegment.from_file(str(current_audio_path)).export(str(wav_input_path), format="wav")
                python_input_path = wav_input_path

            python_wav_output_path = temp_dir / "no_vocals_python.wav"
            separate_vocals_python(str(python_input_path), str(python_wav_output_path))

            demucs_output_path = temp_dir / "no_vocals.mp3"
            AudioSegment.from_file(str(python_wav_output_path)).export(str(demucs_output_path), format="mp3")
            logger.info("Python Demucs vocal removal complete", extra={"job_id": job_id, "demucs_output_path": str(demucs_output_path)})
        else:
            separate_vocals(str(current_audio_path), output_dir=str(temp_dir / "separated"), model='mdx_extra')
            logger.info("CLI Demucs vocal removal complete", extra={"job_id": job_id, "demucs_output_path": str(demucs_output_path)})

        if not demucs_output_path.exists():
            raise FileNotFoundError(f"Demucs output not found at {demucs_output_path}")

        current_audio_path = demucs_output_path

    # Step 3: Optional looping
    if mode in ["loop", "both"]:
        looped_path = create_loop_ffmpeg(str(current_audio_path), loop_duration_minutes)
        current_audio_path = Path(looped_path)
        logger.info("Loop creation complete", extra={"job_id": job_id, "looped_path": str(current_audio_path)})

    logger.info("Audio processing completed", extra={"job_id": job_id, "output_path": str(current_audio_path)})
    return str(current_audio_path)


def create_loop_ffmpeg(input_file: str, loop_duration_minutes: int) -> str:
    output_dir = Path("separated") / "looped"
    output_dir.mkdir(parents=True, exist_ok=True)

    output_path = output_dir / f"{uuid.uuid4()}.mp3"

    total_duration_seconds = loop_duration_minutes * 60

    cmd = [
        "ffmpeg",
        "-stream_loop", "-1",
        "-i", input_file,
        "-t", str(total_duration_seconds),
        "-c", "copy",
        "-y",
        str(output_path)
    ]

    subprocess.run(cmd, check=True, capture_output=True)

    return str(output_path)
