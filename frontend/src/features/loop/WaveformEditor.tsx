import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin, { type Region } from 'wavesurfer.js/dist/plugins/regions.js'
import WavesurferPlayer from '@wavesurfer/react'
import type { WaveformEditorHandle, WaveformEditorProps } from "@/types/loop"

export type { WaveformEditorHandle } from "@/types/loop"

const WaveformEditor = forwardRef<WaveformEditorHandle, WaveformEditorProps>(({ audioUrl, onRegionChange, mode = 'region', onPlaybackChange }, ref) => {
    const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isWaveLoading, setIsWaveLoading] = useState(true)
    const [activeRegion, setActiveRegion] = useState<Region | null>(null)
    const regionsRef = useRef<RegionsPlugin | null>(null)

    useEffect(() => {
        setIsWaveLoading(true)
    }, [audioUrl])

    const onReady = (ws: WaveSurfer) => {
        setWavesurfer(ws)
        setIsPlaying(false)
        setIsWaveLoading(false)
        onPlaybackChange?.(false)

        ws.on('loading', () => {
            setIsWaveLoading(true)
        })

        ws.on('ready', () => {
            setIsWaveLoading(false)
        })

        if (mode === 'full') {
            setActiveRegion(null)
            return
        }

        if (!regionsRef.current) {
            regionsRef.current = ws.registerPlugin(RegionsPlugin.create())
            
            regionsRef.current.on('region-out', (region) => {
                const typedRegion = region as Region & { loop: boolean }
                if (typedRegion.loop) {
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
                const typedRegion = region as Region & { loop: boolean }
                typedRegion.loop = true
                setActiveRegion(region)
                onRegionChange(region.start, region.end)
            })

            regionsRef.current.on('region-updated', (region) => {
                setActiveRegion(region)
                onRegionChange(region.start, region.end)
            })

            // Add a default region
            const defaultRegion = regionsRef.current.addRegion({
                start: 0,
                end: 15,
                color: 'rgba(250, 212, 132, 0.5)',
            })
            
            const typedDefaultRegion = defaultRegion as Region & { loop: boolean }
            typedDefaultRegion.loop = true
            setActiveRegion(defaultRegion)
            onRegionChange(defaultRegion.start, defaultRegion.end)
        }
    }

    const onPlayPause = () => {
        if (!wavesurfer) return
        if (mode === 'region' && activeRegion) {
            if (isPlaying) {
                wavesurfer.pause()
            } else {
                activeRegion.play()
            }
        } else {
            wavesurfer.playPause()
        }
    }

    useImperativeHandle(ref, () => ({
        isPlaying,
        onPlayPause,
        activeRegion
    }), [isPlaying, onPlayPause, activeRegion])

    return (
        <div className="relative">
            {isWaveLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-20 w-full animate-pulse rounded-lg bg-primary" />
                </div>
            )}

            <div className={`transition-opacity duration-500 ${isWaveLoading ? 'opacity-0' : 'opacity-100'}`}>
                <WavesurferPlayer
                    height={100}
                    waveColor='#f85303'
                    progressColor='#fad484'
                    barWidth={2}
                    barGap={1}
                    url={audioUrl}
                    onReady={onReady}
                    onPlay={() => {
                        setIsPlaying(true)
                        onPlaybackChange?.(true)
                    }}
                    onPause={() => {
                        setIsPlaying(false)
                        onPlaybackChange?.(false)
                    }}
                />
            </div>
        </div>
    )
})

WaveformEditor.displayName = 'WaveformEditor'

export default WaveformEditor
