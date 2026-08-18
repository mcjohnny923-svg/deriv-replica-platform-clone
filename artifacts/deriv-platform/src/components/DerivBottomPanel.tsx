import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Flag } from 'lucide-react';
import { getStoredAccount } from '@/lib/auth-api';
import { getOpenTrades, getTradeHistory, type Trade } from '@/lib/trades-api';

interface DerivBottomPanelProps {
  refreshKey?: number;
}

function formatContractLabel(trade: Trade): string {
  const direction = trade.direction.charAt(0).toUpperCase() + trade.direction.slice(1);
  return `${direction} - ${trade.market?.displayName ?? 'Market'}`;
}

const DerivBottomPanel = ({ refreshKey }: DerivBottomPanelProps) => {
  const [activeTab, setActiveTab] = useState('open_positions');
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [closedTrades, setClosedTrades] = useState<Trade[]>([]);
  const [now, setNow] = useState(Date.now());
  const previousOpenIds = useRef<Set<number>>(new Set());

  const loadOpen = useCallback(async () => {
    const account = getStoredAccount();
    if (!account) return;
    try {
      const { openTrades: trades } = await getOpenTrades(account.id);

      // Detect trades that just disappeared from "open" — they settled
      const currentIds = new Set(trades.map((t) => t.id));
      const settledIds = [...previousOpenIds.current].filter((id) => !currentIds.has(id));

      if (settledIds.length > 0) {
        const { closedTrades: recentlyClosed } = await getTradeHistory(account.id);
        for (const id of settledIds) {
          const settled = recentlyClosed.find((t) => t.id === id);
          if (settled) {
            const won = settled.status === 'won';
            const amount = won
              ? Number(settled.payout ?? 0) - Number(settled.stake)
              : -Number(settled.stake);
            const sign = amount >= 0 ? '+' : '-';

            toast.custom(() => (
              <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-lg min-w-[280px]">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    won ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  <Flag className={`h-4 w-4 ${won ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <div className={`font-bold text-sm ${won ? 'text-green-600' : 'text-red-600'}`}>
                    {won ? 'Profit' : 'Loss'}: {sign}{Math.abs(amount).toFixed(2)} USD
                  </div>
                  <div className="text-gray-500 text-xs">{formatContractLabel(settled)}</div>
                </div>
              </div>
            ), { duration: 4000 });
          }
        }
      }

      previousOpenIds.current = currentIds;
      setOpenTrades(trades);
    } catch {
      // silent fail, keep previous state
    }
  }, []);

  const loadHistory = useCallback(async () => {
    const account = getStoredAccount();
    if (!account) return;
    try {
      const { closedTrades: trades } = await getTradeHistory(account.id);
      setClosedTrades(trades);
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    loadOpen();
  }, [loadOpen, refreshKey]);

  useEffect(() => {
    if (activeTab === 'statement') {
      loadHistory();
    }
  }, [activeTab, loadHistory, refreshKey]);

  // Poll open trades every 2s so settled trades move out automatically
  useEffect(() => {
    const interval = setInterval(() => {
      loadOpen();
      setNow(Date.now());
    }, 2000);
    return () => clearInterval(interval);
  }, [loadOpen]);

  const tabs = [
    { id: 'open_positions', label: 'Open positions', count: openTrades.length },
    { id: 'portfolio', label: 'Portfolio', count: undefined },
    { id: 'statement', label: 'Statement', count: undefined },
  ];

  const formatDirection = (trade: Trade) => {
    return trade.direction.charAt(0).toUpperCase() + trade.direction.slice(1);
  };

  const secondsLeft = (settlesAt: string) => {
    const diff = Math.max(0, Math.floor((new Date(settlesAt).getTime() - now) / 1000));
    return diff;
  };

  return (
    <div className="h-48 bg-[#151717] border-t border-[#323738] overflow-y-auto">
      {/* Tab headers */}
      <div className="flex border-b border-[#323738]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'text-red-500 border-red-500'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 px-2 py-1 text-xs bg-[#323738] rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {/* Tab content */}
      <div className="p-4">
        {activeTab === 'open_positions' && (
          openTrades.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-sm">No open positions</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-4 text-xs text-gray-400 uppercase tracking-wider border-b border-[#323738] pb-2">
                <div>Asset</div>
                <div>Type</div>
                <div>Direction</div>
                <div>Stake</div>
                <div>Settles in</div>
              </div>
              {openTrades.map((trade) => (
                <div key={trade.id} className="grid grid-cols-5 gap-4 text-sm py-2 border-b border-[#323738]/50">
                  <div className="text-white">{trade.market?.displayName ?? '—'}</div>
                  <div className="text-gray-300">{trade.tradeType.replace('_', '/')}</div>
                  <div className="text-white">{formatDirection(trade)}</div>
                  <div className="text-white">USD {Number(trade.stake).toFixed(2)}</div>
                  <div className="text-yellow-400">{secondsLeft(trade.settlesAt)}s</div>
                </div>
              ))}
            </div>
          )
        )}
        {activeTab === 'portfolio' && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-sm">Portfolio summary coming soon</div>
          </div>
        )}
        {activeTab === 'statement' && (
          closedTrades.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-sm">No transactions</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-6 gap-4 text-xs text-gray-400 uppercase tracking-wider border-b border-[#323738] pb-2">
                <div>Asset</div>
                <div>Type</div>
                <div>Direction</div>
                <div>Stake</div>
                <div>Payout</div>
                <div>Result</div>
              </div>
              {closedTrades.map((trade) => (
                <div key={trade.id} className="grid grid-cols-6 gap-4 text-sm py-2 border-b border-[#323738]/50">
                  <div className="text-white">{trade.market?.displayName ?? '—'}</div>
                  <div className="text-gray-300">{trade.tradeType.replace('_', '/')}</div>
                  <div className="text-white">{formatDirection(trade)}</div>
                  <div className="text-white">USD {Number(trade.stake).toFixed(2)}</div>
                  <div className="text-white">USD {Number(trade.payout ?? 0).toFixed(2)}</div>
                  <div className={trade.status === 'won' ? 'text-green-400' : 'text-red-400'}>
                    {trade.status === 'won' ? 'Won' : 'Lost'}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default DerivBottomPanel;
