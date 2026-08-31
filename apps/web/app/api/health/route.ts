import { NextResponse } from 'next/server';

/**
 * Route de health check — TopLuxe.
 * GET /api/health — retourne un statut 200 simple, sans dépendance externe (pas d'appel base de
 * données ni Pi Network), conformément au ticket TLX-001, point 16.
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'topluxe-web' }, { status: 200 });
}
