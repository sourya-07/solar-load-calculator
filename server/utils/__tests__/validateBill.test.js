import { describe, it, expect } from 'vitest'
import { validateConsumer } from '../validateBill.js'

const MONTH_KEYS = [
  'units_feb2025', 'units_mar2025', 'units_apr2025', 'units_may2025',
  'units_jun2025', 'units_jul2025', 'units_aug2025', 'units_sep2025',
  'units_oct2025', 'units_nov2025', 'units_dec2025', 'units_jan2026',
]

function makeConsumer(overrides = {}) {
  const base = {
    consumer_name: 'TEST CUSTOMER',
    consumer_number: '123456789012',
    sanctioned_load_kw: '5',
    connection_type: 'LT-1',
    latest_bill_amount: '1500',
    latest_bill_month: 'Jan 2026',
  }
  for (const k of MONTH_KEYS) base[k] = '200'
  return { ...base, ...overrides }
}

describe('validateConsumer', () => {
  it('passes a typical bill with no warnings', () => {
    const r = validateConsumer(makeConsumer())
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
    expect(r.warnings).toEqual([])
  })

  it('hard-fails when all monthly units are zero', () => {
    const zeroed = Object.fromEntries(MONTH_KEYS.map(k => [k, '0']))
    const r = validateConsumer(makeConsumer(zeroed))
    expect(r.ok).toBe(false)
    expect(r.errors.some(e => /zero or missing/i.test(e))).toBe(true)
  })

  it('hard-fails when consumer_number is missing', () => {
    const r = validateConsumer(makeConsumer({ consumer_number: '' }))
    expect(r.ok).toBe(false)
    expect(r.errors.some(e => /Consumer Number/.test(e))).toBe(true)
  })

  it('hard-fails on negative units', () => {
    const r = validateConsumer(makeConsumer({ units_jul2025: '-50' }))
    expect(r.ok).toBe(false)
    expect(r.errors.some(e => /negative/i.test(e))).toBe(true)
  })

  it('hard-fails on non-numeric units', () => {
    const r = validateConsumer(makeConsumer({ units_jul2025: 'abc' }))
    expect(r.ok).toBe(false)
    expect(r.errors.some(e => /not a number/i.test(e))).toBe(true)
  })

  it('warns when 3+ months have missing data', () => {
    const r = validateConsumer(makeConsumer({
      units_feb2025: null,
      units_mar2025: '',
      units_apr2025: 'null',
    }))
    expect(r.ok).toBe(true)
    expect(r.warnings.some(w => /missing data/i.test(w))).toBe(true)
  })

  it('warns on a month that is far above the median', () => {
    const r = validateConsumer(makeConsumer({ units_jul2025: '5000' }))
    expect(r.ok).toBe(true)
    expect(r.warnings.some(w => /far from the median/i.test(w))).toBe(true)
  })

  it('warns when implied system size exceeds sanctioned load', () => {
    // avg = 1000 → implied ≈ 7.4 kW; sanctioned = 3 kW → warning
    const overrides = Object.fromEntries(MONTH_KEYS.map(k => [k, '1000']))
    const r = validateConsumer(makeConsumer({ ...overrides, sanctioned_load_kw: '3' }))
    expect(r.ok).toBe(true)
    expect(r.warnings.some(w => /sanctioned load/i.test(w))).toBe(true)
  })

  it('returns a clean error shape when consumer is null', () => {
    const r = validateConsumer(null)
    expect(r.ok).toBe(false)
    expect(r.errors.length).toBeGreaterThan(0)
    expect(r.warnings).toEqual([])
  })
})
