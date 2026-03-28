import type { ProcessRequest } from "@/types/audio"

const API_BASE = "http://localhost:3000"

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
