// Supabase env değişkenlerini güvenli şekilde okur. Eksiklik durumunda runtime'da
// `process.env.X!` non-null assert ile sessiz `undefined` geçirip Supabase
// içerisinde belirsiz bir crash üretmek yerine, kaynağı net olarak belirten
// okunaklı bir hata fırlatır.
function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

export function getSupabaseUrl(): string {
  const value = readEnv(
    "NEXT_PUBLIC_HESAPSUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL"
  );
  if (!value) {
    throw new Error(
      "Supabase yapılandırması eksik: NEXT_PUBLIC_HESAPSUPABASE_URL (veya NEXT_PUBLIC_SUPABASE_URL) ayarlanmamış."
    );
  }
  return value;
}

export function getSupabaseAnonKey(): string {
  const value = readEnv(
    "NEXT_PUBLIC_HESAPSUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
  if (!value) {
    throw new Error(
      "Supabase yapılandırması eksik: NEXT_PUBLIC_HESAPSUPABASE_ANON_KEY (veya NEXT_PUBLIC_SUPABASE_ANON_KEY) ayarlanmamış."
    );
  }
  return value;
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return readEnv("SUPABASE_SERVICE_ROLE_KEY");
}
