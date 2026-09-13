import { useState } from 'react';
import DerivHeader from '@/components/DerivHeader';
import DerivSidebar from '@/components/DerivSidebar';
import DerivChart from '@/components/DerivChart';
import DerivTradePanel from '@/components/DerivTradePanel';
import DerivBottomPanel from '@/components/DerivBottomPanel';
import DigitStatsDisplay from '@/components/DigitStatsDisplay';
import MobileTradeDrawer from '@/components/MobileTradeDrawer';
import AssetPriceBar from '@/components/AssetPriceBar';
import MobileBottomNav from '@/components/MobileBottomNav';
import TradeTypeNavBar from '@/components/TradeTypeNavBar';
import { isDigitContract, getOutcomeDigit } from '@/lib/trade-config';
import { useDigitPriceFeed } from '@/hooks/useDigitPriceFeed';
import { getTradeHistory, type Trade } from '@/lib/trades-api';
import { getStoredAccount } from '@/lib/auth-api';
import type { DigitFlashEvent } from '@/components/DigitStatsDisplay';
import { useTradeSettings } from '@/contexts/TradeSettingsContext';

const Dashboard = () => {
  const {
    selectedAsset, setSelectedAsset,
    tradeType, setTradeType,
    selectedDigit, setSelectedDigit,
    stake, setStake,
    duration, setDuration,
    durationType, setDurationType,
  } = useTradeSettings();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);
  const [digitFlash, setDigitFlash] = useState<DigitFlashEvent | null>(null);

  const showDigitStats = isDigitContract(tradeType);
  const priceFeed = useDigitPriceFeed(selectedAsset);

  // Same poll-until-settled pattern used by the Automate bot loop - trades
  // settle lazily server-side, so we poll trade history until this specific
  // trade shows up closed, then flash the real outcome digit.
  const waitForSettlement = async (tradeId: number, accountId: number): Promise<Trade | null> => {
    for (let i = 0; i < 180; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const { closedTrades } = await getTradeHistory(accountId);
      const settled = closedTrades.find((t) => t.id === tradeId);
      if (settled) return settled;
    }
    return null;
  };

  const handleTradePlaced = (_newBalance: string, trade: Trade) => {
    setBalanceRefreshKey((k) => k + 1);

    if (!isDigitContract(trade.tradeType)) return;
    const account = getStoredAccount();
    if (!account) return;

    waitForSettlement(trade.id, account.id).then((settled) => {
      if (!settled) return;
      const outcomeDigit = getOutcomeDigit(settled.exitPrice);
      if (outcomeDigit === null) return;
      setDigitFlash({ digit: outcomeDigit, won: settled.status === 'won', key: Date.now() });
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0e0e0e] text-gray-900 dark:text-white flex flex-col">
      <DerivHeader onMenuClick={() => setIsSidebarOpen(true)} balanceRefreshKey={balanceRefreshKey} />

      <div className="flex flex-1 overflow-hidden">
        <DerivSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-w-0 flex">
            <div className="flex-1 min-w-0 flex flex-col pb-[27rem] md:pb-0">
              <TradeTypeNavBar tradeType={tradeType} onTradeTypeChange={setTradeType} />

              {showDigitStats ? (
                <>
                  <AssetPriceBar
                    selectedAsset={selectedAsset}
                    onAssetChange={setSelectedAsset}
                    price={priceFeed.price}
                    priceChange={priceFeed.priceChange}
                  />
                  <DigitStatsDisplay
                    selectedDigit={selectedDigit}
                    flash={digitFlash}
                    digitHistory={priceFeed.digitHistory}
                    lastDigit={priceFeed.lastDigit}
                    twoRowOnMobile
                  />
                </>
              ) : (
                <DerivChart selectedAsset={selectedAsset} onAssetChange={setSelectedAsset} />
              )}
              <DerivBottomPanel refreshKey={balanceRefreshKey} />
            </div>

            <div className="hidden md:block w-80 border-l border-gray-200 dark:border-[#323738]">
              <DerivTradePanel
                selectedAsset={selectedAsset}
                tradeType={tradeType}
                onTradeTypeChange={setTradeType}
                selectedDigit={selectedDigit}
                onDigitChange={setSelectedDigit}
                stake={stake}
                onStakeChange={setStake}
                duration={duration}
                onDurationChange={setDuration}
                durationType={durationType}
                onDurationTypeChange={setDurationType}
                onTradePlaced={handleTradePlaced}
              />
            </div>
          </div>
        </div>
      </div>

      <MobileTradeDrawer
        selectedAsset={selectedAsset}
        tradeType={tradeType}
        onTradeTypeChange={setTradeType}
        selectedDigit={selectedDigit}
        onDigitChange={setSelectedDigit}
        stake={stake}
        onStakeChange={setStake}
        duration={duration}
        onDurationChange={setDuration}
        durationType={durationType}
        onDurationTypeChange={setDurationType}
        onTradePlaced={handleTradePlaced}
      />

      <MobileBottomNav onMenuClick={() => setIsSidebarOpen(true)} />
    </div>
  );
};

export default Dashboard;
