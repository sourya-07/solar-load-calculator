const STEPS = [
  { id: 'upload',     label: 'upload' },
  { id: 'processing', label: 'extract' },
  { id: 'review',     label: 'review' },
  { id: 'done',       label: 'download' },
]

export default function StatusStepper({ currentStep }) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 border-t-[1.5px] border-ink">
      {STEPS.map((step, i) => {
        const isActive = i === currentIndex
        const isDone = i < currentIndex
        return (
          <div
            key={step.id}
            className={`relative border-l-[1.5px] border-ink first:border-l-0 px-5 py-6 overflow-hidden ${
              isActive ? '' : ''
            }`}
          >
            {isActive && (
              <div className="absolute -left-6 -top-4 w-44 h-20 pink-highlight blur-xl opacity-90 pointer-events-none" />
            )}
            <span className="absolute top-3 right-3 font-display font-bold text-xl text-ink">↗</span>
            <div className="relative">
              <div className="micro text-ink/50 mb-1">step {i + 1}</div>
              <div className={`display-label text-2xl ${isDone ? 'line-through decoration-2 text-ink/50' : 'text-ink'}`}>
                {step.label}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
