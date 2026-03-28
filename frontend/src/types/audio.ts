export type ProcessRequest = {
  job_id: string
  startTime: number
  endTime: number
  loopDuration: number
  mode: "loop" | "vocals" | "both"
}
