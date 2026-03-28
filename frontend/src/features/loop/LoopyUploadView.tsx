import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { UploadCloud } from "lucide-react"
import { useRef } from 'react'

type LoopyUploadViewProps = {
  inputMode: "file" | "youtube"
  isDragging: boolean
  youtubeUrl: string
  setYoutubeUrl: (v: string) => void
  onModeChange: (mode: "file" | "youtube") => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onYoutubeSubmit: () => void
}

const LoopyUploadView = ({
  inputMode,
  isDragging,
  youtubeUrl,
  setYoutubeUrl,
  onFileChange,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onYoutubeSubmit,
}: Omit<LoopyUploadViewProps, 'onSelectFileClick'>) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSelectFileClick = () => {
    inputRef.current?.click()
  }

  return (
    <Card className="flex-1 flex-col bg-secondary text-secondary-foreground rounded-xl w-full h-full items-center justify-center">
      <CardContent className="w-full h-full">
        {inputMode === 'file' && (
          <div
            className={`flex flex-col bg-background text-primary w-full h-full border-2 border-solid rounded-full items-center justify-center text-center cursor-pointer transition-colors ${
              isDragging ? 'border-primary' : 'border-secondary hover:border-secondary'
            }`}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={handleSelectFileClick}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept="audio/mp3, audio/wav"
              onChange={onFileChange}
            />
            <UploadCloud className="w-12 h-8 mb-4 text-secondary" />
            <p className="text-secondary text-lg p-4">Drag & drop your song here, or click to select</p>
            <p className="text-sm text-secondary mt-1">MP3 or WAV files only</p>
          </div>
        )}
        {inputMode === 'youtube' && (
          <div className="flex flex-col bg-background text-primary w-full h-full border-2 border-solid border-secondary rounded-full items-center justify-center text-center px-12 gap-4">
            <Input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Paste YouTube link here..."
              className="w-full max-w-2xl bg-secondary text-secondary-foreground border-primary"
            />
            <Button
              type="button"
              onClick={onYoutubeSubmit}
              className="bg-primary text-primary-foreground rounded-full px-10"
            >
              Fetch Audio
            </Button>
            <p className="text-sm text-secondary mt-1">Paste a YouTube link to extract audio</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default LoopyUploadView
