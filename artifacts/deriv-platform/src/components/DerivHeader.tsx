import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Check, HelpCircle, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStoredAccounts, getActiveAccountType, setActiveAccountType, type AuthAccount } from '@/lib/auth-api';
import TopUpModal from '@/components/TopUpModal';

interface DerivHeaderProps {
  onMenuClick?: () => void;
  balanceRefreshKey?: number;
  onAccountSwitch?: () => void;
}

const DerivHeader = ({ onMenuClick, balanceRefreshKey, onAccountSwitch }: DerivHeaderProps) => {
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [accounts, setAccounts] = useState<AuthAccount[]>(getStoredAccounts());
  const [activeType, setActiveType] = useState(getActiveAccountType());

  useEffect(() => {
    setAccounts(getStoredAccounts());
    setActiveType(getActiveAccountType());
  }, [balanceRefreshKey]);

  const activeAccount = accounts.find((a) => a.type === activeType) ?? accounts[0];
  const displayBalance = activeAccount
    ? Number(activeAccount.balance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0.00';
  const displayCurrency = activeAccount?.currency ?? 'USD';
  const typeColorClass = activeType === 'real' ? 'text-green-500' : 'text-orange-400';

  const handleSwitch = (type: 'demo' | 'real') => {
    setActiveAccountType(type);
    setActiveType(type);
    setAccountDropdownOpen(false);
    onAccountSwitch?.();
  };

  return (
    <header className="bg-[#151717] border-b border-[#323738] h-14 px-3 flex items-center justify-between">
      {/* Left section - Menu, logo and navigation */}
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="text-gray-300 hover:text-white hover:bg-[#323738] md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link to="/" className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-red-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">D</span>
          </div>
          <span className="text-lg font-bold text-white hidden sm:inline">Deriv</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-1">
          <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-[#323738]">
            Trade
          </Button>
          <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-[#323738]">
            Markets
          </Button>
          <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-[#323738]">
            Trading tools
          </Button>
        </nav>
      </div>

      {/* Right section - Account and controls */}
      <div className="flex items-center space-x-2">
        {/* Help */}
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex text-gray-300 hover:text-white hover:bg-[#323738] h-8 w-8">
          <HelpCircle className="h-4 w-4" />
        </Button>

        {/* Account switcher */}
        <div className="relative">
          <button
            onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#323738] rounded hover:bg-[#414647] transition-colors"
          >
            <div className="text-left leading-tight">
              <div className={`text-[10px] font-semibold capitalize ${typeColorClass}`}>{activeType}</div>
              <div className="text-xs font-bold text-white whitespace-nowrap">
                {displayCurrency} {displayBalance}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>

          {accountDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-[#323738] border border-[#414647] rounded-lg shadow-lg z-50 overflow-hidden">
              {(['demo', 'real'] as const).map((type) => {
                const acc = accounts.find((a) => a.type === type);
                const balance = acc
                  ? Number(acc.balance).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : '0.00';
                const colorClass = type === 'real' ? 'text-green-500' : 'text-orange-400';
                return (
                  <button
                    key={type}
                    onClick={() => handleSwitch(type)}
                    className="flex items-center justify-between w-full px-4 py-3 hover:bg-[#414647] transition-colors"
                  >
                    <div className="text-left">
                      <div className={`text-sm font-semibold capitalize ${colorClass}`}>{type}</div>
                      <div className="text-xs font-bold text-white">
                        {acc?.currency ?? 'USD'} {balance}
                      </div>
                    </div>
                    {activeType === type && <Check className="h-4 w-4 text-red-500" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Deposit button - opens the Top Up Funds modal */}
        <Button
          onClick={() => setTopUpOpen(true)}
          className="bg-red-500 hover:bg-red-600 text-white h-9 px-4 rounded-full font-semibold text-sm"
        >
          Deposit
        </Button>
      </div>

      <TopUpModal open={topUpOpen} onOpenChange={setTopUpOpen} />
    </header>
  );
};

export default DerivHeader;
