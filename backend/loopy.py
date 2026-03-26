import subprocess
import os
from pydub import AudioSegment
from pathlib import Path
import uuid

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