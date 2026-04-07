import { Inter } from "next/font/google";
import "./globals.css";
import ClientShell from "./ClientShell";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { createClient } from "@/utils/supabase/server";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
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
  // Check auth to decide whether to show shell or just content (login page)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  return (
    <html lang="tr" suppressHydrationWarning className={inter.variable}>
      <body
        suppressHydrationWarning
        className={`${inter.className} font-sans antialiased selection:bg-blue-100 ${isAuthenticated ? 'flex h-screen overflow-hidden' : ''}`}
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
