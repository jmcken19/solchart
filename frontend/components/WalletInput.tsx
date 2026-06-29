'use client'

import { useState } from 'react'

function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
}

interface WalletInputProps {
  onGenerate: (address: string) => void
  isLoading: boolean
  chartGenerated: boolean
  onClear: () => void
}

export default function WalletInput({ onGenerate, isLoading, chartGenerated, onClear }: WalletInputProps) {
  const [address, setAddress] = useState('')

  const hasContent = address.trim().length > 0

  function getButtonLabel() {
    if (isLoading) return 'Loading...'
    if (chartGenerated && !hasContent) return 'Clear'
    return 'Generate'
  }

  function handleClick() {
    if (chartGenerated && !hasContent) {
      onClear()
      return
    }
    if (!hasContent) {
      alert('Please enter a wallet address.')
      return
    }
    if (!isValidSolanaAddress(address.trim())) {
      alert('Please enter a valid Solana wallet address.')
      return
    }
    onGenerate(address.trim())
  }

  // Label floats up when focused OR when the input has content
  const labelFloated = hasContent
    ? '-top-5 text-[13px] text-sol-green'
    : 'top-2.5 text-base text-sol-brown'

  return (
    <div className="flex flex-col items-center gap-7">

      {/* Animated wallet address input */}
      <div className="relative w-[305px]">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="peer w-full py-2.5 pl-1.5 border-0 border-b border-sol-brown bg-transparent text-sol-brown text-[11px] tracking-[0.2px] focus:outline-none"
        />
        <label className={`absolute left-1.5 font-normal pointer-events-none transition-all duration-200 peer-focus:-top-5 peer-focus:text-[13px] peer-focus:text-sol-green ${labelFloated}`}>
          Wallet Address
        </label>
        {/* Bottom bar that expands from center on focus */}
        <span className="absolute bottom-0 left-1/2 h-0.5 w-0 bg-sol-green transition-all duration-200 peer-focus:w-1/2" />
        <span className="absolute bottom-0 right-1/2 h-0.5 w-0 bg-sol-green transition-all duration-200 peer-focus:w-1/2" />
      </div>

      <button
        onClick={handleClick}
        disabled={isLoading}
        className="px-8 py-3 border-2 border-sol-green text-sol-green font-medium text-sm tracking-wider uppercase transition-all duration-300 hover:bg-sol-green hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {getButtonLabel()}
      </button>

      <p className="text-[10px] text-sol-brown/50 text-center -mt-4 max-w-[260px] leading-relaxed">
        First load may take up to 30 seconds while the server wakes up.
      </p>

    </div>
  )
}
