import loopy from '@/assets/loopy.png'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, UploadCloud } from 'lucide-react'
import WavesurferPlayer from '@wavesurfer/react'
import { useState, useRef, useLayoutEffect } from 'react'
import { Button } from '@/components/ui/button'
import WaveSurfer from 'wavesurfer.js'

const Home = () => {
  const [song, setSong] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processedSong, setProcessedSong] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const [sectionHeight, setSectionHeight] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (introRef.current) {
        setSectionHeight(introRef.current.offsetHeight)
      }
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

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
    <div className="flex flex-col w-full h-full bg-background text-foreground font-sans px-4 overflow-x-hidden no-scrollbar">
      <div ref={introRef} className="flex flex-row w-full h-full">
        <Card className="flex flex-col bg-secondary text-secondary-foreground rounded-xl w-2/3 h-full flex-wrap p-12">
          <CardContent className='px-2 h-full flex flex-col'>
            <p className="text-8xl font-extrabold">CREATE <br /> YOUR OWN BACKGROUND MUSIC</p>
            <p className="self-end text-lg mt-auto w-2/3 text-right">REMOVE VOCALS FROM YOUR FAVORITE SONGS,<br /> LOOP THEM, AND CREATE MUSIC TO STUDY TO</p>
          </CardContent>
        </Card>
        <div className="flex flex-col w-1/3 h-full">
          <img src={loopy} alt="Loopy" className=" aspect-square ml-4 rounded-xl" />
          <div className="flex flex-row mt-4 ml-4 w-full h-full justify-center items-center gap-4">
          <div className="flex flex-col w-full h-full bg-primary text-primary-foreground rounded-full p-4 justify-center items-center gap-4 w-1/2">
              <p className="text-lg">SCROLL DOWN TO TRY</p>
            </div>
            <div className="flex flex-col bg-secondary h-full mr-4 aspect-square items-center justify-center bg-primary text-primary-foreground rounded-full p-4">
              <ArrowDown className="w-20 h-20" />
            </div>
          </div>
        </div>
      </div>
      {isProcessing && (
        <div
          className="flex flex-col w-full items-center justify-center mt-4"
          style={{ height: sectionHeight ? `${sectionHeight}px` : 'auto' }}
        >
          <p className="text-4xl font-bold animate-pulse text-primary-foreground">Processing your masterpiece...</p>
        </div>
      )}
      {!isProcessing && !processedSong && (
        <Card
          className="flex flex-col bg-secondary text-secondary-foreground rounded-xl w-full h-auto flex-wrap p-12 mt-4"
          style={{ height: sectionHeight ? `${sectionHeight}px` : 'auto' }}
        >
          <CardTitle className="text-secondary-foreground text-4xl font-bold self-center">UPLOAD YOUR SONG</CardTitle>
          <CardContent className="pt-6">
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
              <UploadCloud className="w-12 h-12 mb-4 text-secondary-foreground" />
              <p className="text-secondary-foreground text-lg">Drag & drop your song here, or click to select</p>
              <p className="text-sm text-secondary-foreground mt-1">MP3 or WAV files only</p>
            </div>
            {song && (
              <div className="flex flex-col items-center justify-center gap-4 mt-6">
                <p className="text-secondary-foreground text-lg font-bold">SELECTED : {selectedFile?.name}</p>
                <Button onClick={handleProcessSong} size="lg" className="w-48 self-center text-lg bg-primary text-primary-foreground">
                  PROCESS SONG
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {processedSong && (
        <Card
          className="flex flex-col bg-secondary text-secondary-foreground rounded-xl w-full flex-wrap p-12 mt-4"
          style={{ height: sectionHeight ? `${sectionHeight}px` : 'auto' }}
        >
          <CardTitle>Processed Song</CardTitle>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-4">
              {processedSong && (
                <>
                  <WavesurferPlayer
                    height={100}
                    waveColor="white"
                    progressColor="white"
                    barWidth={2}
                    barGap={1}
                    url={processedSong}
                    onReady={onReady}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  <div className="flex flex-row gap-4 self-center mt-4">
                    <Button onClick={onPlayPause} className="w-32">
                      {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                    <Button onClick={handleDownload} className="w-32">
                      Download
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Home
