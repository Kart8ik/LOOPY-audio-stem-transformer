import subprocess
import os
from pydub import AudioSegment
from pathlib import Path
import uuid

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
    subprocess.run(cmd, check=True, capture_output=True)

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
    subprocess.run(cmd, check=True)

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
    
    # Step 1: Slice the audio
    sliced_path = temp_dir / "sliced.mp3"
    slice_audio_with_ffmpeg(input_filepath, start_time, end_time, str(sliced_path))
    
    current_audio_path = sliced_path

    # Step 2: Optional vocal removal
    if mode in ["vocals", "both"]:
        separate_vocals(str(current_audio_path), output_dir=str(temp_dir / "separated"), model='mdx_extra')
        demucs_output_path = temp_dir / "separated" / "mdx_extra" / current_audio_path.stem / "no_vocals.mp3"

        if not demucs_output_path.exists():
            raise FileNotFoundError(f"Demucs output not found at {demucs_output_path}")

        current_audio_path = demucs_output_path

    # Step 3: Optional looping
    if mode in ["loop", "both"]:
        # Use full segment by passing a large end time relative to expected slice length.
        looped_path = create_loop(str(current_audio_path), 0, 10000, loop_duration_minutes)
        current_audio_path = Path(looped_path)

    return str(current_audio_path)

def create_loop(filepath: str, start_time: float, end_time: float, loop_duration_minutes: int):
    audio = AudioSegment.from_file(filepath)

    start_ms = start_time * 1000
    end_ms = end_time * 1000

    segment = audio[start_ms:end_ms]

    segment_duration_ms = len(segment)
    if segment_duration_ms == 0:
        raise ValueError("Selected segment is empty.")

    required_duration_ms = loop_duration_minutes * 60 * 1000
    
    num_loops = int(required_duration_ms / segment_duration_ms)

    # Create the first loop without fade-in
    looped_audio = segment
    
    # Add subsequent loops with 5ms fade-in for smooth transitions
    fade_duration_ms = 5
    for i in range(1, num_loops):
        # Apply fade-in to the beginning of each subsequent loop
        faded_segment = segment.fade_in(fade_duration_ms)
        looped_audio += faded_segment

    output_dir = Path("separated") / "looped"
    output_dir.mkdir(exist_ok=True)
    
    unique_filename = f"{uuid.uuid4()}.mp3"
    output_path = output_dir / unique_filename
    
    looped_audio.export(output_path, format="mp3")
    
    return str(output_path)