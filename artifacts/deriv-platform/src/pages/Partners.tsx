import { useState, useEffect } from 'react';
import { Copy, Share2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import DerivHeader from '@/components/DerivHeader';
import DerivSidebar from '@/components/DerivSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { getPartnerSummary, type PartnerSummary } from '@/lib/partners-api';

const Partners = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [summary, setSummary] = useState<PartnerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPartnerSummary()
      .then(setSummary)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const referralLink = summary
    ? `${window.location.origin}/register?ref=${summary.referralCode}`
    : '';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const shareOnWhatsApp = () => {
    const message = encodeURIComponent(
      `Join me on Deriv and start trading! Sign up here: ${referralLink}`,
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
      <DerivHeader onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <DerivSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="max-w-2xl mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-bold">Partners</h1>

            {loading && <div className="text-gray-400 text-sm">Loading...</div>}

            {summary && (
              <>
                {/* Earnings card */}
                <div className="bg-[#151717] rounded-lg p-4 border border-[#323738]">
                  <div className="text-xs text-gray-400">Total earnings</div>
                  <div className="text-2xl font-bold text-white">USD {summary.totalEarnings}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    USD {summary.thisMonthEarnings} this month
                  </div>
                </div>

                {/* Referral link/code */}
                <div className="bg-[#151717] rounded-lg p-4 border border-[#323738]">
                  <h2 className="text-sm font-semibold text-gray-300 mb-3">Your referral link</h2>

                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-1">Referral link</div>
                    <div className="flex items-center gap-2 bg-[#323738] rounded-lg p-2.5">
                      <span className="text-white text-sm flex-1 truncate">{referralLink}</span>
                      <button onClick={() => copyToClipboard(referralLink, 'Referral link')}>
                        <Copy className="h-4 w-4 text-gray-400 hover:text-white shrink-0" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs text-gray-400 mb-1">Referral code</div>
                    <div className="flex items-center gap-2 bg-[#323738] rounded-lg p-2.5">
                      <span className="text-white text-sm font-mono flex-1">{summary.referralCode}</span>
                      <button onClick={() => copyToClipboard(summary.referralCode, 'Referral code')}>
                        <Copy className="h-4 w-4 text-gray-400 hover:text-white shrink-0" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-4">
                    Anyone who signs up through this link becomes your referral. You earn 5% of the stake on every trade they place — win or lose.
                  </p>

                  <div className="flex gap-2">
                    <Button
                      onClick={shareOnWhatsApp}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Share on WhatsApp
                    </Button>
                    <Button
                      onClick={() => copyToClipboard(referralLink, 'Referral link')}
                      variant="outline"
                      className="flex-1 border-[#414647] text-gray-300 hover:bg-[#323738]"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      More options
                    </Button>
                  </div>
                </div>

                {/* Reports */}
                <div className="bg-[#151717] rounded-lg p-4 border border-[#323738]">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Reports</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#323738] rounded-lg p-3">
                      <div className="text-xs text-gray-400">Signups</div>
                      <div className="text-xl font-bold text-white">{summary.signupsCount}</div>
                    </div>
                    <div className="bg-[#323738] rounded-lg p-3">
                      <div className="text-xs text-gray-400">Trades commissioned</div>
                      <div className="text-xl font-bold text-white">{summary.tradesCommissioned}</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <MobileBottomNav onMenuClick={() => setIsSidebarOpen(true)} />
    </div>
  );
};

export default Partners;
