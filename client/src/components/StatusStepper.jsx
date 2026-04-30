import { UploadCloud, Sparkles, ClipboardCheck, Download } from 'lucide-react'

export default function StatusStepper({ currentStep }) {
  const steps = [
    { id: 'upload', label: 'Upload Bills', icon: UploadCloud },
    { id: 'processing', label: 'AI Extracting', icon: Sparkles },
    { id: 'review', label: 'Review Data', icon: ClipboardCheck },
    { id: 'done', label: 'Download Excel', icon: Download },
  ]

  const getStepStatus = (stepId) => {
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    const stepIndex = steps.findIndex(s => s.id === stepId)
    
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }

  return (
    <div className="flex items-center justify-between mb-12 relative max-w-3xl mx-auto">
      {/* Background line */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 rounded-full z-0"></div>
      
      {/* Active line progress */}
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-orange-500 rounded-full z-0 transition-all duration-500"
        style={{ 
          width: `${(steps.findIndex(s => s.id === currentStep) / (steps.length - 1)) * 100}%` 
        }}
      ></div>

      {steps.map((step) => {
        const status = getStepStatus(step.id)
        const Icon = step.icon
        
        return (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300
              ${status === 'completed' ? 'bg-green-500 text-slate-900 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : ''}
              ${status === 'active' ? 'bg-orange-500 text-slate-900 shadow-[0_0_15px_rgba(249,115,22,0.4)] ring-4 ring-orange-500/20' : ''}
              ${status === 'pending' ? 'bg-slate-800 text-slate-400 border-2 border-slate-700' : ''}
            `}>
              <Icon size={20} />
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wider
              ${status === 'completed' ? 'text-green-500' : ''}
              ${status === 'active' ? 'text-orange-500' : ''}
              ${status === 'pending' ? 'text-slate-500' : ''}
            `}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
