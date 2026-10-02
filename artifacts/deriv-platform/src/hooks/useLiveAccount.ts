import { useEffect, useState } from 'react';
import {
  getStoredAccounts,
  getActiveAccountType,
  refreshAccounts,
  type AuthAccount,
} from '@/lib/auth-api';

// Keeps a page's displayed account/balance in sync with reality, the same
// way DerivHeader already does: on mount, when the tab regains focus, on
// a 20s interval (covers eventual sync across different browsers, which
// can't share anything but the server), and instantly whenever this same
// tab fires "auth-changed" (login, logout, account switch, balance update)
// or another tab in the same browser writes to localStorage ("storage").
export function useLiveAccount(): AuthAccount | null {
  const [accounts, setAccounts] = useState<AuthAccount[]>(getStoredAccounts());
  const [activeType, setActiveType] = useState(getActiveAccountType());

  useEffect(() => {
    // Instant, no network: read whatever is in localStorage right now.
    const syncLocal = () => {
      setActiveType(getActiveAccountType());
      setAccounts(getStoredAccounts());
    };
    // Authoritative: ask the server (covers other browsers and devices).
    const syncServer = () => {
      if (document.visibilityState === 'hidden') return;
      syncLocal();
      refreshAccounts()
        .then(setAccounts)
        .catch(() => {});
    };

    syncServer();
    window.addEventListener('focus', syncServer);
    document.addEventListener('visibilitychange', syncServer);
    window.addEventListener('auth-changed', syncLocal);
    window.addEventListener('storage', syncLocal);
    const interval = setInterval(syncServer, 10000);

    return () => {
      window.removeEventListener('focus', syncServer);
      document.removeEventListener('visibilitychange', syncServer);
      window.removeEventListener('auth-changed', syncLocal);
      window.removeEventListener('storage', syncLocal);
      clearInterval(interval);
    };
  }, []);

  return accounts.find((a) => a.type === activeType) ?? accounts[0] ?? null;
}
