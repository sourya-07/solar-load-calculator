import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, FileText } from 'lucide-react'

export default function UploadZone({ label, file, onFileChange }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileChange(acceptedFiles[0])
    }
  }, [onFileChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'application/pdf': []
    },
    maxFiles: 1
  })

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-300">{label}</label>
      <div 
        {...getRootProps()} 
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 
          ${isDragActive ? 'border-orange-500 bg-orange-500/10' : 'border-slate-600 hover:border-orange-400 hover:bg-slate-800/50'}
          ${file ? 'border-green-500/50 bg-green-500/5' : ''}`}
      >
        <input {...getInputProps()} />
        
        {!file ? (
          <>
            <UploadCloud className={`w-12 h-12 mb-4 ${isDragActive ? 'text-orange-500' : 'text-slate-400'}`} />
            <p className="text-center font-medium">Drag & drop or click to browse</p>
            <p className="text-xs text-slate-500 mt-2">JPG, PNG, or PDF</p>
          </>
        ) : (
          <div className="flex flex-col items-center text-center">
            {file.type.includes('image') ? (
              <img 
                src={URL.createObjectURL(file)} 
                alt="Preview" 
                className="w-24 h-24 object-cover rounded-lg mb-4 border border-slate-700"
              />
            ) : (
              <FileText className="w-16 h-16 text-orange-400 mb-4" />
            )}
            <p className="font-semibold text-sm truncate w-full max-w-[200px]" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
