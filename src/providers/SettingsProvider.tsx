'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSystemParameters } from '@/features/ledger/actions';

interface Settings {
  SESSION_PRICE_INCL_VAT: number;
  VAT_RATE: number;
  CORP_TAX_RATE: number;
  SETTING_POPUP_POSITION: number; // 0: Center, 1: Top
  SETTING_LOG_DETAIL_LEVEL: number; // 0: Compact, 1: Detailed
  SETTING_ANIMATION_SPEED: number; // 0: Fast, 1: Normal, 2: Premium (Slow)
  [key: string]: any;
}

const defaultSettings: Settings = {
  SESSION_PRICE_INCL_VAT: 300,
  VAT_RATE: 20,
  CORP_TAX_RATE: 25,
  SETTING_POPUP_POSITION: 0,
  SETTING_LOG_DETAIL_LEVEL: 0,
  SETTING_ANIMATION_SPEED: 1,
};

const SettingsContext = createContext<{
  settings: Settings;
  refreshSettings: () => Promise<void>;
}>({
  settings: defaultSettings,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const refreshSettings = async () => {
    try {
      const params = await getSystemParameters();
      if (params && Object.keys(params).length > 0) {
        setSettings(prev => ({ ...prev, ...params }));
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
