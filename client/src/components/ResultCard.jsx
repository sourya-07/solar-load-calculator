const MONTH_KEYS = [
  'units_feb2025', 'units_mar2025', 'units_apr2025', 'units_may2025',
  'units_jun2025', 'units_jul2025', 'units_aug2025', 'units_sep2025',
  'units_oct2025', 'units_nov2025', 'units_dec2025', 'units_jan2026',
]

function summarize(consumer) {
  if (!consumer) return null
  const values = MONTH_KEYS
    .map(k => parseFloat(consumer[k]))
    .filter(v => Number.isFinite(v) && v >= 0)
  const total = values.reduce((s, v) => s + v, 0)
  const avg = values.length ? total / values.length : 0
  return { total, avg, monthsWithData: values.length }
}

export default function ResultCard({ consumer1 }) {
  const summary = summarize(consumer1)
  if (!consumer1 || !summary) return null

  const Stat = ({ label, value, subtext }) => (
    <div className="border-l-[1.5px] border-ink first:border-l-0 px-6 py-7">
      <div className="micro text-ink/60 mb-2">{label}</div>
      <div className="display-h1 text-3xl sm:text-4xl text-ink mb-1">{value}</div>
      {subtext && <div className="text-xs text-ink/60">{subtext}</div>}
    </div>
  )

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] border-b-[1.5px] border-ink">
        <div className="relative border-r-0 md:border-r-[1.5px] border-ink px-8 py-12 overflow-hidden flex items-center justify-center min-h-[180px]">
          <div className="pink-blob absolute inset-0" />
          <span className="relative font-display text-[120px] leading-none font-extrabold text-ink">✱</span>
        </div>
        <div className="px-8 py-12">
          <div className="micro text-ink/60 mb-3">step 4 · download</div>
          <h2 className="display-h1 text-5xl sm:text-6xl mb-4">
            excel ready.
          </h2>
          <p className="text-ink/70 max-w-xl leading-relaxed">
            Your solar load report for{' '}
            <span className="font-display font-bold text-ink">{consumer1.consumer_name || 'this customer'}</span>{' '}
            has been generated using the official Energybae template. Recommended capacity, panel
            count and projected savings live inside the file — open it to view.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3">
        <Stat
          label="avg monthly"
          value={`${Math.round(summary.avg)} units`}
          subtext={`${summary.monthsWithData} of 12 months`}
        />
        <Stat
          label="latest bill"
          value={consumer1.latest_bill_amount ? `₹${Number(consumer1.latest_bill_amount).toLocaleString('en-IN')}` : '—'}
          subtext={consumer1.latest_bill_month || ''}
        />
        <Stat
          label="sanctioned load"
          value={consumer1.sanctioned_load_kw ? `${consumer1.sanctioned_load_kw} kW` : '—'}
          subtext={consumer1.connection_type || ''}
        />
      </div>
    </div>
  )
}
