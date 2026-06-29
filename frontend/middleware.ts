import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// This file runs on the Edge (before any page or API route loads).
// Next.js automatically picks it up because it's named middleware.ts
// and lives in the root of the frontend/ folder.

function makeToken(password: string) {
  // Must match the same function in /app/api/auth/route.ts
  return crypto.createHash('sha256').update(password + 'solchart-dash-v1').digest('hex')
}

export function middleware(req: NextRequest) {
  const correct = process.env.DASHBOARD_PASSWORD

  // Build the expected token from the env var so we can compare it to
  // the token stored in the visitor's cookie.
  const expected = correct ? makeToken(correct) : null

  // Read the dash_token cookie that was set when the user logged in.
  const token = req.cookies.get('dash_token')?.value

  // If there's no valid match, send them to the login page instead.
  if (!expected || token !== expected) {
    return NextResponse.redirect(new URL('/dashboard/login', req.url))
  }

  // Cookie is valid — let the request through to the dashboard page.
  return NextResponse.next()
}

// Tell Next.js to ONLY run this middleware on the /dashboard route.
// Without this config it would run on every single request (very slow).
export const config = {
  matcher: ['/dashboard'],
}
