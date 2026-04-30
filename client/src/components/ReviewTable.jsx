export default function ReviewTable({ 
  consumer1, 
  originalConsumer1, 
  onChange1, 
  onGenerate 
}) {
  const fields = [
    { key: 'consumer_name', label: 'Consumer Name' },
    { key: 'consumer_number', label: 'Consumer No' },
    { key: 'sanctioned_load_kw', label: 'Sanctioned Load (kW)' },
    { key: 'connection_type', label: 'Connection Type' },
    { key: 'fixed_charges', label: 'Fixed Charges' },
    { key: 'latest_bill_amount', label: 'Latest Bill Amount' },
    { key: 'latest_bill_month', label: 'Latest Bill Month' },
  ]

  const months = [
    { key: 'units_feb2025', label: 'Units Feb 2025' },
    { key: 'units_mar2025', label: 'Units Mar 2025' },
    { key: 'units_apr2025', label: 'Units Apr 2025' },
    { key: 'units_may2025', label: 'Units May 2025' },
    { key: 'units_jun2025', label: 'Units Jun 2025' },
    { key: 'units_jul2025', label: 'Units Jul 2025' },
    { key: 'units_aug2025', label: 'Units Aug 2025' },
    { key: 'units_sep2025', label: 'Units Sep 2025' },
    { key: 'units_oct2025', label: 'Units Oct 2025' },
    { key: 'units_nov2025', label: 'Units Nov 2025' },
    { key: 'units_dec2025', label: 'Units Dec 2025' },
    { key: 'units_jan2026', label: 'Units Jan 2026' },
  ]

  const allFields = [...fields, ...months]

  const handleChange = (key, value) => {
    onChange1({ ...consumer1, [key]: value })
  }

  const handleResetField = (key) => {
    onChange1({ ...consumer1, [key]: originalConsumer1[key] })
  }

  const renderInput = (consumer, originalConsumer, field) => {
    const value = consumer?.[field.key] || ''
    const originalValue = originalConsumer?.[field.key] || ''
    const isMissing = !value || value === 'null' || value === null
    const isModified = value !== originalValue

    return (
      <div className="flex flex-col gap-1 w-full max-w-xs">
        <input
          type="text"
          value={value === 'null' ? '' : value}
          onChange={(e) => handleChange(field.key, e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors
            ${isMissing 
              ? 'bg-yellow-900/40 border-yellow-500/50 text-yellow-100 placeholder-yellow-500/50' 
              : 'bg-slate-900/50 border-slate-700 text-slate-100'}`}
          placeholder={isMissing ? 'Missing data' : ''}
        />
        {isModified && (
          <button 
            onClick={() => handleResetField(field.key)}
            className="text-xs text-orange-400 hover:text-orange-300 self-start mt-1 flex items-center transition-colors"
          >
            Reset to original
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/50">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-300">Field</th>
              <th className="px-6 py-4 font-semibold text-orange-400">Extracted Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {allFields.map((field) => (
              <tr key={field.key} className="hover:bg-slate-700/20 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-400 align-top">{field.label}</td>
                <td className="px-6 py-3 align-top">
                  {renderInput(consumer1, originalConsumer1, field)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <button 
          onClick={onGenerate}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
        >
          Verify & Generate Excel
        </button>
      </div>
    </div>
  )
}
