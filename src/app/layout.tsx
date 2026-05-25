import "./globals.css";
import { Inter, Instrument_Serif } from "next/font/google";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import ClientShell from "./ClientShell";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { ProfileProvider, type ProfileSummary } from "@/providers/ProfileProvider";
import { createClient } from "@/utils/supabase/server";
import { resolveActiveProfile } from "@/lib/profile-context";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument-serif",
});

export async function generateMetadata(): Promise<Metadata> {
  let brandName = 'NextGenBox';
  try {
    const resolution = await resolveActiveProfile();
    if (resolution.profile) brandName = resolution.profile.brandName;
  } catch {
    // fall back to default brand name silently
  }
  return {
    title: `${brandName} — Finansal Kontrol`,
    description: 'Kurumsal finans yönetimi ve performans analiz platformu.',
    robots: 'noindex, nofollow',
  };
}

function profileThemeVars(profile: ProfileSummary | null): CSSProperties {
  const primary = profile?.primaryColor ?? '#4F46E5';
  const accent = profile?.accentColor ?? '#06B6D4';
  return {
    ['--brand-primary' as never]: primary,
    ['--brand-accent' as never]: accent,
    ['--grad-aurora' as never]: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
  } as CSSProperties;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  const resolution = isAuthenticated ? await resolveActiveProfile() : null;
  const activeProfile = resolution?.profile ?? null;
  const activeRole = resolution?.role ?? null;
  const availableProfiles = resolution?.availableProfiles ?? [];

  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${inter.variable} ${instrumentSerif.variable}`}
      style={profileThemeVars(activeProfile)}
    >
      <body
        suppressHydrationWarning
        className={`font-sans antialiased ${isAuthenticated ? 'flex h-screen overflow-hidden' : ''}`}
      >
        {isAuthenticated ? (
          <ProfileProvider
            initial={{
              activeProfile,
              activeRole,
              availableProfiles,
            }}
          >
            <SettingsProvider>
              <ClientShell
                userEmail={user?.email || 'Yönetici'}
                userFullName={user?.user_metadata?.full_name || ''}
                userRole={user?.user_metadata?.role || 'user'}
              >
                {children}
              </ClientShell>
            </SettingsProvider>
          </ProfileProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
