import { Link, useLocation } from 'react-router-dom';
import { Home, LineChart, Bot, Clock, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

const MobileBottomNav = ({ onMenuClick }: MobileBottomNavProps) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const items = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: LineChart, label: 'Trade', path: '/dashboard' },
    { icon: Bot, label: 'Automate', path: '/automate' },
    { icon: Clock, label: 'Positions', path: '/positions' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#151717] border-t border-[#323738] flex items-stretch md:hidden">
      {items.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${
            isActive(item.path) ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          <item.icon className="h-5 w-5" />
          <span className="text-[11px]">{item.label}</span>
        </Link>
      ))}
      <button
        onClick={onMenuClick}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-gray-400"
      >
        <Menu className="h-5 w-5" />
        <span className="text-[11px]">Menu</span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
