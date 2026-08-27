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
import { isDigitContract } from '@/lib/trade-config';

const Dashboard = () => {
  const [selectedAsset, setSelectedAsset] = useState('Volatility 75 Index');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tradeType, setTradeType] = useState('rise_fall');
  const [selectedDigit, setSelectedDigit] = useState(5);
  const [stake, setStake] = useState('10');
  const [duration, setDuration] = useState('1');
  const [durationType, setDurationType] = useState('t');
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);

  const showDigitStats = isDigitContract(tradeType);

  const handleTradePlaced = () => {
    setBalanceRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
      <DerivHeader onMenuClick={() => setIsSidebarOpen(true)} balanceRefreshKey={balanceRefreshKey} />

      <div className="flex flex-1 overflow-hidden">
        <DerivSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-w-0 flex">
            <div className="flex-1 min-w-0 flex flex-col pb-[27rem] md:pb-0">
              <TradeTypeNavBar tradeType={tradeType} onTradeTypeChange={setTradeType} />

              {showDigitStats ? (
                <>
                  <AssetPriceBar selectedAsset={selectedAsset} onAssetChange={setSelectedAsset} />
                  <DigitStatsDisplay selectedDigit={selectedDigit} />
                </>
              ) : (
                <DerivChart selectedAsset={selectedAsset} onAssetChange={setSelectedAsset} />
              )}
              <DerivBottomPanel refreshKey={balanceRefreshKey} />
            </div>

            <div className="hidden md:block w-80 border-l border-[#323738]">
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
