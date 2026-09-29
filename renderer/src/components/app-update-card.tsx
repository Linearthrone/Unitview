
"use client";

import { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { emptyUpdateStatus, isUpdateBusy, updateActionLabel, type AppUpdateStatus } from '@/lib/app-update';
import { getAppVersion } from '@/lib/app-version';

export default function AppUpdateCard() {
  const [status, setStatus] = useState<AppUpdateStatus>(() => emptyUpdateStatus('…', false));

  useEffect(() => {
    let cancelled = false;
    const api = window.electronAPI;
    void (async () => {
      if (api?.getUpdateStatus) {
        const next = await api.getUpdateStatus();
        if (!cancelled) setStatus(next);
        return;
      }
      const version = await getAppVersion();
      if (!cancelled) setStatus(emptyUpdateStatus(version, false));
    })();
    const stop = api?.onUpdateStatus?.((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  const busy = isUpdateBusy(status.phase);
  const run = async () => {
    const api = window.electronAPI;
    if (!api) return;
    if (status.phase === 'available') {
      setStatus(await api.downloadUpdate());
      return;
    }
    if (status.phase === 'ready') {
      setStatus(await api.installUpdate());
      return;
    }
    setStatus(await api.checkForUpdates());
  };

  return (
    <div className="pt-4 border-t border-border space-y-3" data-testid="app-update-card">
      <h4 className="text-base font-medium">Windows pack updates</h4>
      <p className="text-base text-muted-foreground">{status.message}</p>
      <div className="flex justify-between gap-4 text-base">
        <span className="text-muted-foreground">Installed</span>
        <span className="font-medium">{status.currentVersion}</span>
      </div>
      {status.availableVersion ? (
        <div className="flex justify-between gap-4 text-base">
          <span className="text-muted-foreground">Available</span>
          <span className="font-medium">{status.availableVersion}</span>
        </div>
      ) : null}
      {status.phase === 'downloading' && status.percent !== null ? (
        <p className="text-base" data-testid="update-progress">
          {status.percent}%
        </p>
      ) : null}
      <Button
        type="button"
        variant="default"
        className="text-base"
        data-testid="check-for-updates"
        disabled={busy || !window.electronAPI?.checkForUpdates}
        onClick={() => void run()}
      >
        {status.phase === 'ready' ? (
          <Download className="w-4 h-4 mr-2" />
        ) : (
          <RefreshCw className="w-4 h-4 mr-2" />
        )}
        {updateActionLabel(status.phase)}
      </Button>
    </div>
  );
}
