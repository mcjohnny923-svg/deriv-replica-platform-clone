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
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DerivSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const DerivSidebar = ({ isOpen, onToggle }: DerivSidebarProps) => {
  const location = useLocation();

  const menuItems = [
    { icon: BarChart3, label: 'Trade', path: '/dashboard' },
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
        fixed md:relative top-0 left-0 h-full bg-[#151717] border-r border-[#323738] z-50 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isOpen ? 'w-64' : 'w-16'}
      `}>
        {/* Toggle button */}
        <div className="p-4 border-b border-[#323738]">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-gray-300 hover:text-white hover:bg-[#323738]"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation items */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors group ${
                    isActive(item.path)
                      ? 'bg-red-500 text-white'
                      : 'text-gray-300 hover:bg-[#323738] hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {isOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>

          <div className="my-4 border-t border-[#323738]" />

          <ul className="space-y-2">
            {accountItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors group ${
                    isActive(item.path)
                      ? 'bg-red-500 text-white'
                      : 'text-gray-300 hover:bg-[#323738] hover:text-white'
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
        {isOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#323738]">
            <div className="text-center">
              <div className="text-xs text-gray-400">Trading with</div>
              <div className="text-sm font-medium text-white">Demo Account</div>
              <div className="text-xs text-gray-400 mt-1">Server: Deriv-Demo</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DerivSidebar;
