'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync-kabin');
      const result = await res.json();
      if (result.success) window.location.reload();
    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      onClick={triggerSync}
      disabled={isSyncing}
      className="elite-button-secondary flex items-center gap-2 text-xs"
    >
      <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
      Senkronize Et
    </button>
  );
}
