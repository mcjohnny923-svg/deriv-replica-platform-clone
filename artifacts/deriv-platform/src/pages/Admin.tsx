import { useState, useEffect } from 'react';
import { Lock, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchAdminUsers, type AdminUser } from '@/lib/admin-api';

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
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      setKeyInput(saved);
      loadUsers(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    loadUsers(keyInput.trim());
  };

  const handleRefresh = () => {
    if (adminKey) loadUsers(adminKey);
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
          <h1 className="text-2xl font-bold">Users</h1>
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

        <div className="bg-[#151717] border border-[#323738] rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#323738] text-left text-gray-400">
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Full name</th>
                <th className="p-3 font-medium">Phone</th>
                <th className="p-3 font-medium">Demo balance</th>
                <th className="p-3 font-medium">Real balance</th>
                <th className="p-3 font-medium">Joined</th>
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
                  <td className="p-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
