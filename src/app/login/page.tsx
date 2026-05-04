'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions/auth';
import { Zap, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useState } from 'react';

const inputBase =
  'w-full px-4 py-2.5 rounded-xl border bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed';

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="w-full max-w-[420px]">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-600" strokeWidth={2.25} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            NextGenBox
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-8 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.08)]">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-1.5">
              Sisteme Giriş
            </h2>
            <p className="text-sm text-slate-500">
              Devam etmek için hesap bilgilerinizi giriniz.
            </p>
          </div>

          {/* Global Error */}
          {state?.message && (
            <div
              className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 mb-5"
              role="alert"
            >
              {state.message}
            </div>
          )}

          {/* Form */}
          <form action={action} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="text-sm font-medium block text-slate-700"
              >
                E-posta Adresi
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="ornek@nextgenbox.com"
                className={`${inputBase} ${state?.errors?.email ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200'}`}
                disabled={pending}
                required
              />
              {state?.errors?.email && (
                <p className="text-xs font-medium text-rose-600 mt-1">
                  {state.errors.email[0]}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="text-sm font-medium block text-slate-700"
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
                  className={`${inputBase} pr-11 ${state?.errors?.password ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200'}`}
                  disabled={pending}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {state?.errors?.password && (
                <p className="text-xs font-medium text-rose-600 mt-1">
                  {state.errors.password[0]}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              disabled={pending}
              id="login-submit-btn"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Giriş Yapılıyor...</span>
                </>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-1">
          <p className="text-xs text-slate-400">
            Bu sistem yetkili personel ile sınırlıdır.
          </p>
          <p className="text-xs text-slate-400">
            Erişim sorunları için sistem yöneticinize başvurun.
          </p>
        </div>
      </div>
    </div>
  );
}
