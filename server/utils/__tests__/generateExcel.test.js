import { describe, it, expect } from 'vitest'
import ExcelJS from 'exceljs'
import path from 'path'
import { fileURLToPath } from 'url'
import { buildExcel } from '../generateExcel.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATE_PATH = path.resolve(__dirname, '..', '..', 'templates', 'solar_load_template.xlsx')

async function loadFromBuffer(buf) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buf)
  return wb
}

async function loadTemplate() {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(TEMPLATE_PATH)
  return wb
}

const sample = {
  consumer_name: 'TEST CUSTOMER',
  consumer_number: '999999999999',
  sanctioned_load_kw: '3.30',
  connection_type: 'LT-1',
  latest_bill_amount: '1500',
  latest_bill_month: 'Jan 2026',
  units_jan2026: '95',
}

describe('buildExcel', () => {
  it('writes the customer name and number into input cells', async () => {
    const buf = await buildExcel(sample)
    const wb = await loadFromBuffer(buf)
    const ws = wb.worksheets[0]

    // Find labels and assert their value-cells.
    const find = (label) => {
      let result = null
      ws.eachRow({ includeEmpty: false }, (row) => {
        row.eachCell({ includeEmpty: false }, (cell, col) => {
          if (typeof cell.value === 'string' && cell.value.includes(label)) {
            result = row.getCell(col + 1)
          }
        })
      })
      return result
    }

    expect(find('Consumer Name').value).toBe('TEST CUSTOMER')
    expect(find('Consumer Number').value).toBe('999999999999')
    expect(find('Bill Amount').value).toBe(1500)
    expect(find('Sanctioned Load').value).toBe(3.3)
  })

  it('preserves every formula cell from the template unchanged', async () => {
    const original = await loadTemplate()
    const buf = await buildExcel(sample)
    const generated = await loadFromBuffer(buf)

    const formulasOf = (wb) => {
      const map = new Map()
      const ws = wb.worksheets[0]
      ws.eachRow({ includeEmpty: false }, (row) => {
        row.eachCell({ includeEmpty: false }, (cell) => {
          if (cell.formula) map.set(cell.address, cell.formula)
        })
      })
      return map
    }

    const before = formulasOf(original)
    const after = formulasOf(generated)

    expect(before.size).toBeGreaterThan(0) // sanity: template actually has formulas
    expect(after.size).toBe(before.size)
    for (const [addr, formula] of before) {
      expect(after.get(addr)).toBe(formula)
    }
  })

  it('clears stale template values for known input fields when no data is supplied', async () => {
    // Sample doesn't supply meter_number, so any pre-existing meter number in
    // the template should be cleared rather than leak into the output.
    const buf = await buildExcel(sample)
    const wb = await loadFromBuffer(buf)
    const ws = wb.worksheets[0]

    let meterValue = 'NOT_FOUND'
    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell, col) => {
        if (typeof cell.value === 'string' && cell.value.includes('Meter Number')) {
          const v = row.getCell(col + 1).value
          meterValue = v == null ? null : v
        }
      })
    })
    expect(meterValue).toBeNull()
  })
})
