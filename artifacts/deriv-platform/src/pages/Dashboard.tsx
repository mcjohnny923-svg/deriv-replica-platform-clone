
import { useState } from 'react';
import DerivHeader from '@/components/DerivHeader';
import DerivSidebar from '@/components/DerivSidebar';
import DerivChart from '@/components/DerivChart';
import DerivTradePanel from '@/components/DerivTradePanel';
import DerivBottomPanel from '@/components/DerivBottomPanel';

const Dashboard = () => {
  const [selectedAsset, setSelectedAsset] = useState('Volatility 75 Index');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
              <DerivBottomPanel />
            </div>
            
            {/* Trade panel */}
            <div className="w-80 border-l border-[#323738]">
              <DerivTradePanel selectedAsset={selectedAsset} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
