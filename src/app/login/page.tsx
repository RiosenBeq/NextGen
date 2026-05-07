'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions/auth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-[--bg-elevated] border border-transparent text-[17px] text-[--text] placeholder:text-[--text-tertiary] focus:outline-none focus:bg-white focus:border-[--accent] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]';

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-[--bg]">
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="text-center mb-12">
          <h1 className="text-[28px] font-semibold tracking-tight text-[--text] leading-none" style={{ letterSpacing: '-0.022em' }}>
            NextGen<span className="text-[--accent]">Box</span>
          </h1>
          <p className="mt-3 text-[15px] text-[--text-secondary]" style={{ letterSpacing: '-0.005em' }}>
            Finansal kontrol merkezi
          </p>
        </div>

        {/* Card */}
        <div className="bg-[--surface] rounded-[22px] border border-[--border] p-8 md:p-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-[24px] font-semibold tracking-tight text-[--text] mb-2" style={{ letterSpacing: '-0.022em' }}>
              Hoş geldiniz
            </h2>
            <p className="text-[15px] text-[--text-secondary]" style={{ letterSpacing: '-0.005em' }}>
              Devam etmek için giriş yapın.
            </p>
          </div>

          {/* Global Error */}
          {state?.message && (
            <div
              className="text-[13px] text-[--danger] bg-[--danger-soft] rounded-xl px-4 py-3 mb-6 text-center font-medium"
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
                className="text-[13px] font-medium block text-[--text]"
                style={{ letterSpacing: '-0.005em' }}
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
                className={`${inputClass} ${state?.errors?.email ? 'border-[--danger]' : ''}`}
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
                className="text-[13px] font-medium block text-[--text]"
                style={{ letterSpacing: '-0.005em' }}
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
                  className={`${inputClass} pr-12 ${state?.errors?.password ? 'border-[--danger]' : ''}`}
                  disabled={pending}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg flex items-center justify-center text-[--text-tertiary] hover:bg-black/[0.04] hover:text-[--text] transition-colors"
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
              className="w-full flex items-center justify-center gap-2 bg-[--accent] hover:bg-[--accent-hover] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-full font-medium text-[15px] transition-colors duration-200 mt-2 min-h-[48px]"
              disabled={pending}
              style={{ letterSpacing: '-0.01em' }}
              id="login-submit-btn"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  <span>Giriş yapılıyor…</span>
                </>
              ) : (
                <span>Giriş Yap</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[12px] text-[--text-tertiary] leading-relaxed">
            Bu sistem yetkili personel ile sınırlıdır.
          </p>
        </div>
      </div>
    </div>
  );
}
