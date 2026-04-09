'use client';
/**
 * Lightweight toast hook — no external dependency.
 * Usage: const { toast } = useToast();
 *        toast.success('Kaydedildi');
 *        toast.error('Hata oluştu');
 *        toast.info('Bilgi mesajı');
 */
import { useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

function showToast(message: string, type: ToastType = 'info', duration = 3500) {
  // Remove existing toasts with same message to avoid duplicates
  const existing = document.querySelectorAll('[data-toast]');
  existing.forEach((el) => {
    if ((el as HTMLElement).dataset.message === message) el.remove();
  });

  const container = getOrCreateContainer();

  const toast = document.createElement('div');
  toast.dataset.toast = 'true';
  toast.dataset.message = message;

  const colors: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
    success: { bg: '#F0FDF4', border: '#BBF7D0', icon: '✓', text: '#15803D' },
    error:   { bg: '#FEF2F2', border: '#FECACA', icon: '✕', text: '#B91C1C' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', icon: '⚠', text: '#92400E' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', icon: 'ℹ', text: '#1D4ED8' },
  };

  const c = colors[type];

  toast.style.cssText = `
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: ${c.bg};
    border: 1px solid ${c.border};
    border-radius: 12px;
    padding: 12px 16px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #1E293B;
    max-width: 380px;
    min-width: 240px;
    cursor: pointer;
    animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    position: relative;
    overflow: hidden;
  `;

  const iconEl = document.createElement('span');
  iconEl.textContent = c.icon;
  iconEl.style.cssText = `
    color: ${c.text};
    font-weight: 700;
    font-size: 14px;
    flex-shrink: 0;
    margin-top: 1px;
  `;

  const msgEl = document.createElement('span');
  msgEl.textContent = message;
  msgEl.style.cssText = 'flex: 1; line-height: 1.5;';

  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    background: ${c.text};
    opacity: 0.3;
    width: 100%;
    animation: toastProgress ${duration}ms linear forwards;
  `;

  toast.appendChild(iconEl);
  toast.appendChild(msgEl);
  toast.appendChild(progressBar);

  toast.addEventListener('click', () => removeToast(toast));

  container.appendChild(toast);

  setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast: HTMLElement) {
  toast.style.animation = 'toastSlideOut 0.25s ease-in forwards';
  setTimeout(() => toast.remove(), 250);
}

function getOrCreateContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    container.style.setProperty('pointer-events', 'none');

    // Inject keyframes once
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(100%) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastSlideOut {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to   { opacity: 0; transform: translateX(100%) scale(0.95); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
        #toast-container > * {
          pointer-events: auto;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(container);
  }
  return container;
}

export function useToast() {
  const success = useCallback((msg: string) => showToast(msg, 'success'), []);
  const error   = useCallback((msg: string) => showToast(msg, 'error'), []);
  const info    = useCallback((msg: string) => showToast(msg, 'info'), []);
  const warning = useCallback((msg: string) => showToast(msg, 'warning'), []);

  return {
    toast: { success, error, info, warning },
  };
}

// Static version for use outside of React components
export const toast = {
  success: (msg: string) => showToast(msg, 'success'),
  error:   (msg: string) => showToast(msg, 'error'),
  info:    (msg: string) => showToast(msg, 'info'),
  warning: (msg: string) => showToast(msg, 'warning'),
};
