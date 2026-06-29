'use client'

// 'use client' is needed because this page uses useState and handles user input.
// Server components can't do that — they have no access to browser APIs.

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    // Prevent the browser from doing a full page reload on form submit.
    e.preventDefault()
    setLoading(true)
    setError('')

    // POST the password to our API route (/app/api/auth/route.ts).
    // If it matches DASHBOARD_PASSWORD, the server sets the dash_token cookie
    // automatically in the response — we don't touch it here.
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      // Cookie is now set. Navigate to the dashboard.
      // The middleware will see the cookie and allow access.
      router.push('/dashboard')
    } else {
      setError('Incorrect password.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-sol-brown mb-8">Admin Dashboard</h1>

      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5 w-[260px]">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border-b border-sol-brown bg-transparent py-2 px-1 text-sol-brown focus:outline-none text-sm"
        />

        {/* Show an error message if the password was wrong */}
        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 border-2 border-sol-green text-sol-green font-medium text-sm tracking-wider uppercase transition-all duration-300 hover:bg-sol-green hover:text-white disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
