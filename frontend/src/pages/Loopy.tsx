import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { UploadCloud, Play, Pause } from "lucide-react"
import WavesurferPlayer from '@wavesurfer/react'
import Processing from "./Processing"
import { useNavigate } from 'react-router-dom'
import loopy from "@/assets/loopy.png"

const Loopy = () => {
  const [song, setSong] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null)
  const [youtubeJobId, setYoutubeJobId] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [inputMode, setInputMode] = useState<"file" | "youtube">("file")
    const [youtubeUrl, setYoutubeUrl] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    const navigate = useNavigate()

    const selectAudioFile = (file: File) => {
      setSong(URL.createObjectURL(file))
      setSelectedFile(file)
      setSelectedFilename(file.name)
      setYoutubeJobId(null)
      setErrorMessage(null)
    }

    const handleModeChange = (mode: "file" | "youtube") => {
      setInputMode(mode)
      setErrorMessage(null)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        selectAudioFile(file)
      }
    }
  
    const handleUpload = async () => {
      if (!selectedFile) return
  
      setIsUploading(true)
      setErrorMessage(null)
      const formData = new FormData()
      formData.append('file', selectedFile)
  
      try {
        const response = await fetch('http://localhost:3000/upload', {
          method: 'POST',
          body: formData,
        })
  
        if (!response.ok) {
          throw new Error('File upload failed')
        }
  
        const data = await response.json()
        const { job_id, filename } = data

        // Navigate to create-loop page with state
        navigate('/create-loop', {
          state: {
            job_id: job_id,
            audioBlob: song,
            filename: filename
          }
        })

      } catch (error) {
        console.error(error)
        setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
      } finally {
        setIsUploading(false)
      }
    }

    const onPlayPause = () => {
      if (!wavesurfer) return
      wavesurfer.playPause()
      setIsPlaying(wavesurfer.isPlaying())
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
          selectAudioFile(file)
        }
      }
    }
  
    const handleSelectFileClick = () => {
      inputRef.current?.click()
    }

    const handleYoutubeSubmit = async () => {
      if (!youtubeUrl.trim()) {
        setErrorMessage('Please enter a YouTube link')
        return
      }

      setIsUploading(true)
      setErrorMessage(null)

      try {
        const response = await fetch('http://localhost:3000/from-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: youtubeUrl.trim() }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch audio from YouTube')
        }

        const data = await response.json()
        const { job_id, filename } = data

        setYoutubeJobId(job_id)
        setSelectedFile(null)
        setSelectedFilename(filename)
        setSong(`http://localhost:3000/uploaded/${job_id}`)
      } catch (error) {
        console.error(error)
        setErrorMessage(error instanceof Error ? error.message : 'YouTube fetch failed')
      } finally {
        setIsUploading(false)
      }
    }

    const handleNext = () => {
      if (inputMode === 'youtube') {
        if (!youtubeJobId || !song) return
        navigate('/create-loop', {
          state: {
            job_id: youtubeJobId,
            audioBlob: song,
            filename: selectedFilename ?? 'input.mp3',
          },
        })
        return
      }

      handleUpload()
    }

    const onReady = (ws: WaveSurfer) => {
      setWavesurfer(ws)
      setIsPlaying(false)
    }
    
    return (
      <div className="flex flex-col w-full h-full bg-background text-foreground font-sans px-4 pb-4 overflow-x-hidden no-scrollbar">
        {isUploading && (
          <div className="flex flex-col w-full h-full items-center justify-center">
            <Processing isLooping={false} />
          </div>
        )}
        {!isUploading && (
            <>
            <div className="flex flex-row w-full h-[33vh] items-stretch justify-center gap-4 mb-4">
            <Card className="flex-2 flex-col justify-center bg-secondary text-secondary-foreground rounded-xl w-1/2 p-12">
              <div className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-secondary-foreground text-8xl font-bold ">UPLOAD</CardTitle>
              </div>
              <CardDescription className="text-secondary-foreground text-lg self-end">Add your favourite songs in the loop lab to process them</CardDescription>
            </Card>
              <div className="flex flex-1 flex-col gap-3 h-full">
                <Button
                  type="button"
                  onClick={() => handleModeChange('file')}
                  className={inputMode === 'file' ? 'flex-1 w-full text-4xl font-bold bg-primary text-primary-foreground rounded-full px-12' : 'flex-1 w-full text-4xl font-bold bg-secondary text-primary-foreground rounded-lg px-12'}
                >
                  Upload File
                </Button>
                <Button
                  type="button"
                  onClick={() => handleModeChange('youtube')}
                  className={inputMode === 'youtube' ? 'flex-1 w-full text-4xl font-bold bg-primary text-primary-foreground rounded-full px-12' : 'flex-1 w-full text-4xl font-bold bg-secondary text-primary-foreground rounded-lg px-12'}
                >
                  YouTube Link
                </Button>
              </div>
            <div className="flex-1 w-full rounded-xl overflow-hidden">
              <img src={loopy} alt="loopy" className="h-full w-full  object-cover" />
            </div>
            </div>
            <div className="flex flex-row w-full h-full">
            <Card
              className="flex-1 flex-col bg-secondary text-secondary-foreground rounded-xl w-full h-full items-center justify-center"
            >
              <CardContent className="w-full h-full">
                {inputMode === 'file' && (
                  <div
                    className={`flex flex-col bg-background text-primary w-full h-full border-2 border-solid rounded-full items-center justify-center text-center cursor-pointer transition-colors ${
                      isDragging ? 'border-primary' : 'border-secondary hover:border-secondary'
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
                      onClick={handleYoutubeSubmit}
                      className="bg-primary text-primary-foreground rounded-full px-10"
                    >
                      Fetch Audio
                    </Button>
                    <p className="text-sm text-secondary mt-1">Paste a YouTube link to extract audio</p>
                  </div>
                )}
              </CardContent>
            </Card>
              {song && (
                <div className="flex-2 flex flex-col w-full h-full ml-4">
                <Card className="flex flex-col bg-secondary text-secondary-foreground rounded-xl w-full h-auto items-center justify-center">
              <CardContent className="flex flex-col items-center justify-center w-full">
                      <div className="flex flex-col bg-background rounded-full w-full h-full p-8">
                       <WavesurferPlayer
                         height={50}
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
                      <div className="flex flex-row justify-end w-full">
                      <p className="text-secondary-foreground text-lg px-4 mt-4">{selectedFilename}</p>
                       </div>
                    </CardContent>
                    </Card>
                       <div className="flex flex-row gap-4 items-stretch mt-4 flex-grow">
                           <Button onClick={onPlayPause} size="lg" className="h-full aspect-square bg-primary text-primary-foreground rounded-full">
                             {isPlaying ? <Pause className="size-15" fill="currentColor" /> : <Play className="size-15" fill="currentColor" />}
                           </Button>
                    <Button onClick={handleNext} size="lg" className="h-full flex-grow text-5xl font-bold bg-primary text-primary-foreground rounded-full px-12">
                         NEXT
                         </Button>
                       </div>
                       {errorMessage && (
                         <div className="mt-4 text-red-500 text-center">{errorMessage}</div>
                       )}
                  </div>
               )}
           </div>
            </>
          )}
      </div>
    )
}

export default Loopy
