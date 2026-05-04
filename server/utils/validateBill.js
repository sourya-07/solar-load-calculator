const MONTH_KEYS = [
  'units_feb2025', 'units_mar2025', 'units_apr2025', 'units_may2025',
  'units_jun2025', 'units_jul2025', 'units_aug2025', 'units_sep2025',
  'units_oct2025', 'units_nov2025', 'units_dec2025', 'units_jan2026',
]

function toNumberOrNaN(v) {
  if (v == null || v === '' || v === 'null') return NaN
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : NaN
}

function median(arr) {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function validateConsumer(consumer) {
  const errors = []
  const warnings = []

  if (!consumer || typeof consumer !== 'object') {
    return { ok: false, errors: ['Missing consumer data.'], warnings: [] }
  }

  if (!consumer.consumer_number || String(consumer.consumer_number).trim() === '') {
    errors.push('Consumer Number is missing — extraction must read it from the bill.')
  }

  const monthValues = []
  const missingMonths = []
  for (const key of MONTH_KEYS) {
    const raw = consumer[key]
    if (raw == null || raw === '' || raw === 'null') {
      missingMonths.push(key)
      continue
    }
    const n = toNumberOrNaN(raw)
    if (!Number.isFinite(n)) {
      errors.push(`${key} is not a number ("${raw}").`)
      continue
    }
    if (n < 0) {
      errors.push(`${key} is negative (${n}); units cannot be negative.`)
      continue
    }
    monthValues.push({ key, value: n })
  }

  const populated = monthValues.filter(m => m.value > 0)
  if (populated.length === 0) {
    errors.push('All 12 monthly units are zero or missing — cannot size a solar system.')
  }

  // Warnings — non-fatal, surfaced in UI for the user to verify.
  if (missingMonths.length >= 3 && populated.length > 0) {
    warnings.push(
      `${missingMonths.length} month(s) have missing data. Verify or correct before generating: ${missingMonths.join(', ')}.`
    )
  }

  if (populated.length >= 3) {
    const med = median(populated.map(m => m.value))
    for (const { key, value } of populated) {
      if (value > med * 3 || (value < med / 3 && value > 0)) {
        warnings.push(
          `${key} = ${value} is far from the median (${med}). Likely OCR error — verify the bill.`
        )
      }
    }
  }

  // Sanctioned-load sanity check. MSEDCL net-metering caps rooftop solar at the
  // sanctioned load. Use a rough avg-units / 135 estimate (PSH * days) just to
  // detect oversized recommendations — the actual sizing is left to the template.
  const sanctioned = toNumberOrNaN(consumer.sanctioned_load_kw)
  if (Number.isFinite(sanctioned) && sanctioned > 0 && populated.length) {
    const avg = populated.reduce((s, m) => s + m.value, 0) / populated.length
    const impliedKw = avg / 135
    if (impliedKw > sanctioned * 1.05) {
      warnings.push(
        `Average consumption implies ~${impliedKw.toFixed(2)} kW system, exceeding the sanctioned load of ${sanctioned} kW. MSEDCL net-metering caps solar at sanctioned load.`
      )
    }
  }

  return { ok: errors.length === 0, errors, warnings }
}
