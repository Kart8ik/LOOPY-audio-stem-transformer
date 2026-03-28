import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Play, Pause } from "lucide-react"
import loopy from "@/assets/loopy.png"
import WaveformEditor from "@/features/loop/WaveformEditor"

type LoopResultViewProps = {
  loopedSong: string
  isPlaying: boolean
  setIsPlaying: (v: boolean) => void
  waveformEditorRef: any
  handleLoopedDownload: () => void
  setLoopedSong: (v: string | null) => void
}

const LoopResultView = ({
  loopedSong,
  isPlaying,
  setIsPlaying,
  waveformEditorRef,
  handleLoopedDownload,
  setLoopedSong,
}: LoopResultViewProps) => {
  return (
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
              <WaveformEditor
                ref={waveformEditorRef}
                audioUrl={loopedSong}
                mode="full"
                onPlaybackChange={setIsPlaying}
                onRegionChange={() => {}}
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-row gap-4 items-stretch mt-4 flex-grow">
          <Button
            onClick={() => waveformEditorRef.current?.onPlayPause()}
            size="lg"
            className="h-full aspect-square bg-primary text-primary-foreground rounded-full"
          >
            {isPlaying ? <Pause className="size-15" fill="currentColor" /> : <Play className="size-15" fill="currentColor" />}
          </Button>
          <Button onClick={handleLoopedDownload} size="lg" className="h-full flex-grow text-5xl font-bold bg-primary text-primary-foreground rounded-full px-12">
            DOWNLOAD
          </Button>
          <Button onClick={() => setLoopedSong(null)} size="lg" className="h-full flex-grow text-5xl font-bold bg-primary text-primary-foreground rounded-full px-12">
            LOOP AGAIN
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LoopResultView