const MONTH_NAMES = {
  jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun',
  jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec',
}
const MONTH_ORDER = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }

function parseUnitsKey(key) {
  const m = key.match(/^units_([a-z]{3})(\d{4})$/i)
  if (!m) return null
  const mon = m[1].toLowerCase()
  const year = parseInt(m[2], 10)
  if (!MONTH_NAMES[mon] || !Number.isFinite(year)) return null
  return { key, label: `${MONTH_NAMES[mon]} ${year}`, sortKey: year * 100 + MONTH_ORDER[mon] }
}

function deriveMonthFields(consumer) {
  if (!consumer) return []
  return Object.keys(consumer)
    .map(parseUnitsKey)
    .filter(Boolean)
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ key, label }) => ({ key, label }))
}

export default function ReviewTable({
  consumer1,
  originalConsumer1,
  onChange1,
  onGenerate,
}) {
  const fields = [
    { key: 'consumer_name',      label: 'Consumer Name' },
    { key: 'consumer_number',    label: 'Consumer No.' },
    { key: 'sanctioned_load_kw', label: 'Sanctioned Load (kW)' },
    { key: 'connection_type',    label: 'Connection Type' },
    { key: 'fixed_charges',      label: 'Fixed Charges' },
    { key: 'latest_bill_amount', label: 'Latest Bill Amount' },
    { key: 'latest_bill_month',  label: 'Latest Bill Month' },
  ]
  const months = deriveMonthFields(consumer1)

  const handleChange = (key, value) => onChange1({ ...consumer1, [key]: value })
  const handleResetField = (key) => onChange1({ ...consumer1, [key]: originalConsumer1[key] })

  const Field = ({ field }) => {
    const value = consumer1?.[field.key] ?? ''
    const original = originalConsumer1?.[field.key] ?? ''
    const isMissing = !value || value === 'null' || value === null
    const isModified = String(value) !== String(original)
    return (
      <div className="flex flex-col gap-1">
        <label className="micro text-ink/60">{field.label}</label>
        <input
          type="text"
          value={value === 'null' ? '' : value}
          onChange={(e) => handleChange(field.key, e.target.value)}
          className={`field-input font-display font-semibold text-lg ${isMissing ? 'is-missing' : ''}`}
          placeholder={isMissing ? 'missing' : ''}
        />
        {isModified && (
          <button
            onClick={() => handleResetField(field.key)}
            className="text-[10px] uppercase tracking-widest text-ink/50 hover:text-ink self-start mt-0.5"
          >
            ↺ reset to original
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="border-b-[1.5px] border-ink px-8 py-8">
        <div className="micro text-ink/60 mb-2">consumer details</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
          {fields.map((field) => <Field key={field.key} field={field} />)}
        </div>
      </div>

      <div className="border-b-[1.5px] border-ink px-8 py-8">
        <div className="micro text-ink/60 mb-2">monthly consumption — units</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-4">
          {months.map((field) => <Field key={field.key} field={field} />)}
        </div>
      </div>

      <div className="px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-ink/70 max-w-lg">
          Verify the values above. The downloaded Excel uses the official Energybae template — its
          built-in formulas calculate recommended capacity from your inputs.
        </p>
        <button onClick={onGenerate} className="btn-primary text-base">
          generate excel <span className="text-lg">↗</span>
        </button>
      </div>
    </div>
  )
}
