'use client'

import { useEffect, useState } from 'react'

// The shape of the JSON that /api/stats returns.
interface Stats {
  count: number      // total unique wallets ever searched
  avgSol: number     // average SOL balance across all of them
  avgUsd: number     // average total USD value across all of them
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // Fetch aggregate stats from our server-side API route.
    // This runs once when the page mounts.
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => setError('Failed to load stats.'))
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="text-center pt-8">
        <h1 className="text-3xl font-bold text-sol-brown">SolChart Analytics</h1>
        <p className="text-sol-brown/50 text-sm mt-1">Aggregate data across all searched wallets</p>
      </header>

      <main className="flex-1 flex justify-center items-start pt-16 px-4">
        {error && <p className="text-red-500">{error}</p>}

        {!stats && !error && (
          <p className="text-sol-brown/50 text-sm">Loading...</p>
        )}

        {stats && (
          // Three stat cards side by side.
          // Each shows one aggregated metric from the wallets table.
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-[700px]">

            <StatCard
              label="Wallets Tracked"
              value={stats.count.toLocaleString()}
            />

            <StatCard
              label="Avg SOL Balance"
              value={`${stats.avgSol.toFixed(3)} SOL`}
            />

            <StatCard
              label="Avg Portfolio Value"
              value={`$${stats.avgUsd.toFixed(2)}`}
            />

          </div>
        )}
      </main>

      <footer className="text-center p-5 text-sol-brown/40 text-xs">
        Admin only — do not share this URL.
      </footer>
    </div>
  )
}

// Reusable card component for a single metric.
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/25 border border-[rgba(53,38,19,0.2)] rounded-[16px] p-6 flex flex-col gap-2">
      <p className="text-[11px] text-sol-brown/50 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-bold text-sol-brown">{value}</p>
    </div>
  )
}
