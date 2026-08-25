import { NextRequest, NextResponse } from 'next/server';
import { testUserApiKey } from '@/lib/ai-service';
import { AIProviderId } from '@/lib/ai-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, model } = body as {
      provider: AIProviderId;
      apiKey: string;
      model?: string;
    };

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Provider dan API Key wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await testUserApiKey(provider, apiKey, model);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal menguji API Key.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
