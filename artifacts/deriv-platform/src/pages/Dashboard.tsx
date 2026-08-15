import { useState } from 'react';
import DerivHeader from '@/components/DerivHeader';
import DerivSidebar from '@/components/DerivSidebar';
import DerivChart from '@/components/DerivChart';
import DerivTradePanel from '@/components/DerivTradePanel';
import DerivBottomPanel from '@/components/DerivBottomPanel';
import DigitStatsDisplay from '@/components/DigitStatsDisplay';

const DIGIT_TRADE_TYPES = ['matches_differs', 'even_odd', 'over_under'];

const Dashboard = () => {
  const [selectedAsset, setSelectedAsset] = useState('Volatility 75 Index');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [tradeType, setTradeType] = useState('rise_fall');
  const [selectedDigit, setSelectedDigit] = useState<number | null>(null);

  const showDigitStats = DIGIT_TRADE_TYPES.includes(tradeType);

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
      <DerivHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <DerivSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <div className="flex-1 flex flex-col">
          {/* Main trading area */}
          <div className="flex-1 flex">
            {/* Chart and controls area */}
            <div className="flex-1 flex flex-col">
              <DerivChart selectedAsset={selectedAsset} onAssetChange={setSelectedAsset} />
              {showDigitStats && <DigitStatsDisplay selectedDigit={selectedDigit} />}
              <DerivBottomPanel />
            </div>
            
            {/* Trade panel */}
            <div className="w-80 border-l border-[#323738]">
              <DerivTradePanel
                selectedAsset={selectedAsset}
                onTradeTypeChange={setTradeType}
                onDigitChange={setSelectedDigit}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
