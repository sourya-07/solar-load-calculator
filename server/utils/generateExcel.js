import ExcelJS from 'exceljs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATE_PATH = path.resolve(__dirname, '..', 'templates', 'solar_load_template.xlsx')

// Normalize label text for matching: strip whitespace, punctuation, lowercase.
function norm(s) {
  if (s == null) return ''
  return String(s).toLowerCase().replace(/[\s:_\- ().]+/g, '')
}

function getCellText(cell) {
  const v = cell.value
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (v.richText) return v.richText.map(r => r.text || '').join('')
  if (v.text) return String(v.text)
  if (v.formula) return ''
  if (v.result != null) return String(v.result)
  return ''
}

function toNumberOrNull(v) {
  if (v == null || v === '') return null
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : null
}

// Lightweight kind inference based on the normalized label, used purely for
// styling (number format + alignment) of the cells we write to.
function inferKind(normLabel) {
  if (normLabel.includes('amount') || normLabel.includes('charges')) return 'currency'
  if (normLabel.includes('units')) return 'integer'
  if (normLabel.includes('load') || normLabel.includes('demand')) return 'decimal'
  if (normLabel.includes('month')) return 'text'
  return 'text'
}

function applyInputStyle(cell, kind) {
  cell.font = {
    name: 'Inter',
    size: 11,
    color: { argb: 'FF1A2421' },
  }
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF6FADE' }, // soft lime tint — matches the app cream/lime palette
  }
  cell.alignment = {
    vertical: 'middle',
    horizontal: (kind === 'currency' || kind === 'integer' || kind === 'decimal') ? 'right' : 'left',
    wrapText: true,
    indent: 1,
  }
  cell.border = {
    top:    { style: 'thin', color: { argb: 'FFD9DEC4' } },
    bottom: { style: 'thin', color: { argb: 'FFD9DEC4' } },
    left:   { style: 'thin', color: { argb: 'FFD9DEC4' } },
    right:  { style: 'thin', color: { argb: 'FFD9DEC4' } },
  }
  if (kind === 'currency')      cell.numFmt = '"₹"#,##0.00;[Red]-"₹"#,##0.00'
  else if (kind === 'decimal')  cell.numFmt = '#,##0.00'
  else if (kind === 'integer')  cell.numFmt = '#,##0'
}

function buildFieldMap(consumer) {
  const months = [
    'jan2026', 'dec2025', 'nov2025', 'oct2025', 'sep2025', 'aug2025',
    'jul2025', 'jun2025', 'may2025', 'apr2025', 'mar2025', 'feb2025',
  ]
  const latestMonthValue = () => {
    for (const m of months) {
      const v = toNumberOrNull(consumer[`units_${m}`])
      if (v != null && v > 0) return v
    }
    return null
  }

  const map = {}
  const set = (label, value) => { map[norm(label)] = value }

  set('Consumer Name', consumer.consumer_name)
  set('Consumer Number', consumer.consumer_number)
  set('Consumer No', consumer.consumer_number)
  set('Billing Month', consumer.latest_bill_month)
  set('Latest Bill Month', consumer.latest_bill_month)
  set('Tariff Type', consumer.connection_type)
  set('Connection Type', consumer.connection_type)
  set('Bill Amount (INR)', toNumberOrNull(consumer.latest_bill_amount))
  set('Latest Bill Amount', toNumberOrNull(consumer.latest_bill_amount))
  set('Bill Amount', toNumberOrNull(consumer.latest_bill_amount))
  set('Sanctioned Load (kW)', toNumberOrNull(consumer.sanctioned_load_kw))
  set('Sanct. Load (kW)', toNumberOrNull(consumer.sanctioned_load_kw))
  set('Connected Load (kW)', toNumberOrNull(consumer.sanctioned_load_kw))
  set('Fixed Charges', toNumberOrNull(consumer.fixed_charges))
  set('Units Consumed (kWh)', latestMonthValue())

  // Known input labels we don't currently extract. Mapped to null so that
  // any prior sample data in the template gets cleared rather than leaking
  // into a new customer's output.
  set('Meter Number', null)
  set('Contract Demand (kVA)', null)
  set('Contract Demand', null)

  const monthLabels = {
    feb2025: ['Units Feb 2025', 'Feb 2025', 'February 2025'],
    mar2025: ['Units Mar 2025', 'Mar 2025', 'March 2025'],
    apr2025: ['Units Apr 2025', 'Apr 2025', 'April 2025'],
    may2025: ['Units May 2025', 'May 2025'],
    jun2025: ['Units Jun 2025', 'Jun 2025', 'June 2025'],
    jul2025: ['Units Jul 2025', 'Jul 2025', 'July 2025'],
    aug2025: ['Units Aug 2025', 'Aug 2025', 'August 2025'],
    sep2025: ['Units Sep 2025', 'Sep 2025', 'September 2025'],
    oct2025: ['Units Oct 2025', 'Oct 2025', 'October 2025'],
    nov2025: ['Units Nov 2025', 'Nov 2025', 'November 2025'],
    dec2025: ['Units Dec 2025', 'Dec 2025', 'December 2025'],
    jan2026: ['Units Jan 2026', 'Jan 2026', 'January 2026'],
  }
  for (const [key, labels] of Object.entries(monthLabels)) {
    const v = toNumberOrNull(consumer[`units_${key}`])
    for (const lbl of labels) set(lbl, v)
  }

  return map
}

