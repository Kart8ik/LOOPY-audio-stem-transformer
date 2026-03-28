import { useState, useRef, useEffect } from 'react'
import Processing from "./Processing"
import { useLocation, useNavigate } from 'react-router-dom'
import type { WaveformEditorHandle } from "@/features/loop/WaveformEditor"
import { processAudio } from "@/api/audio"
import LoopEditorView from "@/features/loop/LoopEditorView"
import LoopResultView from "@/features/loop/LoopResultView"

interface LocationState {
  job_id: string
  audioBlob: string
  filename: string
}

const CreateLoop = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const state = location.state as LocationState | null
    const [restoredState] = useState<LocationState | null>(() => {
        if (state) return null
        const saved = localStorage.getItem("loopy_job")
        if (!saved) return null

        try {
            const parsed = JSON.parse(saved)
            if (
                parsed &&
                typeof parsed.job_id === "string" &&
                typeof parsed.audioBlob === "string" &&
                typeof parsed.filename === "string"
            ) {
                return parsed as LocationState
            }
        } catch {
            return null
        }

        return null
    })
    const effectiveState = state ?? restoredState

    const [loopDuration, setLoopDuration] = useState<number>(1)
    const [loopedSong, setLoopedSong] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [loopEnabled, setLoopEnabled] = useState(true)
    const [vocalsEnabled, setVocalsEnabled] = useState(true)
    const [startTime, setStartTime] = useState<number>(0)
    const [endTime, setEndTime] = useState<number>(15)
    const waveformEditorRef = useRef<WaveformEditorHandle>(null)

    const mode = loopEnabled && vocalsEnabled
        ? "both"
        : loopEnabled
            ? "loop"
            : "vocals"

    const isLoopControlsDisabled = vocalsEnabled && !loopEnabled

    useEffect(() => {
        if (state && state.job_id && state.audioBlob) {
            localStorage.setItem(
                "loopy_job",
                JSON.stringify({
                    job_id: state.job_id,
                    audioBlob: state.audioBlob,
                    filename: state.filename,
                })
            )
        }
    }, [state])

    useEffect(() => {
        if (!effectiveState || !effectiveState.job_id || !effectiveState.audioBlob) {
            navigate('/loop-lab')
        }
    }, [effectiveState, navigate])


    const handleProcess = async () => {
        if (!waveformEditorRef.current?.activeRegion || !loopDuration) return
        
        setIsProcessing(true)
        setErrorMessage(null)

        try {
            const blob = await processAudio({
                job_id: effectiveState?.job_id ?? "",
                startTime: startTime,
                endTime: endTime,
                loopDuration: loopDuration,
                mode,
            })
            const url = URL.createObjectURL(blob)
            setLoopedSong(url)
        } catch (error) {
            console.error(error)
            setErrorMessage(error instanceof Error ? error.message : 'Processing failed')
        } finally {
            setIsProcessing(false)
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

    if (!effectiveState || !effectiveState.audioBlob) {
        return <div>Redirecting...</div>
    }

    return (
        <div className="flex flex-col w-full h-full bg-background text-foreground font-sans px-4 pb-4 overflow-x-hidden no-scrollbar">
            {isProcessing && (
                <div className="flex flex-col w-full h-full items-center justify-center">
                    <Processing isLooping={true} />
                </div>
            )}
            {!isProcessing && !loopedSong && (
                <LoopEditorView
                    mode={mode}
                    loopEnabled={loopEnabled}
                    vocalsEnabled={vocalsEnabled}
                    setLoopEnabled={setLoopEnabled}
                    setVocalsEnabled={setVocalsEnabled}
                    loopDuration={loopDuration}
                    setLoopDuration={setLoopDuration}
                    isLoopControlsDisabled={isLoopControlsDisabled}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    waveformEditorRef={waveformEditorRef}
                    audioUrl={effectiveState.audioBlob}
                    setStartTime={setStartTime}
                    setEndTime={setEndTime}
                    handleProcess={handleProcess}
                    errorMessage={errorMessage}
                />
            )}
            {loopedSong && (
                <LoopResultView
                    loopedSong={loopedSong}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    waveformEditorRef={waveformEditorRef}
                    handleLoopedDownload={handleLoopedDownload}
                    setLoopedSong={setLoopedSong}
                />
            )}
        </div>
    )
}

export default CreateLoop
