import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Play, Pause } from "lucide-react"
import loopy from "@/assets/loopy.png"
import ModeSelector from "@/features/loop/ModeSelector"
import LoopControls from "@/features/loop/LoopControls"
import WaveformEditor from "@/features/loop/WaveformEditor"
import type { LoopEditorViewProps } from "@/types/loop"

const LoopEditorView = ({
  mode,
  loopEnabled,
  vocalsEnabled,
  setLoopEnabled,
  setVocalsEnabled,
  loopDuration,
  setLoopDuration,
  isLoopControlsDisabled,
  isPlaying,
  setIsPlaying,
  waveformEditorRef,
  audioUrl,
  setStartTime,
  setEndTime,
  handleProcess,
  errorMessage,
}: LoopEditorViewProps) => {
  return (
    <div className="flex flex-col w-full h-full gap-4 overflow-hidden">
      <div className="flex flex-row w-full h-[28vh] items-stretch justify-center gap-4">
        <Card className="flex-2 flex-col justify-center bg-secondary text-secondary-foreground rounded-xl w-1/2 p-10">
          <CardTitle className="text-secondary-foreground text-8xl font-bold ">CREATE</CardTitle>
          <CardDescription className="text-secondary-foreground text-lg self-end">
            {mode === "loop" && "Loop a selected section for continuous playback"}
            {mode === "vocals" && "Remove vocals from the selected section"}
            {mode === "both" && "Remove vocals and loop the selected section"}
          </CardDescription>
        </Card>
        <Card className="flex-1 flex-col justify-center bg-secondary text-secondary-foreground rounded-xl w-1/2 p-6 gap-2">
          <CardTitle className="text-secondary-foreground text-6xl font-bold mb-4">MODES</CardTitle>
          <CardContent>
            <ModeSelector
              loopEnabled={loopEnabled}
              vocalsEnabled={vocalsEnabled}
              onChange={(loop, vocals) => {
                setLoopEnabled(loop)
                setVocalsEnabled(vocals)
              }}
            />
          </CardContent>
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
              <WaveformEditor
                ref={waveformEditorRef}
                audioUrl={audioUrl}
                mode="region"
                onPlaybackChange={setIsPlaying}
                onRegionChange={(start, end) => {
                  setStartTime(start)
                  setEndTime(end)
                }}
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-row gap-4 items-stretch mt-4 flex-grow">
          <Button
            onClick={() => waveformEditorRef.current?.onPlayPause()}
            className="h-full flex aspect-square bg-primary text-primary-foreground rounded-full"
          >
            {isPlaying ? <Pause className="size-15" fill="currentColor" /> : <Play className="size-15" fill="currentColor" />}
          </Button>
          <LoopControls
            loopDuration={loopDuration}
            setLoopDuration={setLoopDuration}
            disabled={isLoopControlsDisabled}
          />
          <Button onClick={handleProcess} className="flex-1 h-full flex-grow text-5xl font-bold bg-primary text-primary-foreground rounded-full">
            LOOP
          </Button>
        </div>
        {errorMessage && (
          <div className="mt-4 text-red-500 text-center">{errorMessage}</div>
        )}
      </div>
    </div>
  )
}

export default LoopEditorView