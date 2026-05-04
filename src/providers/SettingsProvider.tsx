'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSystemParameters } from '@/features/ledger/actions';

interface Settings {
  SESSION_PRICE_INCL_VAT: number;
  VAT_RATE: number;
  CORP_TAX_RATE: number;
  SETTING_POPUP_POSITION: number; // 0: Center, 1: Top
  SETTING_LOG_DETAIL_LEVEL: number; // 0: Compact, 1: Detailed
  SETTING_ANIMATION_SPEED: number; // 0: Fast, 1: Normal, 2: Premium (Slow)
  [key: string]: number;
}

const defaultSettings: Settings = {
  SESSION_PRICE_INCL_VAT: 300,
  VAT_RATE: 20,
  CORP_TAX_RATE: 25,
  SETTING_POPUP_POSITION: 0,
  SETTING_LOG_DETAIL_LEVEL: 0,
  SETTING_ANIMATION_SPEED: 1,
};

function pickNumericParams(params: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(params)) {
    const value = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isFinite(value)) out[key] = value;
  }
  return out;
}

const SettingsContext = createContext<{
  settings: Settings;
  refreshSettings: () => Promise<void>;
}>({
  settings: defaultSettings,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const refreshSettings = useCallback(async () => {
    try {
      const params = await getSystemParameters();
      const numeric = pickNumericParams(params ?? {});
      if (Object.keys(numeric).length > 0) {
        setSettings(prev => ({ ...prev, ...numeric }));
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getSystemParameters()
      .then(params => {
        if (cancelled) return;
        const numeric = pickNumericParams(params ?? {});
        if (Object.keys(numeric).length > 0) {
          setSettings(prev => ({ ...prev, ...numeric }));
        }
      })
      .catch(error => {
        if (cancelled) return;
        console.error("Failed to fetch settings:", error);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
