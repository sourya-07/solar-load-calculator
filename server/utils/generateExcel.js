import xlsx from "xlsx"

export function buildExcel(c1, c2) {
  const months = [
    ["February 2025", c1.units_feb2025, "", "", c2?.units_feb2025],
    ["March 2025",    c1.units_mar2025, "", "", c2?.units_mar2025],
    ["April 2025",    c1.units_apr2025, "", "", c2?.units_apr2025],
    ["May 2025",      c1.units_may2025, "", "", c2?.units_may2025],
    ["June 2025",     c1.units_jun2025, "", "", c2?.units_jun2025],
    ["July 2025",     c1.units_jul2025, "", "", c2?.units_jul2025],
    ["August 2025",   c1.units_aug2025, "", "", c2?.units_aug2025],
    ["September 2025",c1.units_sep2025, "", "", c2?.units_sep2025],
    ["October 2025",  c1.units_oct2025, "", "", c2?.units_oct2025],
    ["November 2025", c1.units_nov2025, "", "", c2?.units_nov2025],
    ["December 2025", c1.units_dec2025, "", "", c2?.units_dec2025],
    ["January 2026",  c1.units_jan2026, c1.latest_bill_amount, "", c2?.units_jan2026, c2?.latest_bill_amount],
  ]

  // Calculate values
  const avg1 = months.reduce((s,m) => s + (parseFloat(m[1])||0), 0) / 12
  const avg2 = months.reduce((s,m) => s + (parseFloat(m[4])||0), 0) / 12
  const kw1 = avg1 / (4.5 * 30)
  const kw2 = avg2 / (4.5 * 30)
  const panels1 = kw1 / 0.6
  const panels2 = kw2 / 0.6
  const cap1 = Math.round(panels1 * 0.6 * 10) / 10
  const cap2 = Math.round(panels2 * 0.6 * 10) / 10
  const numPanels1 = Math.ceil(panels1)
  const numPanels2 = Math.ceil(panels2)

  const data = [
    ["", "Consumer Name", "", c1.consumer_name, "", "", "", c2?.consumer_name || ""],
    ["", "Consumer No", "", c1.consumer_number, "", "", "", c2?.consumer_number || ""],
    ["", "Fixed Charges", "", c1.fixed_charges, "", "", "", c2?.fixed_charges || ""],
    ["", "Sanct. Load (kW)", "", c1.sanctioned_load_kw, "", "", "", c2?.sanctioned_load_kw || ""],
    ["", "Connection Type", "", c1.connection_type, "", "", "", c2?.connection_type || ""],
    ["", "Contract Demand (KVA)"],
    ["", "Solar Panel used", 600],
    ["", "Sr.No", "Month", "Units", "Bill Amount", "Unit Cost", "Month", "Units", "Bill Amount", "Unit Cost"],
    ...months.map((m, i) => ["", i+2, m[0], m[1], m[2]||"", "", m[0], m[4]||"", m[5]||"", ""]),
    [],
    ["", "", "Average", avg1.toFixed(2), c1.latest_bill_amount, "", "Average", avg2.toFixed(2), c2?.latest_bill_amount || ""],
    ["", "", "kW", kw1.toFixed(4), "", "", "kW", kw2.toFixed(4)],
    ["", "", "Solar Panels", panels1.toFixed(4), "", "", "Solar Panels", panels2.toFixed(4)],
    ["", "", "Solar capacity", cap1, "", "", "Solar capacity", cap2],
    ["", "", "Number of Panels", numPanels1, "", "", "Number of Panels", numPanels2],
    [],
    [],
    [],
    ["", "", "Total solar capacity", cap1 + cap2],
    ["", "", "Number of solar panels", numPanels1 + numPanels2],
  ]

  const ws = xlsx.utils.aoa_to_sheet(data)
  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, ws, "Solar Analysis")
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" })
}
