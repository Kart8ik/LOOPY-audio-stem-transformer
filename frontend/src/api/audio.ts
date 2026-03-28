import type { ProcessRequest } from "@/types/audio"

const API_BASE = "http://localhost:3000"

async function getResponseErrorMessage(response: Response, fallback: string) {
  try {
    const contentType = response.headers.get("content-type") ?? ""
    if (contentType.includes("application/json")) {
      const data = await response.json()
      if (typeof data?.detail === "string" && data.detail.trim()) {
        return data.detail
      }
      if (typeof data?.message === "string" && data.message.trim()) {
        return data.message
      }
    }

    const text = await response.text()
    if (text.trim()) {
      return text
    }
  } catch {
    return fallback
  }

  return fallback
}

export async function uploadAudio(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response, 'File upload failed'))
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
    throw new Error(await getResponseErrorMessage(response, 'Failed to fetch audio from YouTube'))
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
    throw new Error(await getResponseErrorMessage(response, "Failed to process audio"))
  }

  return response.blob()
}
