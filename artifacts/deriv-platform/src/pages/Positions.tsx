import { useState, useEffect, useCallback } from 'react';
import DerivHeader from '@/components/DerivHeader';
import DerivSidebar from '@/components/DerivSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { getStoredAccount } from '@/lib/auth-api';
import { getOpenTrades, getTradeHistory, type Trade } from '@/lib/trades-api';

const Positions = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tab, setTab] = useState<'open' | 'closed'>('open');
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [closedTrades, setClosedTrades] = useState<Trade[]>([]);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    const account = getStoredAccount();
    if (!account) return;
    const [open, history] = await Promise.all([
      getOpenTrades(account.id),
      getTradeHistory(account.id),
    ]);
    setOpenTrades(open.openTrades);
    setClosedTrades(history.closedTrades);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      load();
      setNow(Date.now());
    }, 2000);
    return () => clearInterval(interval);
  }, [load]);

  const secondsLeft = (settlesAt: string) =>
    Math.max(0, Math.floor((new Date(settlesAt).getTime() - now) / 1000));

  const trades = tab === 'open' ? openTrades : closedTrades;

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
      <DerivHeader onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <DerivSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex-1 flex flex-col pb-16 md:pb-0">
          <div className="flex border-b border-[#323738]">
            <button
              onClick={() => setTab('open')}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                tab === 'open' ? 'text-red-500 border-red-500' : 'text-gray-400 border-transparent'
              }`}
            >
              Open ({openTrades.length})
            </button>
            <button
              onClick={() => setTab('closed')}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                tab === 'closed' ? 'text-red-500 border-red-500' : 'text-gray-400 border-transparent'
              }`}
            >
              Closed ({closedTrades.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {trades.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-12">No trades yet</div>
            )}
            {trades.map((trade) => {
              const direction = trade.direction.charAt(0).toUpperCase() + trade.direction.slice(1);
              const profit =
                trade.status === 'won'
                  ? Number(trade.payout ?? 0) - Number(trade.stake)
                  : trade.status === 'lost'
                  ? -Number(trade.stake)
                  : null;

              return (
                <div key={trade.id} className="bg-[#151717] border border-[#323738] rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-white font-medium">{trade.market?.displayName ?? '—'}</div>
                      <div className="text-gray-400 text-xs">{trade.tradeType.replace('_', '/')} — {direction}</div>
                    </div>
                    {trade.status === 'open' ? (
                      <span className="text-yellow-400 text-xs">{secondsLeft(trade.settlesAt)}s left</span>
                    ) : (
                      <span
                        className={`text-xs font-semibold ${
                          profit && profit >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {profit !== null ? `${profit >= 0 ? '+' : ''}${profit.toFixed(2)} USD` : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-400 text-xs">Stake USD {Number(trade.stake).toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <MobileBottomNav onMenuClick={() => setIsSidebarOpen(true)} />
    </div>
  );
};

export default Positions;
