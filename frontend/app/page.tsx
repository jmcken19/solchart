'use client'

import { useState } from 'react'
import WalletInput from '@/components/WalletInput'
import WalletChart from '@/components/WalletChart'

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface WalletData {
  sol: number
  solUsdValue: number
  tokens: { name: string; symbol: string; mint: string; balance: number; usdValue: number }[]
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [chartGenerated, setChartGenerated] = useState(false)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [currentAddress, setCurrentAddress] = useState('')

  async function handleGenerate(address: string) {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/wallet/${address}/balance`)
      if (!res.ok) throw new Error('Failed to fetch wallet')
      const data = await res.json()
      setWalletData(data)
      setCurrentAddress(address)
      setChartGenerated(true)

      // Save snapshot to Supabase (fire and forget — don't block the UI)
      const totalUsdValue = data.solUsdValue + data.tokens.reduce((s: number, t: { usdValue: number }) => s + t.usdValue, 0)
      fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          solBalance: data.sol,
          totalUsdValue,
          tokenCount: data.tokens.length,
        }),
      }).catch(console.error)
    } catch (err) {
      console.error(err)
      alert('Could not load wallet. Check the address and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleClear() {
    setChartGenerated(false)
    setWalletData(null)
    setCurrentAddress('')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="text-center pt-8">
        <h1 onClick={handleClear} className="text-3xl font-bold text-sol-brown cursor-pointer">
          SolChart
        </h1>
      </header>

      <main className="flex-1 flex justify-center pt-12 px-4 pb-12">
        <div className="flex flex-col items-center w-full max-w-[700px]">
          <WalletInput
            onGenerate={handleGenerate}
            isLoading={isLoading}
            chartGenerated={chartGenerated}
            onClear={handleClear}
          />

          {walletData && currentAddress && (
            <WalletChart walletData={walletData} walletAddress={currentAddress} />
          )}
        </div>
      </main>

      <footer className="text-center p-5 text-sol-brown text-sm">
        © 2026 SolChart
      </footer>
    </div>
  )
}
