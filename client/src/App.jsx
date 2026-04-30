import { useState } from 'react'
import axios from 'axios'
import UploadZone from './components/UploadZone'
import StatusStepper from './components/StatusStepper'
import ReviewTable from './components/ReviewTable'
import ResultCard from './components/ResultCard'

export default function App() {
  const [step, setStep] = useState('upload') // 'upload' | 'processing' | 'review' | 'done'
  const [bill1, setBill1] = useState(null)
  const [consumer1, setConsumer1] = useState(null)
  
  // Store original data for "Reset" functionality
  const [originalConsumer1, setOriginalConsumer1] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleExtract = async () => {
    if (!bill1) {
      setError("Please upload at least Consumer 1's bill.")
      return
    }

    setStep('processing')
    setLoading(true)
    setError(null)

    try {
      const uploadBill = async (file) => {
        const formData = new FormData()
        formData.append('bill', file)
        const API_BASE = import.meta.env.VITE_BACKEND_URL || '/api'
        const res = await axios.post(`${API_BASE}/extract`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        if (!res.data.success) throw new Error(res.data.error || "Extraction failed")
        return res.data.data
      }

      const result = await uploadBill(bill1)
      setConsumer1(result)
      setOriginalConsumer1(result)
      
      setStep('review')
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.error || err.message || 'Error extracting bills. Check console.'
      setError(errorMsg)
      setStep('upload')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateExcel = async () => {
    setLoading(true)
    setError(null)
    try {
      const API_BASE = import.meta.env.VITE_BACKEND_URL || '/api'
      const res = await axios.post(`${API_BASE}/generate-excel`, {
        consumer1
      }, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'EnergyBae_Solar_Report.xlsx')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setStep('done')
    } catch (err) {
      console.error(err)
      setError('Error generating Excel file.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep('upload')
    setBill1(null)
    setConsumer1(null)
    setOriginalConsumer1(null)
    setError(null)
    setLoading(false)
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-orange-500 mb-2">EnergyBae Solar Calculator</h1>
        <p className="text-slate-400">Automated AI Bill Extraction & Solar Load Analysis</p>
      </header>

      <StatusStepper currentStep={step} />

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xl font-bold">&times;</button>
        </div>
      )}

      {step === 'upload' && (
        <div className="glass-card flex flex-col gap-8 max-w-2xl mx-auto">
          <UploadZone 
            label="Upload Electricity Bill (PDF or Image)" 
            file={bill1} 
            onFileChange={setBill1} 
          />
          <button 
            onClick={handleExtract}
            disabled={!bill1 || loading}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-xl transition-colors mx-auto flex items-center gap-2"
          >
            {loading && <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>}
            Start AI Extraction
          </button>
        </div>
      )}

      {step === 'processing' && (
        <div className="glass-card flex flex-col items-center py-20 gap-4">
          <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"></div>
          <p className="text-xl font-medium text-slate-300">Extracting bill data with Gemini AI...</p>
        </div>
      )}

      {step === 'review' && (
        <div className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
          {loading && (
             <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
               <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"></div>
             </div>
          )}
          <h2 className="text-2xl font-bold mb-6">Review Extracted Data</h2>
          <ReviewTable 
            consumer1={consumer1} 
            originalConsumer1={originalConsumer1}
            onChange1={setConsumer1} 
            onGenerate={handleGenerateExcel} 
          />
        </div>
      )}

      {step === 'done' && (
        <div className="glass-card animate-in zoom-in-95 duration-500">
          <ResultCard consumer1={consumer1} />
          <div className="flex justify-center mt-8">
            <button 
              onClick={handleReset}
              className="border border-slate-600 hover:bg-slate-800 text-slate-300 font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Start New Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
