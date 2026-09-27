"use client"
import React from "react"
import { AlertTriangle, CircleHelp, Info, X } from "@lib/icons"

interface ConfirmModalProps {
  isOpen: boolean
  title?: string
  message: string
  onConfirm: () => void
  onCancel?: () => void
  onClose?: () => void
  confirmText?: string
  cancelText?: string
  type?: "danger" | "warning" | "info"
  children?: React.ReactNode
  confirmDisabled?: boolean
}

export default function ConfirmModal({
  isOpen,
  title = "Onay Gerekli",
  message,
  onConfirm,
  onCancel,
  onClose,
  confirmText = "Evet",
  cancelText = "Hayır",
  type = "danger",
  children,
  confirmDisabled = false,
}: ConfirmModalProps) {
  const handleClose = onCancel || onClose || (() => {})
  if (!isOpen) return null

  const isDanger = type === "danger"
  const isWarning = type === "warning"
  const ToneIcon = isDanger ? AlertTriangle : isWarning ? CircleHelp : Info

  return (
    <div
      onClick={handleClose}
      className="admin-modal-backdrop"
      role="presentation"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="admin-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        aria-describedby="admin-confirm-message"
      >
        <div className="admin-modal__header">
          <div className="flex items-center gap-3">
            <div className={`admin-modal__tone admin-modal__tone--${type}`}>
              <ToneIcon aria-hidden="true" size={19} />
            </div>
            <h4 id="admin-confirm-title" className="m-0 text-base font-bold text-slate-900">{title}</h4>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="admin-icon-button"
            aria-label="Pencereyi kapat"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>

        <div id="admin-confirm-message" className="admin-modal__content">
          {message}
          {children}
        </div>

        <div className="admin-modal__footer">
          <button
            type="button"
            onClick={handleClose}
            className="admin-btn admin-btn-secondary"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`admin-btn ${isDanger ? "admin-btn-danger-solid" : "admin-btn-primary"}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
