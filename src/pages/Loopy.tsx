import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { useState, useRef, useEffect } from 'react'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin, { type Region } from 'wavesurfer.js/dist/plugins/regions.js'
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js'
import { UploadCloud, Play, Pause } from "lucide-react"
import WavesurferPlayer from '@wavesurfer/react'
import Processing from "./Processing"
import { Input } from "@/components/ui/input"
import loopy from "@/assets/loopy.png"

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const Loopy = () => {
    const [song, setSong] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [processedSong, setProcessedSong] = useState<string | null>(null)
    const [processedFilepath, setProcessedFilepath] = useState<string|null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const timelineRef = useRef<HTMLDivElement>(null);

    const [loopDuration, setLoopDuration] = useState<number>(30)
    const [loopedSong, setLoopedSong] = useState<string | null>(null)
    const [isLooping, setIsLooping] = useState(false)
    const regionsRef = useRef<RegionsPlugin|null>(null)
    const [activeRegion, setActiveRegion] = useState<Region|null>(null)
    const [currentTime, setCurrentTime] = useState(0)
    const [regionInfo, setRegionInfo] = useState<{ start: string; end: string } | null>(null)

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
  
        const data = await response.json()
        setProcessedSong('http://localhost:3000' + data.processed_url)
        setProcessedFilepath(data.processed_filepath)

      } catch (error) {
        console.error(error)
        // Optionally, show an error message to the user
      } finally {
        setIsProcessing(false)
      }
    }

    const handleLoopSong = async () => {
        if (!processedFilepath || !activeRegion) return
        
        setIsLooping(true)

        try {
            const response = await fetch('http://localhost:3000/loop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filepath: processedFilepath,
                    startTime: activeRegion.start,
                    endTime: activeRegion.end,
                    loopDuration: loopDuration,
                }),
            })

            if (!response.ok) {
                throw new Error('Song looping failed')
            }

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            setLoopedSong(url)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLooping(false)
        }
    }

    const handleLoopedDownload = () => {
        if (!loopedSong) return
        const a = document.createElement('a')
        a.href = loopedSong
        a.download = 'looped_song.mp3'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    const onReady = (ws: WaveSurfer) => {
        setWavesurfer(ws)
        setIsPlaying(false)

        ws.on('audioprocess', (time) => {
            setCurrentTime(time)
        })

        ws.on('seeking', (time) => {
            setCurrentTime(time)
        })

        if (processedSong && !loopedSong) {
            if (timelineRef.current) {
                ws.registerPlugin(
                    TimelinePlugin.create({
                        container: timelineRef.current,
                        primaryColor: '#f85303',
                        secondaryColor: '#fad484',
                        primaryFontColor: '#f85303',
                        secondaryFontColor: '#fad484',
                    } as any)
                )
            }

            regionsRef.current = ws.registerPlugin(RegionsPlugin.create())
            
            regionsRef.current.on('region-out', (region) => {
                if ((region as any).loop) {
                    ws.play(region.start)
                }
            })

            regionsRef.current.on('region-created', (region) => {
                // Keep only one region
                const regions = regionsRef.current?.getRegions()
                if (regions) {
                    regions.forEach(r => {
                        if (r.id !== region.id) {
                            r.remove()
                        }
                    })
                }
                (region as any).loop = true
                setActiveRegion(region)
                setRegionInfo({ start: formatTime(region.start), end: formatTime(region.end) })
            })

            regionsRef.current.on('region-updated', (region) => {
                setActiveRegion(region)
                setRegionInfo({ start: formatTime(region.start), end: formatTime(region.end) })
            })

            // Add a default region
            const defaultRegion = regionsRef.current.addRegion({
                start: 0,
                end: 15,
                color: 'rgba(248, 83, 3, 0.2)',
            });
            
            (defaultRegion as any).loop = true
            setActiveRegion(defaultRegion)
            setRegionInfo({ start: formatTime(defaultRegion.start), end: formatTime(defaultRegion.end) })
        }
    }
  
    const onPlayPause = () => {
      if (!wavesurfer) return
      if (processedSong && !loopedSong && activeRegion) {
        if (isPlaying) {
            wavesurfer.pause()
        } else {
            activeRegion.play()
        }
      } else {
        wavesurfer.playPause()
      }
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
      {(isProcessing || isLooping) && (
        <div className="flex flex-col w-full h-full items-center justify-center">
          <Processing />
          <p className="text-2xl font-bold mt-4">{isLooping ? 'Looping your song...' : 'Processing your song...'}</p>
        </div>
      )}
      {!isProcessing && !isLooping && !processedSong && (
        <>
        <div className="flex flex-row w-full h-[33vh] items-stretch justify-center gap-4 mb-4">
        <Card className="flex-2 flex-col justify-center bg-secondary text-secondary-foreground rounded-xl w-1/2 p-12">
          <CardTitle className="text-secondary-foreground text-8xl font-bold ">UPLOAD</CardTitle>
          <CardDescription className="text-secondary-foreground text-lg self-end">Add your favourite songs in the loop lab to process them</CardDescription>
        </Card>
        <div className="flex-1 w-full rounded-xl overflow-hidden">
          <img src={loopy} alt="loopy" className="h-full w-full  object-cover" />
        </div>
        </div>
        <div className="flex flex-row w-full h-full">
        <Card
          className="flex-1 flex-col bg-secondary text-secondary-foreground rounded-xl w-full h-full items-center justify-center"
        >
          <CardContent className="w-full h-full">
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
                  {/* <p className="bg-background rounded-full text-secondary w-16 text-lg mr-4 text-center mt-4">{formatTime(currentTime)}</p> */}
                  <p className="text-secondary-foreground text-lg px-4 mt-4">{selectedFile?.name}</p>
                  </div>
                </CardContent>
                </Card>
                  <div className="flex flex-row gap-4 items-stretch mt-4 flex-grow">
                      <Button onClick={onPlayPause} size="lg" className="h-full aspect-square bg-primary text-primary-foreground rounded-full">
                        {isPlaying ? <Pause className="size-15" fill="currentColor" /> : <Play className="size-15" fill="currentColor" />}
                      </Button>
                      <Button onClick={handleProcessSong} size="lg" className="h-full flex-grow text-4xl font-bold bg-primary text-primary-foreground rounded-full px-12">
                    PROCESS
                    </Button>
                  </div>
                </div>
              )}
        </div>
        </>
      )}
      {!isLooping && processedSong && !loopedSong &&(
        <Card
          className="flex flex-col bg-secondary text-secondary-foreground rounded-xl w-full h-full items-center justify-center"
        >
          <CardTitle className="text-secondary-foreground text-4xl font-bold self-center">CREATE YOUR LOOP</CardTitle>
          <CardContent className="w-full">
            <div className="flex flex-col w-full items-center justify-center">
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
                  <div ref={timelineRef} />
                  </div>
                  <div className="flex flex-row justify-around w-full mt-2 text-lg font-mono">
                    <p>Current Time: {formatTime(currentTime)}</p>
                    {regionInfo && (
                        <>
                            <p>Region Start: {regionInfo.start}</p>
                            <p>Region End: {regionInfo.end}</p>
                        </>
                    )}
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 self-center items-center mt-4">
                    <Button onClick={onPlayPause} size="lg" className="w-48 self-center text-lg bg-primary text-primary-foreground">
                      {isPlaying ? 'PAUSE' : 'PLAY'}
                    </Button>
                    <div className="flex flex-row items-center gap-2">
                        <p className="text-lg font-bold">Loop for</p>
                        <Input 
                            type="number"
                            value={loopDuration}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoopDuration(parseInt(e.target.value))}
                            className="w-24 text-lg bg-background text-foreground"
                        />
                        <p className="text-lg font-bold">minutes</p>
                    </div>
                    <Button onClick={handleLoopSong} size="lg" className="w-48 self-center text-lg bg-primary text-primary-foreground" disabled={!activeRegion}>
                      LOOP
                    </Button>
                  </div>
                </div>
            </div>
          </CardContent>
        </Card>
      )}
      {loopedSong && (
        <Card
          className="flex flex-col bg-secondary text-secondary-foreground rounded-xl w-full h-full items-center justify-center"
        >
          <CardTitle className="text-secondary-foreground text-4xl font-bold self-center">YOUR LOOPED SONG</CardTitle>
          <CardContent className="w-full">
            <div className="flex flex-col w-full items-center justify-center">
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <div className="flex flex-col w-full bg-background rounded-xl p-4">
                  <WavesurferPlayer
                    height={100}
                    waveColor='#f85303'
                    progressColor='#fad484'
                    barWidth={2}
                    barGap={1}
                    url={loopedSong}
                    onReady={onReady}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}

                  />
                  </div>
                  <div className="flex flex-row gap-4 self-center mt-4">
                    <Button onClick={onPlayPause} size="lg" className="w-48 self-center text-lg bg-primary text-primary-foreground">
                      {isPlaying ? 'PAUSE' : 'PLAY'}
                    </Button>
                    <Button onClick={handleLoopedDownload} size="lg" className="w-48 self-center text-lg bg-primary text-primary-foreground">
                      DOWNLOAD
                    </Button>
                    <Button onClick={() => setLoopedSong(null)} size="lg" className="w-48 self-center text-lg bg-destructive text-destructive-foreground">
                        LOOP AGAIN
                    </Button>
                  </div>
                </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Loopy
