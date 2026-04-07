'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions/auth';
import { Zap, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 relative overflow-hidden" style={{ background: '#F7F9FC' }}>
      {/* Decorative Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute w-[500px] h-[500px] rounded-full -top-[15%] -right-[10%] opacity-[0.08]" style={{ background: '#2F6BFF', filter: 'blur(80px)' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full -bottom-[10%] -left-[5%] opacity-[0.06]" style={{ background: '#14B8A6', filter: 'blur(80px)' }} />
        <div className="absolute w-[300px] h-[300px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04]" style={{ background: '#2457E6', filter: 'blur(80px)' }} />
      </div>

      {/* Main Card Container */}
      <div className="flex w-full max-w-[960px] lg:max-w-[1040px] min-h-[560px] lg:min-h-[600px] rounded-2xl overflow-hidden border relative z-10 animate-fade-in" style={{ background: '#FFFFFF', borderColor: '#E5EAF2', boxShadow: '0 20px 40px -8px rgba(16, 24, 40, 0.1), 0 8px 16px -4px rgba(16, 24, 40, 0.05)' }}>
        
        {/* Left Branding Panel — Desktop Only */}
        <div className="hidden md:flex w-[44%] lg:w-[46%] flex-col justify-center p-8 lg:p-10 relative overflow-hidden" style={{ background: '#1E2A44' }}>
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 80%, rgba(47,107,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(20,184,166,0.1) 0%, transparent 50%)' }} />
          
          <div className="relative z-10 space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide w-fit" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#14B8A6' }}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Güvenli Bağlantı</span>
            </div>

            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#2F6BFF', boxShadow: '0 4px 16px rgba(47,107,255,0.35)' }}>
                <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
                  NextGen<span style={{ color: '#60A5FA' }}>Box</span>
                </h1>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mt-0.5" style={{ color: 'rgba(148,163,184,0.8)' }}>
                  Finansal Kontrol Merkezi
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(148,163,184,0.9)' }}>
              Tüm finansal operasyonlarınızı tek bir panelden yönetin. 
              Gelir, gider, nakit akışı ve performans analizlerini 
              gerçek zamanlı takip edin.
            </p>

            {/* Feature list */}
            <div className="space-y-3">
              {[
                { label: 'Gerçek Zamanlı Veriler', color: '#2F6BFF', shadow: 'rgba(47,107,255,0.2)' },
                { label: 'Şube Bazlı Analiz', color: '#14B8A6', shadow: 'rgba(20,184,166,0.2)' },
                { label: 'Güvenli Altyapı', color: '#12B76A', shadow: 'rgba(18,183,106,0.2)' },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3 text-sm font-medium" style={{ color: 'rgba(203,213,225,0.85)' }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: f.color, boxShadow: `0 0 0 3px ${f.shadow}` }} />
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-10 lg:p-12">
          <div className="w-full max-w-[380px]">
            {/* Mobile Logo */}
            <div className="flex md:hidden items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#2F6BFF' }}>
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#101828' }}>
                NextGen<span style={{ color: '#2F6BFF' }}>Box</span>
              </h1>
            </div>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight mb-1.5" style={{ color: '#101828' }}>
                Sisteme Giriş
              </h2>
              <p className="text-sm" style={{ color: '#667085' }}>
                Devam etmek için hesap bilgilerinizi giriniz.
              </p>
            </div>

            {/* Global Error */}
            {state?.message && (
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl mb-5 animate-fade-in" style={{ background: '#FEF3F2', border: '1px solid rgba(240,68,56,0.15)' }} role="alert">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#F04438' }} />
                <p className="text-sm font-medium" style={{ color: '#F04438' }}>{state.message}</p>
              </div>
            )}

            {/* Form */}
            <form action={action} className="space-y-5" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-sm font-semibold block" style={{ color: '#101828' }}>
                  E-posta Adresi
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="ornek@nextgenbox.com"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-150"
                  style={{
                    background: '#FFFFFF',
                    border: `1.5px solid ${state?.errors?.email ? '#F04438' : '#E5EAF2'}`,
                    color: '#101828',
                  }}
                  onFocus={(e) => {
                    if (!state?.errors?.email) e.currentTarget.style.borderColor = '#2F6BFF';
                    e.currentTarget.style.boxShadow = state?.errors?.email 
                      ? '0 0 0 3px rgba(240,68,56,0.12)' 
                      : '0 0 0 3px rgba(47,107,255,0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = state?.errors?.email ? '#F04438' : '#E5EAF2';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  disabled={pending}
                  required
                />
                {state?.errors?.email && (
                  <p className="text-xs font-medium mt-0.5" style={{ color: '#F04438' }}>{state.errors.email[0]}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-sm font-semibold block" style={{ color: '#101828' }}>
                  Şifre
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-11 rounded-xl text-sm outline-none transition-all duration-150"
                    style={{
                      background: '#FFFFFF',
                      border: `1.5px solid ${state?.errors?.password ? '#F04438' : '#E5EAF2'}`,
                      color: '#101828',
                    }}
                    onFocus={(e) => {
                      if (!state?.errors?.password) e.currentTarget.style.borderColor = '#2F6BFF';
                      e.currentTarget.style.boxShadow = state?.errors?.password 
                        ? '0 0 0 3px rgba(240,68,56,0.12)' 
                        : '0 0 0 3px rgba(47,107,255,0.15)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = state?.errors?.password ? '#F04438' : '#E5EAF2';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    disabled={pending}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    style={{ color: '#98A2B3' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#667085'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#98A2B3'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {state?.errors?.password && (
                  <p className="text-xs font-medium mt-0.5" style={{ color: '#F04438' }}>{state.errors.password[0]}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl text-white font-semibold text-[15px] transition-all duration-150 mt-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.985]"
                style={{
                  background: '#2F6BFF',
                  boxShadow: '0 1px 3px rgba(47,107,255,0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!pending) {
                    e.currentTarget.style.background = '#1D5AE6';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(47,107,255,0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2F6BFF';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(47,107,255,0.3)';
                }}
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

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs" style={{ color: '#98A2B3' }}>Bu sistem yetkili personel ile sınırlıdır.</p>
              <p className="text-xs mt-0.5" style={{ color: '#98A2B3' }}>Erişim sorunları için sistem yöneticinize başvurun.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
