"use client"

import FileUpload from "@modules/common/components/file-upload"
import { useEffect, useState } from "react"

type ImagePreview = { file: File; url: string }

type ImageUploadProps = {
  label?: string
  multiple?: boolean
  maxSizeMb?: number
  onImagesSelected: (files: File[]) => void
}

export default function ImageUpload({
  label = "Görsel yükle",
  multiple = true,
  maxSizeMb = 8,
  onImagesSelected,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<ImagePreview[]>([])

  useEffect(
    () => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [previews],
  )

  const handleImages = (files: File[]) => {
    previews.forEach((preview) => URL.revokeObjectURL(preview.url))
    setPreviews(files.map((file) => ({ file, url: URL.createObjectURL(file) })))
    onImagesSelected(files)
  }

  return (
    <div className="space-y-3">
      <FileUpload
        label={label}
        accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
        multiple={multiple}
        maxSizeMb={maxSizeMb}
        showFileList={false}
        onFilesSelected={handleImages}
      />
      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {previews.map((preview) => (
            <figure
              key={`${preview.file.name}-${preview.file.lastModified}`}
              className="overflow-hidden rounded-rounded border border-border bg-card"
            >
              <img
                src={preview.url}
                alt={preview.file.name}
                className="aspect-square w-full object-cover"
              />
              <figcaption className="truncate px-2 py-1.5 text-ui-xs text-muted">
                {preview.file.name}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  )
}
