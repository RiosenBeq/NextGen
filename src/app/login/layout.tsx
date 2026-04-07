export const metadata = {
  title: 'Giriş — NextGenBox',
  robots: 'noindex, nofollow',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="login-layout">
      {children}
    </div>
  );
}
