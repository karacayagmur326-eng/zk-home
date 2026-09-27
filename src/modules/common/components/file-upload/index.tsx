"use client"

import { File, UploadCloud, X } from "@lib/icons"
import clsx from "clsx"
import { ChangeEvent, DragEvent, useId, useState } from "react"

export type FileUploadProps = {
  label?: string
  hint?: string
  accept?: string
  multiple?: boolean
  maxSizeMb?: number
  disabled?: boolean
  showFileList?: boolean
  onFilesSelected: (files: File[]) => void
  className?: string
}

const matchesAccept = (file: File, accept?: string) => {
  if (!accept) return true
  return accept.split(",").some((rule) => {
    const value = rule.trim().toLowerCase()
    if (value.startsWith(".")) return file.name.toLowerCase().endsWith(value)
    if (value.endsWith("/*")) return file.type.startsWith(value.slice(0, -1))
    return file.type === value
  })
}

export default function FileUpload({
  label = "Dosya yükle",
  hint,
  accept,
  multiple = false,
  maxSizeMb = 10,
  disabled,
  showFileList = true,
  onFilesSelected,
  className,
}: FileUploadProps) {
  const inputId = useId()
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const selectFiles = (incoming: File[]) => {
    const maxBytes = maxSizeMb * 1024 * 1024
    const accepted = incoming.filter(
      (file) => matchesAccept(file, accept) && file.size <= maxBytes,
    )
    const rejected = incoming.length - accepted.length
    const next = multiple ? accepted : accepted.slice(0, 1)
    setError(
      rejected
        ? `${rejected} dosya tür veya ${maxSizeMb} MB boyut sınırını karşılamıyor.`
        : null,
    )
    setFiles(next)
    if (next.length) onFilesSelected(next)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFiles(Array.from(event.target.files ?? []))
    event.target.value = ""
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragging(false)
    if (!disabled) selectFiles(Array.from(event.dataTransfer.files))
  }

  return (
    <div className={clsx("space-y-2", className)}>
      <label
        htmlFor={inputId}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={clsx(
          "flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-rounded border border-dashed border-border bg-subtle/60 px-6 py-8 text-center transition-colors",
          dragging && "border-primary bg-primary/10",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <UploadCloud aria-hidden="true" className="mb-3 h-8 w-8 text-primary" />
        <span className="text-ui-sm font-semibold text-foreground">
          {label}
        </span>
        <span className="mt-1 text-ui-xs text-muted">
          {hint ?? `Sürükleyip bırakın veya seçin · En fazla ${maxSizeMb} MB`}
        </span>
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleChange}
          className="sr-only"
        />
      </label>
      {error && (
        <p role="alert" className="text-ui-xs text-danger">
          {error}
        </p>
      )}
      {showFileList && files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={`${file.name}-${file.lastModified}`}
              className="flex items-center gap-3 rounded-base border border-border bg-card px-3 py-2"
            >
              <File aria-hidden="true" className="h-4 w-4 text-muted" />
              <span className="min-w-0 flex-1 truncate text-ui-sm text-foreground">
                {file.name}
              </span>
              <span className="text-ui-xs text-muted">
                {(file.size / 1024).toFixed(1)} KB
              </span>
              <button
                type="button"
                aria-label={`${file.name} dosyasını kaldır`}
                onClick={() =>
                  setFiles((current) => current.filter((item) => item !== file))
                }
                className="inline-flex h-8 w-8 items-center justify-center rounded-base text-muted hover:bg-subtle hover:text-danger"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