export async function buildExcel(consumer1) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(TEMPLATE_PATH)

  // Force Excel to recompute formulas on open so derived cells refresh.
  wb.calcProperties = wb.calcProperties || {}
  wb.calcProperties.fullCalcOnLoad = true

  const ws = wb.worksheets[0]
  if (!ws) throw new Error('Template has no worksheets')

  // Hide Excel's default gridlines so empty cells don't appear as fake "extra
  // columns". Our styled input cells still show their own explicit borders,
  // giving the data area a clean tabular look against a flat background.
  ws.views = [{ ...(ws.views?.[0] || {}), showGridLines: false }]

  const fieldMap = buildFieldMap(consumer1)
  const queued = []
  const skipped = []

  // Two-pass: collect candidate writes first, then apply.
  // Re-visiting a cell we just wrote to could otherwise match it as a label
  // (e.g., a written billing month "Jan 2026" colliding with a month-units label).
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: false }, (labelCell, colNumber) => {
      const text = getCellText(labelCell)
      // Treat as a label only if the cell text carries a colon or sits in column A —
      // raw values like "Jan 2026" then aren't mistaken for labels.
      if (!text.includes(':') && colNumber !== 1) return

      const key = norm(text)
      if (!key || !Object.prototype.hasOwnProperty.call(fieldMap, key)) return

      // value === undefined would mean unknown label (already filtered above).
      // null or '' means "known label, no data" — clear the target cell so
      // sample data baked into the template doesn't leak into a new output.
      const raw = fieldMap[key]
      const writeValue = (raw === null || raw === '') ? null : raw

      const targetCell = row.getCell(colNumber + 1)
      if (targetCell.formula) {
        skipped.push({ at: targetCell.address, reason: 'formula', label: key })
        return
      }
      queued.push({ cell: targetCell, value: writeValue, label: key })
    })
  })

  const writes = []
  const styledRows = new Set()
  const inputCols = new Set()
  const labelCols = new Set()
  for (const { cell, value, label } of queued) {
    cell.value = value
    applyInputStyle(cell, inferKind(label))
    // Give the row a comfortable height so wrapped text isn't crammed.
    // Only nudge upward — never shrink an existing taller row from the template.
    const row = ws.getRow(cell.row)
    if (!styledRows.has(cell.row)) {
      const MIN_HEIGHT = 26
      if (!row.height || row.height < MIN_HEIGHT) row.height = MIN_HEIGHT
      styledRows.add(cell.row)
    }
    inputCols.add(cell.col)
    if (cell.col > 1) labelCols.add(cell.col - 1)
    writes.push({ at: cell.address, label, value })
  }

  // Widen the label and input columns we touched so text doesn't truncate
  // ("Consumer Na…") or wrap mid-word ("RANJA / NA"). Only nudge upward —
  // if the template already set a wider column, leave it alone.
  const MIN_LABEL_WIDTH = 28
  const MIN_INPUT_WIDTH = 24
  for (const c of labelCols) {
    const col = ws.getColumn(c)
    if (!col.width || col.width < MIN_LABEL_WIDTH) col.width = MIN_LABEL_WIDTH
  }
  for (const c of inputCols) {
    const col = ws.getColumn(c)
    if (!col.width || col.width < MIN_INPUT_WIDTH) col.width = MIN_INPUT_WIDTH
  }

  if (writes.length === 0) {
    console.warn('[generateExcel] No template cells matched extracted fields. Template path:', TEMPLATE_PATH)
  } else {
    console.log(`[generateExcel] Wrote ${writes.length} cells, skipped ${skipped.length} formula-protected`)
  }

  return await wb.xlsx.writeBuffer()
}
