import type * as React from "react"
import type WaveSurfer from "wavesurfer.js"
import type { Region } from "wavesurfer.js/dist/plugins/regions.js"

export type LoopControlsProps = {
  loopDuration: number
  setLoopDuration: (value: number) => void
  disabled: boolean
}

export type LoopyPreviewViewProps = {
  song: string
  selectedFilename: string | null
  isPlaying: boolean
  setIsPlaying: (v: boolean) => void
  onPlayPause: () => void
  onNext: () => void
  errorMessage: string | null
  onReady: (ws: WaveSurfer) => void
}

export type LoopEditorViewProps = {
  mode: string
  loopEnabled: boolean
  vocalsEnabled: boolean
  setLoopEnabled: (v: boolean) => void
  setVocalsEnabled: (v: boolean) => void
  loopDuration: number
  setLoopDuration: (n: number) => void
  isLoopControlsDisabled: boolean
  isPlaying: boolean
  setIsPlaying: (v: boolean) => void
  waveformEditorRef: any
  audioUrl: string
  setStartTime: (n: number) => void
  setEndTime: (n: number) => void
  handleProcess: () => void
  errorMessage: string | null
}

export type LoopResultViewProps = {
  loopedSong: string
  isPlaying: boolean
  setIsPlaying: (v: boolean) => void
  waveformEditorRef: any
  handleLoopedDownload: () => void
  setLoopedSong: (v: string | null) => void
}

export type WaveformEditorProps = {
  audioUrl: string
  onRegionChange: (start: number, end: number) => void
  mode?: "region" | "full"
  onPlaybackChange?: (isPlaying: boolean) => void
}

export type WaveformEditorHandle = {
  isPlaying: boolean
  onPlayPause: () => void
  activeRegion: Region | null
}

export type ModeSelectorProps = {
  loopEnabled: boolean
  vocalsEnabled: boolean
  onChange: (loop: boolean, vocals: boolean) => void
}

export type LoopyUploadViewProps = {
  inputMode: "file" | "youtube"
  isDragging: boolean
  youtubeUrl: string
  setYoutubeUrl: (v: string) => void
  onModeChange: (mode: "file" | "youtube") => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onYoutubeSubmit: () => void
}