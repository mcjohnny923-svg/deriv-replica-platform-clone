import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  Briefcase,
  CreditCard,
  Users,
  User,
  Settings,
  Menu,
  X,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getActiveAccountType, getToken } from '@/lib/auth-api';

interface DerivSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const DerivSidebar = ({ isOpen, onToggle }: DerivSidebarProps) => {
  const location = useLocation();
  const [activeType, setActiveType] = useState<'demo' | 'real'>(getActiveAccountType());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(getToken() !== null);

  useEffect(() => {
    const refresh = () => {
      setActiveType(getActiveAccountType());
      setIsLoggedIn(getToken() !== null);
    };
    window.addEventListener('auth-changed', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('auth-changed', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const menuItems = [
    { icon: BarChart3, label: 'Trade', path: '/dashboard' },
    { icon: Bot, label: 'Automate', path: '/automate' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    { icon: Briefcase, label: 'Portfolio', path: '/portfolio' },
    { icon: CreditCard, label: 'Cashier', path: '/cashier' },
    { icon: Users, label: 'Partners', path: '/partners' },
  ];

  const accountItems = [
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={onToggle} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative top-0 left-0 h-full bg-white dark:bg-[#151717] border-r border-gray-200 dark:border-[#323738] z-50 transition-transform duration-300 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isOpen ? 'w-64' : 'w-16'}
      `}>
        {/* Toggle button */}
        <div className="p-4 border-b border-gray-200 dark:border-[#323738]">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#323738]"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation items */}
        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors group ${
                    isActive(item.path)
                      ? 'bg-red-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#323738] hover:text-gray-900 dark:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {isOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>

          <div className="my-4 border-t border-gray-200 dark:border-[#323738]" />

          <ul className="space-y-2">
            {accountItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors group ${
                    isActive(item.path)
                      ? 'bg-red-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#323738] hover:text-gray-900 dark:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {isOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom section - Account info */}
        {isOpen && isLoggedIn && (
          <div className="shrink-0 p-4 border-t border-gray-200 dark:border-[#323738]">
            <div className="text-center">
              <div className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">Trading with</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">{activeType} Account</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400 mt-1">
                Server: NOVBINARY-{activeType === 'real' ? 'Real' : 'Demo'}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DerivSidebar;
