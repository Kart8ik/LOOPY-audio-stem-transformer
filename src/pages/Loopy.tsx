import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { useState, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { UploadCloud } from "lucide-react"
import WavesurferPlayer from '@wavesurfer/react'
import Processing from "./Processing"

const Loopy = () => {
    const [song, setSong] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [processedSong, setProcessedSong] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
  
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        setSong(URL.createObjectURL(file))
        setSelectedFile(file)
        console.log(file)
      }
    }
  
    const handleProcessSong = async () => {
      if (!selectedFile) return
  
      setIsProcessing(true)
      const formData = new FormData()
      formData.append('file', selectedFile)
  
      try {
        const response = await fetch('http://localhost:3000/upload-and-process', {
          method: 'POST',
          body: formData,
        })
  
        if (!response.ok) {
          throw new Error('Song processing failed')
        }
  
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setProcessedSong(url)
      } catch (error) {
        console.error(error)
        // Optionally, show an error message to the user
      } finally {
        setIsProcessing(false)
      }
    }
  
    const handleDownload = () => {
      if (!processedSong) return
      const a = document.createElement('a')
      a.href = processedSong
      a.download = 'no_vocals.mp3'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  
    const onReady = (ws: WaveSurfer) => {
      setWavesurfer(ws)
      setIsPlaying(false)
    }
  
    const onPlayPause = () => {
      wavesurfer && wavesurfer.playPause()
    }
  
    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }
  
    const handleDragIn = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
    }
  
    const handleDragOut = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
    }
  
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        if (file.type === 'audio/mpeg' || file.type === 'audio/wav') {
          setSong(URL.createObjectURL(file))
          setSelectedFile(file)
        }
      }
    }
  
    const handleSelectFileClick = () => {
      inputRef.current?.click()
    }

    
  return (
    <div className="flex flex-col w-full h-full bg-background text-foreground font-sans px-4 pb-4 overflow-x-hidden no-scrollbar">
      {isProcessing && (
        <div className="flex flex-col w-full h-full items-center justify-center">
          <Processing />
        </div>
      )}
      {!isProcessing && !processedSong && (
        <Card
          className="flex flex-col bg-secondary text-secondary-foreground rounded-xl w-full h-full items-center justify-center"
        >
          <CardTitle className="text-secondary-foreground text-4xl font-bold self-center">UPLOAD YOUR SONG</CardTitle>
          <CardContent className="w-full h-full">
            <div
              className={`flex flex-col w-full h-52 border-2 border-solid rounded-xl items-center justify-center text-center cursor-pointer transition-colors ${
                isDragging ? 'border-primary bg-primary/10' : 'border-secondary-foreground hover:border-secondary-foreground'
              }`}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={handleSelectFileClick}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept="audio/mp3, audio/wav"
                onChange={handleFileChange}
              />
              <UploadCloud className="w-12 h-8 mb-4 text-secondary-foreground" />
              <p className="text-secondary-foreground text-lg p-4">Drag & drop your song here, or click to select</p>
              <p className="text-sm text-secondary-foreground mt-1">MP3 or WAV files only</p>
            </div>
            {song && (
                <div className="flex flex-col items-center justify-center w-full">
                  <div className="flex flex-col mt-4 bg-background rounded-xl w-full h-full p-4">
                  <WavesurferPlayer
                    height={100}
                    waveColor='#f85303'
                    progressColor='#fad484'
                    barWidth={2}
                    barGap={1}
                    url={song}
                    onReady={onReady}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  </div>
                  <p className="text-secondary-foreground text-lg font-bold mt-4">SELECTED : {selectedFile?.name}</p>
                  <div className="flex flex-row gap-4 self-center mt-4">
                    <Button onClick={onPlayPause} size="lg" className="w-48 self-center text-lg bg-primary text-primary-foreground">
                      {isPlaying ? 'PAUSE' : 'PLAY'}
                    </Button>
                    <Button onClick={handleProcessSong} size="lg" className="w-48 self-center text-lg bg-primary text-primary-foreground">
                    PROCESS
                    </Button>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      )}
      {processedSong && (
        <Card
          className="flex flex-col bg-secondary text-secondary-foreground rounded-xl w-full h-full items-center justify-center"
        >
          <CardTitle className="text-secondary-foreground text-4xl font-bold self-center">PROCESSED SONG</CardTitle>
          <CardContent className="w-full">
            <div className="flex flex-col w-full items-center justify-center">
              {processedSong && (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <div className="flex flex-col w-full bg-background rounded-xl p-4">
                  <WavesurferPlayer
                    height={100}
                    waveColor='#f85303'
                    progressColor='#fad484'
                    barWidth={2}
                    barGap={1}
                    url={processedSong}
                    onReady={onReady}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}

                  />
                  </div>
                  <div className="flex flex-row gap-4 self-center mt-4">
                    <Button onClick={onPlayPause} size="lg" className="w-48 self-center text-lg bg-primary text-primary-foreground">
                      {isPlaying ? 'PAUSE' : 'PLAY'}
                    </Button>
                    <Button onClick={handleDownload} size="lg" className="w-48 self-center text-lg bg-primary text-primary-foreground">
                      DOWNLOAD
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Loopy
