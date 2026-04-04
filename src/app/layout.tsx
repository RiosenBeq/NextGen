import { Inter } from "next/font/google";
import "./globals.css";
import ClientShell from "./ClientShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'NextGenBox — Financial Control',
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} bg-[#F1F5F9] flex h-screen overflow-hidden text-slate-900 font-sans antialiased selection:bg-blue-200`}>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
