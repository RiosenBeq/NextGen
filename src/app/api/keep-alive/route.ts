import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/utils/supabase/env';

// Force dynamic — bu endpoint'in build time'da prerender edilmesini istemiyoruz.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Supabase Free tier 7 gün inaktivite sonrası otomatik pause uygular. Bu
 * endpoint dış (GitHub Actions cron) bir scheduler tarafından düzenli aralıklarla
 * çağrılarak DB'ye gerçek bir okuma atar ve sayacı sıfırlar.
 *
 * Cookie/auth kullanmaz; salt anon-key ile bağımsız bir client açar (proxy
 * middleware /api/* için auth check'i zaten atlıyor — bkz. proxy.ts).
 *
 * Güvenlik: CRON_SECRET ortam değişkeni tanımlıysa istekler
 * `Authorization: Bearer <secret>` veya `?secret=<secret>` zorunluluğu taşır.
 * Tanımlı değilse (legacy deployments) endpoint açık kalır.
 */
export async function GET(request: NextRequest) {
  const startedAt = Date.now();

  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret) {
    const headerSecret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
    const querySecret = request.nextUrl.searchParams.get('secret');
    const provided = headerSecret || querySecret;
    if (provided !== expectedSecret) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Hafif bir okuma — `count` head modu ile satır taşımaz, sadece DB'yi
    // uyandırır. SystemParameter küçük bir tablo; yoksa Location gibi bir
    // yedek yol da olabilir ama bu projede her zaman var.
    const { error, count } = await supabase
      .from('SystemParameter')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return NextResponse.json(
      {
        ok: true,
        durationMs: Date.now() - startedAt,
        sampledAt: new Date().toISOString(),
        rows: count ?? 0,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        ok: false,
        error: message,
        durationMs: Date.now() - startedAt,
        sampledAt: new Date().toISOString(),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
