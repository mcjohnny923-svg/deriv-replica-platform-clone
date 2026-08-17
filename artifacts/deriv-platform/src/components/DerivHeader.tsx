import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Check, Bell, HelpCircle, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStoredAccount } from '@/lib/auth-api';

interface DerivHeaderProps {
  onMenuClick?: () => void;
  balanceRefreshKey?: number;
}

const DerivHeader = ({ onMenuClick, balanceRefreshKey }: DerivHeaderProps) => {
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [account, setAccount] = useState(getStoredAccount());

  useEffect(() => {
    setAccount(getStoredAccount());
  }, [balanceRefreshKey]);

  const displayType = account?.type ?? 'demo';
  const displayBalance = account ? Number(account.balance).toFixed(2) : '0.00';
  const displayCurrency = account?.currency ?? 'USD';

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
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-[#323738] h-8 w-8">
          <Bell className="h-4 w-4" />
        </Button>

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
              <div className="text-[10px] text-gray-400 capitalize">{displayType}</div>
              <div className="text-xs font-medium text-white whitespace-nowrap">
                {displayCurrency} {displayBalance}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>

          {accountDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-60 bg-[#323738] border border-[#414647] rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between w-full px-4 py-3">
                <div className="text-left">
                  <div className="text-sm font-medium text-white capitalize">{displayType}</div>
                  <div className="text-xs text-gray-400">
                    {displayCurrency} {displayBalance}
                  </div>
                </div>
                <Check className="h-4 w-4 text-red-500" />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DerivHeader;
