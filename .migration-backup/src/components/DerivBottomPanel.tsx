
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const DerivBottomPanel = () => {
  const [activeTab, setActiveTab] = useState('open_positions');

  const tabs = [
    { id: 'open_positions', label: 'Open positions', count: 0 },
    { id: 'portfolio', label: 'Portfolio', count: 3 },
    { id: 'statement', label: 'Statement' },
  ];

  return (
    <div className="h-48 bg-[#151717] border-t border-[#323738]">
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
          <div className="text-center py-8">
            <div className="text-gray-400 text-sm">No open positions</div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-2">
            <div className="grid grid-cols-6 gap-4 text-xs text-gray-400 uppercase tracking-wider border-b border-[#323738] pb-2">
              <div>Reference ID</div>
              <div>Asset</div>
              <div>Trade type</div>
              <div>Buy price</div>
              <div>Payout</div>
              <div>Profit/Loss</div>
            </div>
            
            {/* Sample portfolio items */}
            {[1, 2, 3].map((item) => (
              <div key={item} className="grid grid-cols-6 gap-4 text-sm py-2 border-b border-[#323738]/50">
                <div className="text-gray-300">12345678{item}</div>
                <div className="text-white">Volatility 75 Index</div>
                <div className="text-white">Rise</div>
                <div className="text-white">USD 10.00</div>
                <div className="text-white">USD 18.50</div>
                <div className="text-green-400">+USD 8.50</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'statement' && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-sm">No transactions</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DerivBottomPanel;
