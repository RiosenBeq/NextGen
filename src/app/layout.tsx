import "./globals.css";
import { Inter, Instrument_Serif } from "next/font/google";
import ClientShell from "./ClientShell";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { createClient } from "@/utils/supabase/server";

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

export const metadata = {
  title: 'NextGenBox — Finansal Kontrol',
  description: 'Kurumsal finans yönetimi ve performans analiz platformu.',
  robots: 'noindex, nofollow',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  return (
    <html lang="tr" suppressHydrationWarning className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body
        suppressHydrationWarning
        className={`font-sans antialiased ${isAuthenticated ? 'flex h-screen overflow-hidden' : ''}`}
      >
        {isAuthenticated ? (
          <SettingsProvider>
            <ClientShell
              userEmail={user?.email || 'Yönetici'}
              userFullName={user?.user_metadata?.full_name || ''}
              userRole={user?.user_metadata?.role || 'user'}
            >
              {children}
            </ClientShell>
          </SettingsProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
