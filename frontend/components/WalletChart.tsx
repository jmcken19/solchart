'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Filler,
  type TooltipItem,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Filler)

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Draws the disclaimer text just above the chart area directly on the canvas
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const disclaimerPlugin: any = {
  id: 'disclaimer',
  afterDraw(chart: ChartJS) {
    const { ctx, chartArea } = chart
    if (!chartArea) return
    const { left, top, width } = chartArea
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillStyle = 'rgba(53, 38, 19, 0.38)'
    ctx.font = '9px Arial, Helvetica, sans-serif'
    ctx.fillText('Prices are a snapshot and may not reflect 100% accuracy.', left + width / 2, top - 4)
    ctx.restore()
  },
}

interface WalletData {
  sol: number
  solUsdValue: number
  tokens: { name: string; symbol: string; mint: string; balance: number; usdValue: number }[]
}

interface HistoryPoint {
  timestamp: string
  totalUsd: number
}

interface WalletChartProps {
  walletData: WalletData
  walletAddress: string
}

export default function WalletChart({ walletData, walletAddress }: WalletChartProps) {
  const [view, setView] = useState<'holdings' | 'history'>('holdings')
  const [period, setPeriod] = useState<'1W' | '1M' | '3M'>('1W')
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const totalTokenUsd = walletData.tokens.reduce((sum, t) => sum + (t.usdValue || 0), 0)
  const totalUsd = walletData.solUsdValue + totalTokenUsd

  const fetchHistory = useCallback(async (p: string) => {
    setHistoryLoading(true)
    try {
      const res = await fetch(
        `${API_URL}/api/wallet/${walletAddress}/history?period=${p}&sol=${walletData.sol}&tokenUsd=${totalTokenUsd}`
      )
      const data = await res.json()
      setHistoryData(data)
    } catch (e) {
      console.error('History fetch error:', e)
    } finally {
      setHistoryLoading(false)
    }
  }, [walletAddress, walletData.sol, totalTokenUsd])

  useEffect(() => {
    if (view === 'history') fetchHistory(period)
  }, [view, period, fetchHistory])

  // --- Holdings bar chart ---
  const holdingItems = [
    { label: 'SOL', value: walletData.solUsdValue },
    ...walletData.tokens
      .filter(t => t.usdValue > 0)
      .map(t => ({ label: t.symbol, value: t.usdValue })),
  ]

  const holdingsData = {
    labels: holdingItems.map(i => i.label),
    datasets: [{
      data: holdingItems.map(i => i.value),
      backgroundColor: holdingItems.map((_, idx) => idx === 0 ? '#68C46E' : '#A8AD52'),
      borderRadius: 4,
    }],
  }

  const holdingsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 18 } },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: TooltipItem<'bar'>) => `$${(ctx.parsed.y ?? 0).toFixed(2)}` } },
    },
    scales: {
      y: { ticks: { callback: (v: string | number) => `$${v}` } },
    },
  }

  // --- History line chart ---
  const historyChartData = {
    labels: historyData.map(p => {
      const d = new Date(p.timestamp)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [{
      data: historyData.map(p => p.totalUsd),
      borderColor: '#68C46E',
      backgroundColor: 'rgba(104, 196, 110, 0.12)',
      fill: true,
      tension: 0.3,
      pointRadius: 0,
    }],
  }

  const historyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 18 } },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: TooltipItem<'line'>) => `$${(ctx.parsed.y ?? 0).toFixed(2)}` } },
    },
    scales: {
      x: { ticks: { maxTicksLimit: 6 } },
      y: { ticks: { callback: (v: string | number) => `$${v}` } },
    },
  }

  return (
    <div className="mt-12 w-full max-w-[700px]">

      {/* Holdings / History toggle */}
      <div className="flex justify-center mb-4">
        <div className="flex bg-[rgba(53,38,19,0.1)] rounded-[20px] p-1">
          {(['holdings', 'history'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-[22px] py-1.5 rounded-[16px] text-[13px] font-medium tracking-[0.3px] transition-all duration-200 capitalize cursor-pointer ${
                view === v
                  ? 'bg-sol-green text-white'
                  : 'text-sol-brown hover:bg-[rgba(53,38,19,0.08)]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Period toggle — only visible on History view */}
      {view === 'history' && (
        <div className="flex justify-center gap-1 mb-4">
          {(['1W', '1M', '3M'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-0.5 rounded-[12px] text-[11px] tracking-[0.3px] border transition-all duration-200 cursor-pointer ${
                period === p
                  ? 'bg-sol-olive text-white border-sol-olive'
                  : 'text-sol-brown border-[rgba(53,38,19,0.2)] hover:bg-[rgba(53,38,19,0.08)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Chart card */}
      <div className="relative w-full h-[350px] bg-white/25 border border-[rgba(53,38,19,0.2)] rounded-[16px] p-6">

        {/* Total USD badge */}
        <div className="absolute top-4 right-5 text-[13px] font-bold text-sol-brown bg-[rgba(242,231,217,0.82)] border border-[rgba(53,38,19,0.12)] rounded-lg px-2.5 py-1 pointer-events-none z-10">
          ${totalUsd.toFixed(2)}
        </div>

        {view === 'holdings' && (
          <Bar data={holdingsData} options={holdingsOptions} plugins={[disclaimerPlugin]} />
        )}

        {view === 'history' && historyLoading && (
          <div className="flex items-center justify-center h-full text-sol-brown/50 text-sm">
            Loading...
          </div>
        )}

        {view === 'history' && !historyLoading && historyData.length > 0 && (
          <Line data={historyChartData} options={historyOptions} plugins={[disclaimerPlugin]} />
        )}

      </div>
    </div>
  )
}
