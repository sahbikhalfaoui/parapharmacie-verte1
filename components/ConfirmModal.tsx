"use client"
import React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, XCircle, Info, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type ConfirmType = "danger" | "success" | "warning" | "info"

interface ConfirmModalProps {
  isOpen: boolean
  type?: ConfirmType
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  type = "warning",
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  const icons = {
    danger: XCircle,
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const colors = {
    danger: "text-red-600 bg-red-50 border-red-200",
    success: "text-green-600 bg-green-50 border-green-200",
    warning: "text-orange-600 bg-orange-50 border-orange-200",
    info: "text-blue-600 bg-blue-50 border-blue-200",
  }

  const buttonColors = {
    danger: "bg-red-600 hover:bg-red-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    warning: "bg-orange-600 hover:bg-orange-700 text-white",
    info: "bg-blue-600 hover:bg-blue-700 text-white",
  }

  const Icon = icons[type]
  const colorClass = colors[type]
  const buttonClass = buttonColors[type]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative max-w-md w-full"
          >
            <Card className="border-2 shadow-2xl overflow-hidden">
              <div className={`p-6 border-b ${colorClass}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-8 h-8" />
                    <h3 className="text-xl font-bold">{title}</h3>
                  </div>
                  <button
                    onClick={onCancel}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-700 mb-6">{message}</p>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1 border-2 border-gray-200 hover:bg-gray-50"
                    disabled={isLoading}
                  >
                    {cancelText}
                  </Button>
                  <Button
                    onClick={onConfirm}
                    className={`flex-1 ${buttonClass} shadow-lg hover:shadow-xl transition-all`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Traitement...</span>
                      </div>
                    ) : (
                      confirmText
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}