import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { ArrowUpRight, Sun } from 'lucide-react'
import UploadZone from './components/UploadZone'
import StatusStepper from './components/StatusStepper'
import ReviewTable from './components/ReviewTable'
import ResultCard from './components/ResultCard'

export default function App() {
  const [step, setStep] = useState('upload')
  const [bill1, setBill1] = useState(null)
  const [consumer1, setConsumer1] = useState(null)
  const [originalConsumer1, setOriginalConsumer1] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [warnings, setWarnings] = useState([])

  const workflowRef = useRef(null)

  const handleExtract = async () => {
    if (!bill1) {
      setError('please attach a bill first.')
      return
    }
    setStep('processing')
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('bill', bill1)
      const API_BASE = import.meta.env.VITE_BACKEND_URL || '/api'
      const res = await axios.post(`${API_BASE}/extract`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (!res.data.success) throw new Error(res.data.error || 'Extraction failed')
      setConsumer1(res.data.data)
      setOriginalConsumer1(res.data.data)
      setWarnings(res.data.warnings || [])
      setStep('review')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || err.message || 'Error extracting bill.')
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
      const res = await axios.post(`${API_BASE}/generate-excel`, { consumer1 }, { responseType: 'blob' })
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
      let message = 'Error generating Excel file.'
      const blob = err.response?.data
      if (blob && typeof blob.text === 'function') {
        try {
          const body = JSON.parse(await blob.text())
          if (body?.error) message = body.error
        } catch {
          /* keep generic */
        }
      } else if (err.message) {
        message = err.message
      }
      setError(message)
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
    setWarnings([])
    setLoading(false)
  }

  const scrollToWorkflow = () => {
    workflowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // When user reaches review/processing, auto-scroll the workflow card into view
  useEffect(() => {
    if (step !== 'upload') scrollToWorkflow()
  }, [step])

  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">

        {/* HEADER / NAV */}
        <header className="bg-cream-soft rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-lime flex items-center justify-center">
              <Sun size={16} className="text-ink" strokeWidth={2.5} />
            </span>
            <span className="font-display font-extrabold text-xl tracking-tight">energybae</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <a className="nav-link is-active" href="#home">Home</a>
            <a className="nav-link" href="#workflow" onClick={(e) => { e.preventDefault(); scrollToWorkflow() }}>Upload</a>
            <a className="nav-link" href="#how">How it Works</a>
            <a className="nav-link" href="#about">About</a>
          </nav>
        </header>

        {/* HERO */}
        <section className="hero-card mt-5 shadow-hero">
          <div className="relative px-6 sm:px-12 pt-10 sm:pt-14 pb-12 sm:pb-16 min-h-[560px] flex flex-col">

            {/* Stats glass card — top right */}
            <div className="self-end glass-card p-5 w-[280px] hidden sm:block">
              <div className="flex items-start justify-between mb-1">
                <div className="text-cream font-display font-extrabold text-3xl leading-none">
                  10k+
                </div>
                <span className="text-[10px] uppercase tracking-widest text-ink bg-lime/90 rounded-full px-2 py-0.5">
                  bills read
                </span>
              </div>
              <div className="text-cream/70 text-sm mb-4">MSEDCL bills processed</div>
              <BarChart />
              <div className="flex items-center justify-between mt-2 text-[10px] uppercase tracking-widest text-cream/50">
                <span>Jan 2025</span>
                <span>Apr 2026</span>
              </div>
            </div>

            <div className="mt-auto max-w-2xl">
              <h1 className="display-h1 text-5xl sm:text-6xl text-cream leading-tight">
                Switch to <span className="text-lime">Solar</span> & know<br />
                Your Own Energy
              </h1>
              <p className="mt-5 text-cream/75 text-base sm:text-lg max-w-lg">
                Drop your MSEDCL electricity bill — we extract every digit, fill the
                Energybae solar template, and hand you a ready-to-share report in seconds.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button onClick={scrollToWorkflow} className="btn-primary text-base">
                  Get Started
                  <span className="arrow"><ArrowUpRight size={16} /></span>
                </button>
                <a href="#how" className="btn-ghost on-dark text-base">
                  Learn More
                  <span className="arrow"><ArrowUpRight size={14} /></span>
                </a>

                <div className="ml-auto hidden md:flex items-center gap-3 text-cream">
                  <div className="flex">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-forest"
                        style={{
                          background: ['#a8d999', '#cce85a', '#e0f088'][i],
                          marginLeft: i ? -10 : 0,
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-xs leading-tight">
                    <div className="text-lime">★★★★★</div>
                    <div className="text-cream/70">trusted by solar pros</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW CARD — preserves all existing logic, restyled by palette */}
        <section ref={workflowRef} id="workflow" className="mt-8 bg-cream-soft rounded-3xl frame-thick overflow-hidden">
          <StatusStepper currentStep={step} />

          {error && (
            <div className="border-t-[1.5px] border-ink bg-coral/15 px-6 py-4 flex items-center justify-between">
              <span className="font-display font-semibold text-ink">! {error}</span>
              <button
                onClick={() => setError(null)}
                className="font-display font-bold text-xl text-ink/70 hover:text-ink"
              >
                ×
              </button>
            </div>
          )}

          <div className="border-t-[1.5px] border-ink">
            {step === 'upload' && (
              <div className="px-6 sm:px-10 py-10">
                <div className="mb-6 flex items-baseline justify-between gap-4">
                  <h2 className="display-h1 text-4xl sm:text-5xl">attach bill ↓</h2>
                  <span className="micro text-ink/50">step 1 of 4</span>
                </div>
                <UploadZone file={bill1} onFileChange={setBill1} />
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-sm text-ink/70 max-w-md">
                    OCR runs locally via Ollama (qwen2.5-vl / moondream) or Gemini in prod. 5–15 s typical.
                  </p>
                  <button
                    onClick={handleExtract}
                    disabled={!bill1 || loading}
                    className="btn-primary text-base"
                  >
                    {loading && <span className="inline-block w-3 h-3 border-2 border-ink border-t-transparent rounded-full animate-spin" />}
                    start extraction
                    <span className="arrow"><ArrowUpRight size={16} /></span>
                  </button>
                </div>
              </div>
            )}

            {step === 'processing' && (
              <div className="px-6 sm:px-10 py-24 flex flex-col items-center text-center">
                <div className="relative mb-8 w-32 h-32 flex items-center justify-center">
                  <div className="pink-blob absolute inset-0" />
                  <span className="relative font-display text-7xl font-extrabold text-ink animate-pulse">✦</span>
                </div>
                <div className="micro text-ink/60 mb-3">step 2 of 4</div>
                <h2 className="display-h1 text-5xl mb-3">extracting…</h2>
                <p className="text-ink/70 max-w-sm">
                  Reading consumer details, sanctioned load, and 12 months of usage.
                </p>
              </div>
            )}

            {step === 'review' && (
              <div className="relative">
                {loading && (
                  <div className="absolute inset-0 z-10 bg-cream/70 flex items-center justify-center">
                    <span className="font-display font-bold uppercase text-ink">generating…</span>
                  </div>
                )}
                <div className="px-6 sm:px-10 py-8 border-b-[1.5px] border-ink flex items-baseline justify-between gap-4">
                  <h2 className="display-h1 text-4xl sm:text-5xl">review data</h2>
                  <span className="micro text-ink/50">step 3 of 4</span>
                </div>

                {warnings.length > 0 && (
                  <div className="px-6 sm:px-10 py-5 border-b-[1.5px] border-ink bg-lime-soft/40">
                    <div className="micro text-ink mb-2">please verify before generating</div>
                    <ul className="list-disc pl-5 text-sm text-ink space-y-1">
                      {warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}

                <ReviewTable
                  consumer1={consumer1}
                  originalConsumer1={originalConsumer1}
                  onChange1={setConsumer1}
                  onGenerate={handleGenerateExcel}
                />
              </div>
            )}

            {step === 'done' && (
              <>
                <ResultCard consumer1={consumer1} />
                <div className="px-6 sm:px-10 py-6 border-t-[1.5px] border-ink flex justify-between items-center">
                  <span className="micro text-ink/60">file saved to your downloads</span>
                  <button onClick={handleReset} className="btn-ghost text-sm">
                    start over
                    <span className="arrow"><ArrowUpRight size={14} /></span>
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer id="about" className="mt-8 mb-6">
          <div className="rounded-3xl bg-forest text-cream px-6 sm:px-10 py-10">
            <div className="font-display font-extrabold text-5xl sm:text-7xl tracking-tighter mb-8">
              energybae
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div>
                <div className="display-label text-base mb-3 border-b-[1.5px] border-cream/40 pb-1 inline-block">
                  workflow ↗
                </div>
                <ul className="text-sm text-cream/80 space-y-1.5">
                  <li>· upload bill</li>
                  <li>· ai extracts data</li>
                  <li>· review &amp; correct</li>
                  <li>· download excel</li>
                </ul>
              </div>
              <div>
                <div className="display-label text-base mb-3 border-b-[1.5px] border-cream/40 pb-1 inline-block">
                  built with ↗
                </div>
                <ul className="text-sm text-cream/80 space-y-1.5">
                  <li>· react + vite</li>
                  <li>· node + express</li>
                  <li>· gemini 2.5 pro / ollama</li>
                  <li>· exceljs</li>
                </ul>
              </div>
              <div>
                <div className="display-label text-base mb-3 border-b-[1.5px] border-cream/40 pb-1 inline-block">
                  about ↗
                </div>
                <p className="text-sm text-cream/80 leading-relaxed">
                  An MSEDCL bill → solar load calculator built for the
                  Energybae automation brief.
                </p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-cream/20 text-xs text-cream/50">
              © 2026 energybae · solar load calculator
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

function BarChart() {
  // Static decorative bars (rises toward the right) — matches Helyx stat card
  const heights = [28, 36, 32, 40, 34, 50, 56, 64, 58, 70, 78, 86]
  return (
    <div className="flex items-end gap-1 h-20">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${h}%`,
            background: i >= heights.length - 4 ? '#cce85a' : 'rgba(204, 232, 90, 0.35)',
          }}
        />
      ))}
    </div>
  )
}
