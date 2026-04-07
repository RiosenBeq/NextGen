"use client";

import { useEffect, useState } from 'react';
import { getActiveLocations, getSystemParameters } from '@/features/ledger/actions';
import { getSystemUsers } from '@/features/auth/admin-actions';
import { getMyProfile } from '@/features/auth/profile-actions';
import SettingsClientUI from '@/components/premium/SettingsClientUI';

export default function SettingsPage() {
  const [data, setData] = useState<{
    locations: any[];
    parameters: Record<string, number>;
    users: any[];
    currentUser: any;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const [locations, parameters, users, myProfile] = await Promise.all([
        getActiveLocations(),
        getSystemParameters(),
        getSystemUsers(),
        getMyProfile()
      ]);

      setData({ 
        locations: locations || [], 
        parameters: parameters || {},
        users: users || [],
        currentUser: myProfile
      });
    }
    fetchData();
  }, []);

  if (!data) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-[24px] border-4 border-slate-100"></div>
        <div className="w-16 h-16 rounded-[24px] border-4 border-blue-600 border-t-transparent animate-spin absolute top-0 left-0 shadow-lg shadow-blue-500/10"></div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase animate-pulse">NextGen Box Engine</span>
        <span className="text-xs font-bold text-slate-300 italic">Sistem konfigürasyonu yükleniyor...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="page-wrapper max-w-7xl mx-auto p-4 md:p-12">
         <SettingsClientUI 
            locations={data.locations}
            parameters={data.parameters}
            users={data.users}
            currentUser={data.currentUser}
         />
      </div>
    </div>
  );
}
