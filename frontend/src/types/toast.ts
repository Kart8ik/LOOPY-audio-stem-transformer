import type * as React from "react"

export type ToastVariant = "default" | "destructive"

export type ToastProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: ToastVariant
} & Record<string, unknown>

export type ToastActionElement = React.ReactElement

export type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

export type ActionType =
  | {
      type: "ADD_TOAST"
      toast: ToasterToast
    }
  | {
      type: "UPDATE_TOAST"
      toast: Partial<ToasterToast>
    }
  | {
      type: "DISMISS_TOAST"
      toastId?: ToasterToast["id"]
    }
  | {
      type: "REMOVE_TOAST"
      toastId?: ToasterToast["id"]
    }

export interface ToastState {
  toasts: ToasterToast[]
}

export type Toast = Omit<ToasterToast, "id">