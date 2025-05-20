"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  onFileSelected?: (file: File) => void
  children?: React.ReactNode
}

const Dropzone = React.forwardRef<HTMLDivElement, DropzoneProps>(
  ({ className, children, onFileSelected, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleFiles = (files: FileList | null) => {
      if (files && files[0]) {
        onFileSelected?.(files[0])
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex cursor-pointer items-center justify-center rounded-md border border-dashed border-input bg-transparent p-4 text-sm text-muted-foreground",
          className
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }}
        {...props}
      >
        <input
          type="file"
          ref={inputRef}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        {children || <span>Drop file or click to upload</span>}
      </div>
    )
  }
)
Dropzone.displayName = "Dropzone"

export { Dropzone }
