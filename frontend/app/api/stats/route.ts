import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/stats
// Called by the dashboard page to fetch aggregate wallet data.
// Because this is a Next.js Route Handler (server-side), Supabase
// credentials never leave the server.
export async function GET() {
  // Pull every row's SOL balance and total USD value from the wallets table.
  // Each row = one unique wallet address that has ever been searched.
  const { data, error } = await supabase
    .from('wallets')
    .select('latest_sol_balance, latest_total_usd_value')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const count = data.length

  // If nobody has searched a wallet yet, return zeroes so the UI doesn't crash.
  if (count === 0) {
    return NextResponse.json({ count: 0, avgSol: 0, avgUsd: 0 })
  }

  // Add up all the values then divide by the number of wallets to get averages.
  const avgSol = data.reduce((sum, row) => sum + (row.latest_sol_balance ?? 0), 0) / count
  const avgUsd = data.reduce((sum, row) => sum + (row.latest_total_usd_value ?? 0), 0) / count

  return NextResponse.json({ count, avgSol, avgUsd })
}
