'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions/auth';
import { Eye, EyeOff, Loader2, Sparkles, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { useState } from 'react';

const inputClass =
  'w-full px-4 py-3.5 rounded-2xl bg-white/80 border border-[--border] text-[16px] text-[--text] placeholder:text-[--text-tertiary] focus:outline-none focus:border-[--accent] focus:bg-white focus:ring-4 focus:ring-[--accent-soft] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed min-h-[50px] font-medium';

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-wrapper">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 w-full max-w-[1080px] items-center">
        {/* Sol panel — Marka hikayesi */}
        <div className="hidden lg:block relative">
          <div className="hero-kicker">
            <span className="hero-kicker-dot" />
            <span>NEXTGENBOX · CONTROL TOWER</span>
          </div>

          <h1
            className="mt-7 hero-display"
            style={{ fontSize: 'clamp(44px, 5vw, 68px)' }}
          >
            Finansal kontrol{' '}
            <span className="hero-serif text-gradient-aurora">yeniden tanımlandı</span>.
          </h1>

          <p className="mt-6 text-[17px] text-[--text-secondary] leading-relaxed max-w-[480px]">
            Lokasyonlarınızın nakit akışı, performansı ve karlılığı tek bir tasarım dilinde.
            Saniyeler içinde kararlara giden zarif bir kontrol merkezi.
          </p>

          <ul className="mt-10 space-y-4 max-w-[440px]">
            {[
              {
                icon: <Zap className="w-4 h-4" strokeWidth={2.25} />,
                title: 'Anlık Konsolidasyon',
                desc: 'Tüm AVM ve lokasyonlar tek görünümde, gerçek zamanlı.',
                grad: 'var(--grad-aurora)',
              },
              {
                icon: <Sparkles className="w-4 h-4" strokeWidth={2.25} />,
                title: 'Akıllı Senaryolar',
                desc: 'Gider değişikliklerinin net karlılığa etkisini hemen gör.',
                grad: 'var(--grad-emerald)',
              },
              {
                icon: <ShieldCheck className="w-4 h-4" strokeWidth={2.25} />,
                title: 'Kurumsal Güvenlik',
                desc: 'Kayıt bazlı denetim, yetki kontrolü ve resmi evrak takibi.',
                grad: 'var(--grad-sunset)',
              },
            ].map((f) => (
              <li
                key={f.title}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white/55 border border-white/65 backdrop-blur-md"
              >
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{
                    background: f.grad,
                    boxShadow: '0 8px 18px rgba(79, 70, 229, 0.20)',
                  }}
                >
                  {f.icon}
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-[--text]" style={{ letterSpacing: '-0.01em' }}>
                    {f.title}
                  </p>
                  <p className="text-[13px] text-[--text-secondary] mt-0.5 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Sağ panel — Form */}
        <div className="flex justify-center">
          <div className="login-container w-full">
            <div className="p-8 md:p-10 relative">
              {/* Mobile brand */}
              <div className="lg:hidden flex flex-col items-center mb-8">
                <div className="hero-kicker">
                  <span className="hero-kicker-dot" />
                  <span>NEXTGENBOX</span>
                </div>
                <h1
                  className="mt-5 text-center hero-display"
                  style={{ fontSize: 'clamp(28px, 7vw, 36px)' }}
                >
                  Finansal kontrol{' '}
                  <span className="hero-serif text-gradient-aurora">merkezi</span>
                </h1>
              </div>

              {/* Header */}
              <div className="hidden lg:block mb-8">
                <p className="apple-eyebrow">Giriş</p>
                <h2 className="apple-title-1 mt-3">Hoş geldiniz.</h2>
                <p className="mt-2 text-[15px] text-[--text-secondary]" style={{ letterSpacing: '-0.005em' }}>
                  Kontrol merkezine erişmek için kimlik bilgilerinizi girin.
                </p>
              </div>

              {/* Global Error */}
              {state?.message && (
                <div
                  className="text-[13px] text-[--danger] bg-[--danger-soft] border border-[--danger-tint] rounded-2xl px-4 py-3 mb-6 font-medium"
                  role="alert"
                >
                  {state.message}
                </div>
              )}

              {/* Form */}
              <form action={action} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <label
                    htmlFor="login-email"
                    className="text-[12px] font-semibold uppercase tracking-wider block text-[--text-secondary]"
                  >
                    E-posta
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="ornek@nextgenbox.com"
                    className={`${inputClass} ${state?.errors?.email ? 'border-[--danger] focus:ring-[--danger-soft]' : ''}`}
                    disabled={pending}
                    required
                  />
                  {state?.errors?.email && (
                    <p className="text-[13px] text-[--danger] mt-1">
                      {state.errors.email[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="login-password"
                    className="text-[12px] font-semibold uppercase tracking-wider block text-[--text-secondary]"
                  >
                    Şifre
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className={`${inputClass} pr-12 ${state?.errors?.password ? 'border-[--danger] focus:ring-[--danger-soft]' : ''}`}
                      disabled={pending}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center text-[--text-tertiary] hover:bg-[--bg-elevated] hover:text-[--text] transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    >
                      {showPassword ? <EyeOff className="w-[18px] h-[18px]" strokeWidth={1.75} /> : <Eye className="w-[18px] h-[18px]" strokeWidth={1.75} />}
                    </button>
                  </div>
                  {state?.errors?.password && (
                    <p className="text-[13px] text-[--danger] mt-1">
                      {state.errors.password[0]}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="elite-button-primary w-full mt-2"
                  disabled={pending}
                  id="login-submit-btn"
                >
                  {pending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.25} />
                      <span>Giriş yapılıyor…</span>
                    </>
                  ) : (
                    <>
                      <span>Giriş Yap</span>
                      <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-7 pt-6 border-t border-[--border-soft] text-center">
                <p className="text-[11px] text-[--text-tertiary] uppercase tracking-wider">
                  Bu sistem yetkili personel ile sınırlıdır
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
