'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions/auth';
import { Zap, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-wrapper">
      {/* Decorative Background */}
      <div className="login-bg-pattern" aria-hidden="true">
        <div className="login-bg-orb login-bg-orb--1" />
        <div className="login-bg-orb login-bg-orb--2" />
        <div className="login-bg-orb login-bg-orb--3" />
      </div>

      <div className="login-container">
        {/* Left Branding Panel (Desktop) */}
        <div className="login-branding">
          <div className="login-branding-content">
            <div className="login-branding-badge">
              <ShieldCheck className="w-4 h-4" />
              <span>Güvenli Bağlantı</span>
            </div>

            <div className="login-branding-logo">
              <div className="login-logo-icon">
                <Zap className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="login-logo-text">
                  NextGen<span className="login-logo-accent">Box</span>
                </h1>
                <p className="login-logo-subtitle">Finansal Kontrol Merkezi</p>
              </div>
            </div>

            <p className="login-branding-desc">
              Tüm finansal operasyonlarınızı tek bir panelden yönetin. 
              Gelir, gider, nakit akışı ve performans analizlerini 
              gerçek zamanlı takip edin.
            </p>

            <div className="login-branding-features">
              <div className="login-feature">
                <div className="login-feature-dot login-feature-dot--blue" />
                <span>Gerçek Zamanlı Veriler</span>
              </div>
              <div className="login-feature">
                <div className="login-feature-dot login-feature-dot--teal" />
                <span>Şube Bazlı Analiz</span>
              </div>
              <div className="login-feature">
                <div className="login-feature-dot login-feature-dot--green" />
                <span>Güvenli Altyapı</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Login Form */}
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            {/* Mobile Logo */}
            <div className="login-mobile-logo">
              <div className="login-logo-icon login-logo-icon--sm">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="login-logo-text login-logo-text--sm">
                NextGen<span className="login-logo-accent">Box</span>
              </h1>
            </div>

            <div className="login-form-header">
              <h2 className="login-form-title">Sisteme Giriş</h2>
              <p className="login-form-subtitle">Devam etmek için hesap bilgilerinizi giriniz.</p>
            </div>

            {/* Global Error */}
            {state?.message && (
              <div className="login-error-banner" role="alert">
                <div className="login-error-dot" />
                <p>{state.message}</p>
              </div>
            )}

            <form action={action} className="login-form" noValidate>
              {/* Email */}
              <div className="login-field">
                <label htmlFor="login-email" className="login-label">
                  E-posta Adresi
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="ornek@nextgenbox.com"
                  className={`login-input ${state?.errors?.email ? 'login-input--error' : ''}`}
                  disabled={pending}
                  required
                />
                {state?.errors?.email && (
                  <p className="login-field-error">{state.errors.email[0]}</p>
                )}
              </div>

              {/* Password */}
              <div className="login-field">
                <label htmlFor="login-password" className="login-label">
                  Şifre
                </label>
                <div className="login-password-wrap">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`login-input login-input--password ${state?.errors?.password ? 'login-input--error' : ''}`}
                    disabled={pending}
                    required
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {state?.errors?.password && (
                  <p className="login-field-error">{state.errors.password[0]}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="login-submit"
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

            <div className="login-footer">
              <p>Bu sistem yetkili personel ile sınırlıdır.</p>
              <p>Erişim sorunları için sistem yöneticinize başvurun.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
