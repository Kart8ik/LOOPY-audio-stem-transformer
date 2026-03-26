# Loopy Tune Demucs - Backend

This is the backend for Loopy Tune Demucs, a web application designed to create seamless background music loops. This server, built with Python and FastAPI, handles the core audio processing tasks: it separates vocals from an audio track using the `demucs` library and creates extended loops from user-selected audio segments.

---

## Features

- **FastAPI**: Used a modern, high-performance web framework for building APIs with Python.
- **Vocal Removal**: Utilizes the powerful `demucs` model to split audio tracks into instrumental and vocal stems.
- **Audio Looping**: Uses `pydub` to slice and loop audio segments to a desired length.
- **CORS Enabled**: Configured to allow requests from the frontend application for integration.
- **Static File Serving**: Serves the processed audio files so they can be accessed by the frontend.
- **Asynchronous Operations**: Leverages `async` endpoints in FastAPI for efficient handling of file uploads and processing.

---

## Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Language**: [Python](https://www.python.org/)
- **Vocal Separation**: [Demucs by Meta](https://github.com/facebookresearch/demucs)
- **Audio Manipulation**: [Pydub](https://github.com/jiaaro/pydub)
- **Web Server**: [Uvicorn](https://www.uvicorn.org/)

---

## Getting Started

To get the backend up and running on your local machine, follow these steps.

### Prerequisites

- [Python](https://www.python.org/downloads/) (3.9 or later recommended)
- `pip` (Python package installer)
- `ffmpeg` (Required by `pydub`. Can be installed via `choco install ffmpeg` on Windows or `brew install ffmpeg` on macOS)

### Installation

1.  **Navigate to the backend directory**:
    ```bash
    cd LOOPY-audio-stem-transformer-backend
    ```
2.  **Create and activate a virtual environment** (Recommended):
    - On macOS/Linux:
      ```bash
      python3 -m venv venv
      source venv/bin/activate
      ```
    - On Windows:
      ```bash
      python -m venv venv
      venv\Scripts\Activate.ps1
      ```
3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
> **Note**: The `torch` and `torchaudio` packages are included in `requirements.txt`. For optimal performance (especially with a GPU), you may need to install a specific version of PyTorch that matches your system's CUDA or ROCm drivers. Please refer to the [official PyTorch installation guide](https://pytorch.org/get-started/locally/) for more details.

### Running the Development Server

1.  **Start the server**:
    ```bash
    uvicorn server:app --reload --port 3000 
    ```
2.  The API will now be available at `http://localhost:3000`.

---

## Project Structure

```
lopy_backend_demucs/
├── separated/         # Output directory for processed files (generated automatically)
├── temp_uploads/      # Temporary storage for uploaded files (generated automatically)
├── loopy.py           # Core logic for vocal separation and looping
├── server.py          # FastAPI application, endpoints, and routing
└── requirements.txt   # Project dependencies
```

---

## API Endpoints

- `POST /upload-and-process`: Accepts an audio file (`.mp3` or `.wav`). Separates the vocals and saves the instrumental track. Returns a URL to the processed file.
- `POST /loop`: Accepts a file path and time segment. Creates a new looped audio file and returns it directly in the response.
- `GET /processed/...`: Statically serves files from the `separated` directory. 