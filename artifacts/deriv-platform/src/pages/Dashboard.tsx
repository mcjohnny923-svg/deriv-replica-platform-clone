import { useState } from 'react';
import DerivHeader from '@/components/DerivHeader';
import DerivSidebar from '@/components/DerivSidebar';
import DerivChart from '@/components/DerivChart';
import DerivTradePanel from '@/components/DerivTradePanel';
import DerivBottomPanel from '@/components/DerivBottomPanel';
import DigitStatsDisplay from '@/components/DigitStatsDisplay';
import MobileTradeDrawer from '@/components/MobileTradeDrawer';
import AssetPriceBar from '@/components/AssetPriceBar';
import { isDigitContract } from '@/lib/trade-config';

const Dashboard = () => {
  const [selectedAsset, setSelectedAsset] = useState('Volatility 75 Index');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [tradeType, setTradeType] = useState('rise_fall');
  const [selectedDigit, setSelectedDigit] = useState(5);
  const [stake, setStake] = useState('10');
  const [duration, setDuration] = useState('1');
  const [durationType, setDurationType] = useState('t');

  const showDigitStats = isDigitContract(tradeType);

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
      <DerivHeader onMenuClick={() => setIsSidebarOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <DerivSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 flex flex-col">
          {/* Main trading area */}
          <div className="flex-1 flex">
            {/* Chart and controls area */}
            <div className="flex-1 flex flex-col pb-64 md:pb-0">
              {showDigitStats ? (
                <>
                  <AssetPriceBar selectedAsset={selectedAsset} onAssetChange={setSelectedAsset} />
                  <DigitStatsDisplay selectedDigit={selectedDigit} />
                </>
              ) : (
                <DerivChart selectedAsset={selectedAsset} onAssetChange={setSelectedAsset} />
              )}
              <DerivBottomPanel />
            </div>

            {/* Trade panel, desktop only */}
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
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trade drawer, mobile only */}
      <MobileTradeDrawer
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
      />
    </div>
  );
};

export default Dashboard;
