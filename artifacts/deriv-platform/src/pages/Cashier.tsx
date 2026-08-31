import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, ChevronRight } from 'lucide-react';
import DerivHeader from '@/components/DerivHeader';
import DerivSidebar from '@/components/DerivSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import TopUpModal from '@/components/TopUpModal';
import WithdrawModal from '@/components/WithdrawModal';
import { getStoredAccount } from '@/lib/auth-api';

const Cashier = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const account = getStoredAccount();
  const balance = account
    ? `${account.currency} ${Number(account.balance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : '—';
  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
      <DerivHeader onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <DerivSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="max-w-2xl mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-bold">Cashier</h1>
            <div className="bg-[#151717] rounded-lg p-4 border border-[#323738]">
              <div className="text-xs text-gray-400">Current balance</div>
              <div className="text-lg font-bold text-white">{balance}</div>
              <div className="text-xs text-gray-400 capitalize mt-0.5">{account?.type ?? '—'} account</div>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setTopUpOpen(true)}
                className="w-full flex items-center gap-4 p-4 bg-[#151717] rounded-lg border border-[#323738] hover:bg-[#1c1f1f] transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <ArrowDownCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-white font-semibold">Deposit</div>
                  <div className="text-gray-400 text-sm">Add funds via M-Pesa, Paystack, or card</div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </button>
              <button
                type="button"
                onClick={() => setWithdrawOpen(true)}
                className="w-full flex items-center gap-4 p-4 bg-[#151717] rounded-lg border border-[#323738] hover:bg-[#1c1f1f] transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                  <ArrowUpCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-white font-semibold">Withdraw</div>
                  <div className="text-gray-400 text-sm">Minimum $5</div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <MobileBottomNav onMenuClick={() => setIsSidebarOpen(true)} />
      <TopUpModal open={topUpOpen} onOpenChange={setTopUpOpen} />
      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} accountId={account?.id} />
    </div>
  );
};

export default Cashier;
