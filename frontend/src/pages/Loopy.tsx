import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import Processing from "./Processing"
import { useNavigate } from 'react-router-dom'
import loopy from "@/assets/loopy.png"
import { uploadAudio, fetchAudioFromYoutube } from "@/api/audio"
import LoopyUploadView from "@/features/loop/LoopyUploadView"
import LoopyPreviewView from "@/features/loop/LoopyPreviewView"
import { toast } from "@/hooks/use-toast"

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
    if (!selectedFile) {
      const message = "Please select an audio file first"
      setErrorMessage(message)
      toast({
        variant: "destructive",
        title: "Upload error",
        description: message,
      })
      return
    }

    setIsUploading(true)
    setErrorMessage(null)

    try {
      const data = await uploadAudio(selectedFile)
      const { job_id, filename } = data

      navigate('/create-loop', {
        state: {
          job_id: job_id,
          audioBlob: song,
          filename: filename
        }
      })
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Upload failed'
      setErrorMessage(message)
      toast({
        variant: "destructive",
        title: "Upload error",
        description: message,
      })
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
      } else {
        const message = "Only MP3 and WAV files are supported"
        setErrorMessage(message)
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: message,
        })
      }
    }
  }

  const handleYoutubeSubmit = async () => {
    if (!youtubeUrl.trim()) {
      const message = 'Please enter a YouTube link'
      setErrorMessage(message)
      toast({
        variant: "destructive",
        title: "YouTube link required",
        description: message,
      })
      return
    }

    setIsUploading(true)
    setErrorMessage(null)

    try {
      const data = await fetchAudioFromYoutube(youtubeUrl)
      const { job_id, filename } = data

      setYoutubeJobId(job_id)
      setSelectedFile(null)
      setSelectedFilename(filename)
      setSong(`http://localhost:3000/uploaded/${job_id}`)
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'YouTube fetch failed'
      setErrorMessage(message)
      toast({
        variant: "destructive",
        title: "YouTube fetch error",
        description: message,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleNext = () => {
    if (inputMode === 'youtube') {
      if (!youtubeJobId || !song) {
        const message = "Fetch a YouTube audio track before continuing"
        setErrorMessage(message)
        toast({
          variant: "destructive",
          title: "Cannot continue",
          description: message,
        })
        return
      }
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
            <LoopyUploadView
              inputMode={inputMode}
              isDragging={isDragging}
              youtubeUrl={youtubeUrl}
              setYoutubeUrl={setYoutubeUrl}
              onModeChange={handleModeChange}
              onFileChange={handleFileChange}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onYoutubeSubmit={handleYoutubeSubmit}
            />
            {song && (
              <LoopyPreviewView
                song={song}
                selectedFilename={selectedFilename}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                onPlayPause={onPlayPause}
                onNext={handleNext}
                errorMessage={errorMessage}
                onReady={onReady}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Loopy
