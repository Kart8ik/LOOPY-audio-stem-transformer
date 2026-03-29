import { useEffect, useState } from "react"

type ProcessingMode = "download" | "loop" | "vocals" | "both"

const messagesMap: Record<ProcessingMode, string[]> = {
  download: [
    "Fetching audio from YouTube...",
    "Extracting the best audio stream...",
    "Preparing your track...",
    "Almost ready..."
  ],
  loop: [
    "Preparing your audio...",
    "Extracting the selected segment...",
    "Generating your loop...",
    "Almost done..."
  ],
  vocals: [
    "Preparing your audio...",
    "Extracting the selected segment...",
    "Removing vocals (this takes the longest)...",
    "Almost done..."
  ],
  both: [
    "Preparing your audio...",
    "Extracting the selected segment...",
    "Removing vocals (this takes the longest)...",
    "Generating your loop...",
    "Almost done..."
  ]
}

const Processing = ({ mode }: { mode: ProcessingMode }) => {
  const messages = messagesMap[mode]
  const [currentText, setCurrentText] = useState(0)

  useEffect(() => {
    setCurrentText(0)
    const interval = setInterval(() => {
      setCurrentText(prev => (prev + 1) % messages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [messages, mode])

  return (
    <div className="relative flex h-[1300px] w-[1300px] items-center justify-center">
      <div className="spinner-circle-1" />
      <div className="spinner-circle-2" />
      <div className="spinner-circle-3" />
      <div className="spinner-circle-4" />
      <p
        key={currentText}
        className="animate-in fade-in duration-500 absolute max-w-2xl text-center text-4xl font-bold text-secondary"
      >
        {messages[currentText]}
      </p>
    </div>
  )
}

export default Processing
