import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { useState, useRef, useEffect } from 'react'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin, { type Region } from 'wavesurfer.js/dist/plugins/regions.js'
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

    const [loopDuration, setLoopDuration] = useState<number>(30)
    const [loopedSong, setLoopedSong] = useState<string | null>(null)
    const [isLooping, setIsLooping] = useState(false)
    const regionsRef = useRef<RegionsPlugin|null>(null)
    const [activeRegion, setActiveRegion] = useState<Region|null>(null)

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

        if (processedSong && !loopedSong) {
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
            })

            regionsRef.current.on('region-updated', (region) => {
                setActiveRegion(region)
            })

            // Add a default region
            const defaultRegion = regionsRef.current.addRegion({
                start: 0,
                end: 15,
                color: 'rgba(250, 212, 132, 0.5)',
            });
            
            (defaultRegion as any).loop = true
            setActiveRegion(defaultRegion)
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
          <Processing isLooping={isLooping} />
          <p className="bg-secondary text-secondary-foreground rounded-full px-12 py-4 text-2xl font-bold mt-4 z-50">DON'T REFRESH PAGE</p>
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
                         <Button onClick={handleProcessSong} size="lg" className="h-full flex-grow text-5xl font-bold bg-primary text-primary-foreground rounded-full px-12">
                       PROCESS
                       </Button>
                     </div>
                </div>
             )}
         </div>
          </>
        )}
      {!isLooping && processedSong && !loopedSong &&(
        <div className="flex flex-col w-full h-full gap-4 overflow-hidden">
          <div className="flex flex-row w-full h-[28vh] items-stretch justify-center gap-4">
          <Card className="flex-2 flex-col justify-center bg-secondary text-secondary-foreground rounded-xl w-1/2 p-12">
            <CardTitle className="text-secondary-foreground text-8xl font-bold ">CREATE LOOP</CardTitle>
            <CardDescription className="text-secondary-foreground text-lg self-end">Select a region of your song to loop, and preview it</CardDescription>
          </Card>
          <div className="flex-1 w-full rounded-xl overflow-hidden">
            <img src={loopy} alt="loopy" className="h-full w-full  object-cover" />
          </div>
          </div>
        <div className="flex-2 flex-grow flex flex-col w-full h-full">
        <Card
          className="flex-1 flex-col bg-secondary text-secondary-foreground rounded-xl w-full h-full items-center justify-center"
        >
          <CardContent className="w-full">
                  <div className="flex flex-1 flex-col bg-background rounded-full p-4 px-12 h-full">
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
          </CardContent>
        </Card>
        <div className="flex flex-row gap-4 items-stretch mt-4 flex-grow">
                    <Button onClick={onPlayPause} className="h-full flex aspect-square bg-primary text-primary-foreground rounded-full">
                           {isPlaying ? <Pause className="size-15" fill="currentColor" /> : <Play className="size-15" fill="currentColor" />}
                    </Button>
                    <Card className="flex-1 bg-secondary text-secondary-foreground flex-grow rounded-xl">
                      <CardContent className="flex flex-col items-center justify-center flex-grow h-full gap-2">
                        <p className="text-4xl text-center font-bold">LOOP SECTION FOR</p>
                        <div className="flex w-full flex-row items-center gap-2">
                      <Input 
                            type="number"
                            min="0"
                            value={loopDuration}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const value = parseInt(e.target.value);
                                if (value >= 0) {
                                    setLoopDuration(value);
                                } else if (e.target.value === '') {
                                    setLoopDuration(0);
                                }
                            }}
                            className="flex-1 text-5xl bg-background text-center px-0 py-0 text-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <p className="text-7xl font-bold">MINUTES</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Button onClick={handleLoopSong} className="flex-1 h-full flex-grow text-5xl font-bold bg-primary text-primary-foreground rounded-full" disabled={!activeRegion}>
                      LOOP
                    </Button>
                  </div>
        </div>
        </div>
      )}
      {loopedSong && (
        <div className="flex flex-col w-full h-full overflow-hidden">
          <div className="flex flex-row w-full h-[33vh] items-stretch justify-center gap-4 mb-4">
            <Card className="flex-2 flex-col justify-center bg-secondary text-secondary-foreground rounded-xl w-1/2 p-12">
              <CardTitle className="text-secondary-foreground text-8xl font-bold ">YOUR LOOP</CardTitle>
              <CardDescription className="text-secondary-foreground text-lg self-end">Play your masterpiece, download it, or create another loop.</CardDescription>
            </Card>
            <div className="flex-1 w-full rounded-xl overflow-hidden">
              <img src={loopy} alt="loopy" className="h-full w-full  object-cover" />
            </div>
          </div>
          <div className="flex-2 flex flex-col w-full h-full">
            <Card className="flex-1 flex-col bg-secondary text-secondary-foreground rounded-xl w-full h-full items-center justify-center">
              <CardContent className="w-full">
                <div className="flex flex-col w-full bg-background rounded-full p-4 px-12 h-full">
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
              </CardContent>
            </Card>
            <div className="flex flex-row gap-4 items-stretch mt-4 flex-grow">
              <Button onClick={onPlayPause} size="lg" className="h-full aspect-square bg-primary text-primary-foreground rounded-full">
                {isPlaying ? <Pause className="size-15" fill="currentColor" /> : <Play className="size-15" fill="currentColor" />}
              </Button>
              <Button onClick={handleLoopedDownload} size="lg" className="h-full flex-grow text-5xl font-bold bg-primary text-primary-foreground rounded-full px-12">
                DOWNLOAD
              </Button>
              <Button onClick={() => setLoopedSong(null)} size="lg" className="h-full flex-grow text-5xl font-bold bg-primary  text-primary-foreground rounded-full px-12">
                LOOP AGAIN
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Loopy
