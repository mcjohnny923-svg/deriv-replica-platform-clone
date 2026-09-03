import { useState, useEffect, Fragment } from 'react';
import { Lock, Loader2, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  fetchAdminUsers,
  fetchAdminPartners,
  setUserSuspended,
  setUserAutoWithdraw,
  type AdminUser,
  type AdminPartner,
} from '@/lib/admin-api';
import AdminBalanceModal from '@/components/AdminBalanceModal';

const SESSION_KEY = 'admin_key';

function formatBalance(accounts: AdminUser['accounts'], type: 'demo' | 'real'): string {
  const acc = accounts.find((a) => a.type === type);
  if (!acc) return '—';
  return `${acc.currency} ${Number(acc.balance).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const Admin = () => {
  const [adminKey, setAdminKey] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [tab, setTab] = useState<'users' | 'partners'>('users');
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [partners, setPartners] = useState<AdminPartner[] | null>(null);
  const [expandedPartner, setExpandedPartner] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [balanceModalUser, setBalanceModalUser] = useState<AdminUser | null>(null);

  const loadUsers = async (key: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchAdminUsers(key);
      setUsers(result);
      setAdminKey(key);
      sessionStorage.setItem(SESSION_KEY, key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setUsers(null);
      sessionStorage.removeItem(SESSION_KEY);
    } finally {
      setLoading(false);
    }
  };

  const loadPartners = async (key: string) => {
    setLoading(true);
    try {
      const result = await fetchAdminPartners(key);
      setPartners(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      setKeyInput(saved);
      loadUsers(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (adminKey && tab === 'partners' && !partners) {
      loadPartners(adminKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, adminKey]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    loadUsers(keyInput.trim());
  };

  const handleRefresh = () => {
    if (!adminKey) return;
    if (tab === 'users') loadUsers(adminKey);
    else loadPartners(adminKey);
  };

  const handleToggleSuspend = async (user: AdminUser) => {
    try {
      await setUserSuspended(adminKey, user.id, !user.isSuspended);
      setUsers((prev) =>
        prev ? prev.map((u) => (u.id === user.id ? { ...u, isSuspended: !u.isSuspended } : u)) : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update suspension');
    }
  };

  const handleToggleAutoWithdraw = async (user: AdminUser) => {
    try {
      await setUserAutoWithdraw(adminKey, user.id, !user.autoWithdraw);
      setUsers((prev) =>
        prev ? prev.map((u) => (u.id === user.id ? { ...u, autoWithdraw: !u.autoWithdraw } : u)) : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update auto-withdraw setting');
    }
  };

  if (!users) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] text-white flex items-center justify-center p-4">
        <form
          onSubmit={handleUnlock}
          className="w-full max-w-sm bg-[#151717] border border-[#323738] rounded-lg p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <Lock className="h-5 w-5" />
            Admin Access
          </div>
          <Input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Admin key"
            className="bg-[#323738] border-[#414647] text-white"
            autoFocus
          />
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Unlock'}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('users')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'users' ? 'bg-red-600 text-white' : 'bg-[#151717] text-gray-400 hover:text-white'
              }`}
            >
              Users
            </button>
            <button
              type="button"
              onClick={() => setTab('partners')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'partners' ? 'bg-red-600 text-white' : 'bg-[#151717] text-gray-400 hover:text-white'
              }`}
            >
              Partners
            </button>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="ghost"
            className="text-gray-300 hover:text-white hover:bg-[#323738]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}

        {tab === 'users' && (
          <div className="bg-[#151717] border border-[#323738] rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#323738] text-left text-gray-400">
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Full name</th>
                  <th className="p-3 font-medium">Phone</th>
                  <th className="p-3 font-medium">Demo balance</th>
                  <th className="p-3 font-medium">Real balance</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Auto-Withdraw</th>
                  <th className="p-3 font-medium">Joined</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#232728] last:border-0">
                    <td className="p-3 text-white">{u.email}</td>
                    <td className="p-3 text-gray-300">{u.fullName ?? '—'}</td>
                    <td className="p-3 text-gray-300">{u.phoneNumber ?? '—'}</td>
                    <td className="p-3 text-orange-400">{formatBalance(u.accounts, 'demo')}</td>
                    <td className="p-3 text-green-400">{formatBalance(u.accounts, 'real')}</td>
                    <td className="p-3">
                      {u.isSuspended ? (
                        <span className="text-red-400 font-medium">Suspended</span>
                      ) : (
                        <span className="text-green-500 font-medium">Active</span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleToggleAutoWithdraw(u)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                          u.autoWithdraw
                            ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                            : 'bg-[#232728] text-gray-400 hover:bg-[#2a2f2f]'
                        }`}
                      >
                        {u.autoWithdraw ? 'On' : 'Off'}
                      </button>
                    </td>
                    <td className="p-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setBalanceModalUser(u)}
                          className="px-3 py-1.5 rounded-md bg-[#232728] text-white text-xs font-medium hover:bg-[#2a2f2f]"
                        >
                          Add balance
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSuspend(u)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                            u.isSuspended
                              ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                              : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                          }`}
                        >
                          {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-gray-500">
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'partners' && (
          <div className="bg-[#151717] border border-[#323738] rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#323738] text-left text-gray-400">
                  <th className="p-3 font-medium w-8"></th>
                  <th className="p-3 font-medium">Partner</th>
                  <th className="p-3 font-medium">Referral code</th>
                  <th className="p-3 font-medium">Signups</th>
                  <th className="p-3 font-medium">Total commission</th>
                </tr>
              </thead>
              <tbody>
                {(partners ?? []).map((p) => (
                  <Fragment key={p.id}>
                    <tr
                      className="border-b border-[#232728] cursor-pointer hover:bg-[#1c1f1f]"
                      onClick={() => setExpandedPartner(expandedPartner === p.id ? null : p.id)}
                    >
                      <td className="p-3 text-gray-400">
                        {expandedPartner === p.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </td>
                      <td className="p-3 text-white">
                        {p.email}
                        {p.fullName && <span className="text-gray-500"> · {p.fullName}</span>}
                      </td>
                      <td className="p-3 text-gray-300">{p.referralCode ?? '—'}</td>
                      <td className="p-3 text-gray-300">{p.signupsCount}</td>
                      <td className="p-3 text-green-400 font-semibold">${p.totalCommission}</td>
                    </tr>
                    {expandedPartner === p.id && (
                      <tr className="border-b border-[#232728] bg-[#0e0e0e]">
                        <td></td>
                        <td colSpan={4} className="p-3">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-500 text-left">
                                <th className="pb-2 font-medium">Referred user</th>
                                <th className="pb-2 font-medium">Joined</th>
                                <th className="pb-2 font-medium">Total deposited</th>
                              </tr>
                            </thead>
                            <tbody>
                              {p.referredUsers.map((u) => (
                                <tr key={u.id} className="text-gray-300">
                                  <td className="py-1">{u.email}</td>
                                  <td className="py-1">{new Date(u.createdAt).toLocaleDateString()}</td>
                                  <td className="py-1 text-green-400">${u.totalDeposited}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {partners !== null && partners.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">
                      No partners with signups yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {balanceModalUser && (
        <AdminBalanceModal
          open={!!balanceModalUser}
          onOpenChange={(open) => !open && setBalanceModalUser(null)}
          adminKey={adminKey}
          userId={balanceModalUser.id}
          userEmail={balanceModalUser.email}
          accounts={balanceModalUser.accounts}
          onSuccess={() => loadUsers(adminKey)}
        />
      )}
    </div>
  );
};

export default Admin;
