import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// We never store the raw password in a cookie — we store a hash of it instead.
// This way even if someone inspects their own cookies they can't reverse it.
// The secret suffix ('solchart-dash-v1') makes the hash unique to this app.
function makeToken(password: string) {
  return crypto.createHash('sha256').update(password + 'solchart-dash-v1').digest('hex')
}

// POST /api/auth
// Receives { password } from the login form.
// Checks it against the DASHBOARD_PASSWORD environment variable.
export async function POST(req: NextRequest) {
  const { password } = await req.json()

  // process.env.DASHBOARD_PASSWORD is a server-only env var — you'll add this
  // to .env.local and to Vercel's dashboard in a later step.
  const correct = process.env.DASHBOARD_PASSWORD

  if (!correct || password !== correct) {
    // Return 401 so the login form knows to show an "Invalid password" message.
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })

  // Set an httpOnly cookie that lasts 7 days.
  // httpOnly = JavaScript on the page cannot read this cookie (XSS protection).
  // sameSite: 'strict' = only sent to your own domain (CSRF protection).
  res.cookies.set('dash_token', makeToken(correct), {
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // seconds → 7 days
  })

  return res
}
