import { Download, Zap, Sun, IndianRupee } from 'lucide-react'

export default function ResultCard({ consumer1 }) {
  const calculateMetrics = (consumer) => {
    if (!consumer) return null

    const months = [
      'units_feb2025', 'units_mar2025', 'units_apr2025', 'units_may2025',
      'units_jun2025', 'units_jul2025', 'units_aug2025', 'units_sep2025',
      'units_oct2025', 'units_nov2025', 'units_dec2025', 'units_jan2026'
    ]

    const totalUnits = months.reduce((sum, m) => sum + (parseFloat(consumer[m]) || 0), 0)
    const avgUnits = totalUnits / 12

    const kw = avgUnits / (4.5 * 30)
    const panels = kw / 0.6
    const capacity = Math.round(panels * 0.6 * 10) / 10
    const numPanels = Math.ceil(panels)
    
    return { avgUnits, kw, panels, capacity, numPanels }
  }

  const m1 = calculateMetrics(consumer1)

  const monthlySavings = Math.round(m1.avgUnits * 8) // ₹8 per unit avg

  const MetricCard = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-xl flex items-center gap-4">
      <div className={`p-4 rounded-full ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-500 mb-6">
          <Download size={40} />
        </div>
        <h2 className="text-3xl font-bold mb-2">Excel Generated Successfully!</h2>
        <p className="text-slate-400">Your solar load analysis for {consumer1.consumer_name} is ready.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard 
          title="System Size" 
          value={`${m1.capacity.toFixed(1)} kW`}
          subtext={`Recommended capacity`}
          icon={Zap}
          color="bg-orange-500"
        />
        <MetricCard 
          title="Solar Panels" 
          value={`${m1.numPanels} Panels`}
          subtext={`600W panels needed`}
          icon={Sun}
          color="bg-blue-500"
        />
        <MetricCard 
          title="Est. Monthly Savings" 
          value={`₹${monthlySavings.toLocaleString()}`}
          subtext={`At avg ₹8/unit rate`}
          icon={IndianRupee}
          color="bg-green-500"
        />
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 mt-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Average Monthly Consumption</span>
          <span className="font-medium text-xl text-white">{Math.round(m1.avgUnits)} units</span>
        </div>
    </div>
  )
}
