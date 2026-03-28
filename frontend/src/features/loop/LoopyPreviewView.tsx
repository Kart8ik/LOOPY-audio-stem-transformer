import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause } from "lucide-react"
import WavesurferPlayer from '@wavesurfer/react'
import WaveSurfer from 'wavesurfer.js'

type LoopyPreviewViewProps = {
  song: string
  selectedFilename: string | null
  isPlaying: boolean
  setIsPlaying: (v: boolean) => void
  onPlayPause: () => void
  onNext: () => void
  errorMessage: string | null
  onReady: (ws: WaveSurfer) => void
}

const LoopyPreviewView = ({
  song,
  selectedFilename,
  isPlaying,
  setIsPlaying,
  onPlayPause,
  onNext,
  errorMessage,
  onReady,
}: LoopyPreviewViewProps) => {
  return (
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
        <Button onClick={onNext} size="lg" className="h-full flex-grow text-5xl font-bold bg-primary text-primary-foreground rounded-full px-12">
          NEXT
        </Button>
      </div>
      {errorMessage && (
        <div className="mt-4 text-red-500 text-center">{errorMessage}</div>
      )}
    </div>
  )
}

export default LoopyPreviewView
