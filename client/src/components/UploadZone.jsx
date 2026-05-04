import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, FileText } from 'lucide-react'

export default function UploadZone({ label, file, onFileChange }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) onFileChange(acceptedFiles[0])
  }, [onFileChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'application/pdf': [],
    },
    maxFiles: 1,
  })

  return (
    <div className="flex flex-col gap-3">
      {label && <span className="micro text-ink/60">{label}</span>}
      <div
        {...getRootProps()}
        className={`relative frame bg-cream-soft cursor-pointer transition-colors group ${
          isDragActive ? 'bg-pink-soft/40' : ''
        } ${file ? 'border-ink' : ''}`}
      >
        <input {...getInputProps()} />

        {!file ? (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center">
            <div className="px-8 py-12 sm:py-16">
              <div className="flex items-center gap-3 mb-3">
                <UploadCloud size={20} className="text-ink" />
                <span className="micro text-ink/60">drop or click</span>
              </div>
              <h3 className="display-h1 text-4xl sm:text-5xl mb-3">
                {isDragActive ? 'release to attach' : 'attach the bill'}
              </h3>
              <p className="text-sm text-ink/70 max-w-md">
                MSEDCL electricity bill — PDF or image. We will extract the consumer details
                and 12-month consumption automatically.
              </p>
            </div>
            <div className="hidden sm:flex relative items-center justify-center w-48 border-l-[1.5px] border-ink overflow-hidden">
              <div className="pink-blob absolute inset-0" />
              <span className="relative font-display text-7xl font-extrabold text-ink">✦</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] items-center">
            <div className="border-r-[1.5px] border-ink p-6 flex items-center justify-center bg-cream">
              {file.type.includes('image') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="w-28 h-28 object-cover frame"
                />
              ) : (
                <FileText size={56} className="text-ink" />
              )}
            </div>
            <div className="px-8 py-6">
              <div className="micro text-ink/60 mb-2">attached</div>
              <p className="font-display font-bold text-2xl text-ink truncate" title={file.name}>
                {file.name}
              </p>
              <p className="text-sm text-ink/60 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB · click to replace
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
