import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, User, Settings, Bell, HelpCircle, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DerivHeaderProps {
  onMenuClick?: () => void;
}

const DerivHeader = ({ onMenuClick }: DerivHeaderProps) => {
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

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
              <div className="text-[10px] text-gray-400">Demo</div>
              <div className="text-xs font-medium text-white whitespace-nowrap">USD 10,000.00</div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>

          {accountDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-[#323738] border border-[#414647] rounded-lg shadow-lg z-50">
              <div className="p-4">
                <div className="text-sm font-medium text-white mb-2">Demo</div>
                <div className="text-lg font-bold text-white">USD 10,000.00</div>
                <div className="text-xs text-gray-400 mt-1">Balance</div>
              </div>
              <div className="border-t border-[#414647] p-2">
                <Link to="/profile">
                  <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#414647]">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#414647]">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DerivHeader;
