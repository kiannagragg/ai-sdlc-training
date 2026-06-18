import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NEXT_PUBLIC_ENV,
    },
    { status: 200 },
  );
}
