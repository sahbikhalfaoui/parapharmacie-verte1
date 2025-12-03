"use client"
import React, { useEffect, useState } from "react"
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info,
  X
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  toast: Toast
  onRemove: (id: string) => void
}

const ToastItem: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (toast.duration === 0) return // Persistent toast

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(interval)
          onRemove(toast.id)
          return 0
        }
        return prev - 100 / (toast.duration! * 10)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [toast.id, toast.duration, onRemove])

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  }

  const colors = {
    success: "bg-green-500 border-green-400 text-white",
    error: "bg-red-500 border-red-400 text-white",
    warning: "bg-orange-500 border-orange-400 text-white",
    info: "bg-blue-500 border-blue-400 text-white",
  }

  const Icon = icons[toast.type]
  const bgColor = colors[toast.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`relative flex items-start space-x-3 p-4 rounded-xl border shadow-lg min-w-[300px] max-w-md ${bgColor}`}
    >
      <Icon className="w-6 h-6 flex-shrink-0" />
      <div className="flex-1 pr-8">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      {toast.duration !== 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 overflow-hidden rounded-b-xl">
          <motion.div
            className="h-full bg-white/60"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-[1000] flex flex-col space-y-3">
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Hook for using toast
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: ToastType = "info", duration: number = 4) => {
    const id = Date.now().toString()
    const newToast: Toast = { id, message, type, duration }
    setToasts(prev => [newToast, ...prev.slice(0, 4)]) // Max 5 toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration * 1000)
    }

    return id
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (message: string, duration?: number) => 
    showToast(message, "success", duration)
  const error = (message: string, duration?: number) => 
    showToast(message, "error", duration)
  const warning = (message: string, duration?: number) => 
    showToast(message, "warning", duration)
  const info = (message: string, duration?: number) => 
    showToast(message, "info", duration)

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}