import type { ProcessRequest } from "@/types/audio"

const API_BASE = "http://localhost:3000"

export async function uploadAudio(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('File upload failed')
  }

  return response.json()
}

export async function fetchAudioFromYoutube(url: string) {
  const response = await fetch(`${API_BASE}/from-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: url.trim() }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch audio from YouTube')
  }

  return response.json()
}

export async function processAudio(payload: ProcessRequest) {
  const response = await fetch(`${API_BASE}/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error("Failed to process audio")
  }

  return response.blob()
}
