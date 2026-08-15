
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  FileText, 
  Briefcase, 
  CreditCard, 
  Settings, 
  Moon, 
  Sun,
  User,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const TradingSidebar = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const location = useLocation();

  const menuItems = [
    { icon: BarChart3, label: 'Trade', path: '/dashboard' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    { icon: Briefcase, label: 'Portfolio', path: '/portfolio' },
    { icon: CreditCard, label: 'Cashier', path: '/cashier' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-xl font-bold text-white">TradePro</span>
        </div>
      </div>

      {/* Account Switcher */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">Demo Account</div>
            <div className="text-xs text-gray-400">Balance: $10,000</div>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            Switch
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-700">
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">Dark Mode</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="text-gray-400 hover:text-white"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        {/* User Menu */}
        <div className="space-y-2">
          <Link to="/profile">
            <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TradingSidebar;
