#!/bin/bash

echo "LOOPY Audio Stem Transformer - Quick Start"
echo "=============================================="
echo ""

echo "Installing frontend dependencies..."
npm install

echo ""
echo "Setting up backend..."

cd backend

# Check uv
if ! command -v uv &> /dev/null
then
    echo "Installing uv..."
    pip install uv
fi

# Create venv if not exists
if [ -d ".venv" ]; then
  echo "Virtual environment already exists"
else
  echo "Creating virtual environment..."
  uv venv
fi

echo "Activating virtual environment..."
source .venv/bin/activate

echo "Installing Python dependencies with uv..."
uv pip install -r requirements.txt

cd ..

echo ""
echo "⚠️  Make sure ffmpeg is installed and in PATH"
echo "⚠️  Make sure yt-dlp is installed (pip install yt-dlp)"
echo ""

echo "✅ Installation complete!"
echo ""
echo "Run the app:"
echo "  npm run dev"
echo ""