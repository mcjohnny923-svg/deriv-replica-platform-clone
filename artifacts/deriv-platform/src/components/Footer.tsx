
import { Link, useNavigate } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import { getStoredAccounts } from '@/lib/auth-api';

const Footer = () => {
  const navigate = useNavigate();
  const handleProtectedNav = (path: string) => {
    const isLoggedIn = getStoredAccounts().length > 0;
    navigate(isLoggedIn ? path : '/login');
  };

  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-bold">TradePro</span>
            </div>
            <p className="text-gray-400 mb-6">
              Professional trading platform for forex, indices, and synthetic markets.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
              <Twitter className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
              <Linkedin className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
              <Instagram className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* Trading */}
          <div>
            <h3 className="font-semibold mb-4">Trading</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/dashboard" className="hover:text-white">Trading Platform</Link></li>
              <li><Link to="/markets" className="hover:text-white">Markets</Link></li>
              <li><a href="#" className="hover:text-white">Economic Calendar</a></li>
              <li><a href="#" className="hover:text-white">Trading Tools</a></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold mb-4">Account</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/register" className="hover:text-white">Open Account</Link></li>
              <li><Link to="/login" className="hover:text-white">Login</Link></li>
              <li><button type="button" onClick={() => handleProtectedNav('/deposit')} className="hover:text-white text-left">Deposit</button></li>
              <li><button type="button" onClick={() => handleProtectedNav('/cashier')} className="hover:text-white text-left">Withdrawal</button></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">Contact Us</a></li>
              <li><a href="#" className="hover:text-white">Live Chat</a></li>
              <li><a href="#" className="hover:text-white">FAQ</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 TradePro. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Risk Disclosure</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
