import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
  const { walletAddress, solBalance, totalUsdValue, tokenCount } = await req.json()

  // Check if this wallet has been seen before
  const { data: existing } = await supabase
    .from('wallets')
    .select('search_count')
    .eq('wallet_address', walletAddress)
    .single()

  if (existing) {
    // Wallet exists — update latest values and increment search count
    await supabase
      .from('wallets')
      .update({
        latest_sol_balance: solBalance,
        latest_total_usd_value: totalUsdValue,
        latest_token_count: tokenCount,
        last_seen: new Date().toISOString(),
        search_count: existing.search_count + 1,
      })
      .eq('wallet_address', walletAddress)
  } else {
    // First time seeing this wallet — insert it
    const { error: insertErr } = await supabase
      .from('wallets')
      .insert({
        wallet_address: walletAddress,
        latest_sol_balance: solBalance,
        latest_total_usd_value: totalUsdValue,
        latest_token_count: tokenCount,
      })
    if (insertErr) console.error('[snapshots] wallets insert error:', insertErr.message)
  }

  // Always record this specific search as a historical snapshot
  const { error: searchErr } = await supabase
    .from('wallet_searches')
    .insert({
      wallet_address: walletAddress,
      sol_balance: solBalance,
      total_usd_value: totalUsdValue,
      token_count: tokenCount,
    })
  if (searchErr) console.error('[snapshots] wallet_searches insert error:', searchErr.message)

  return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[snapshots] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
