import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { User, Shield, Bell, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import DerivHeader from '@/components/DerivHeader';
import DerivSidebar from '@/components/DerivSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import {
  getStoredUser,
  getStoredAccount,
  refreshAccounts,
  updateProfile,
  updateStoredUserFields,
  type AuthAccount,
} from '@/lib/auth-api';

const Profile = () => {
  const { theme, setTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const storedUser = getStoredUser();
  const [account, setAccount] = useState<AuthAccount | null>(getStoredAccount());

  useEffect(() => {
    refreshAccounts()
      .then(() => setAccount(getStoredAccount()))
      .catch(() => {});
  }, []);

  const [firstName, lastName] = (storedUser?.fullName ?? '').split(' ');

  const [profile, setProfile] = useState({
    firstName: firstName ?? '',
    lastName: lastName ?? '',
    email: storedUser?.email ?? '',
    phone: storedUser?.phoneNumber ?? '',
    country: storedUser?.country ?? '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    trading: true,
  });

  const handleProfileUpdate = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    const fullName = `${profile.firstName} ${profile.lastName}`.trim();
    setSavingProfile(true);
    try {
      const result = await updateProfile({
        fullName: fullName || undefined,
        country: profile.country || undefined,
        phoneNumber: profile.phone || undefined,
      });
      updateStoredUserFields(result);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleNotificationToggle = (type: keyof typeof notifications, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [type]: value }));
  };

  const memberSince = storedUser?.createdAt
    ? new Date(storedUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—';

  const balance = account
    ? `${account.currency} ${Number(account.balance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : '—';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0e0e0e] text-gray-900 dark:text-white flex flex-col">
      <DerivHeader onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <DerivSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="max-w-2xl mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-bold">Profile Settings</h1>

            {/* Account Summary */}
            <div className="bg-white dark:bg-[#151717] rounded-lg p-4 border border-gray-200 dark:border-[#323738]">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">Account Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400">Account Type</span>
                  <span className="text-gray-900 dark:text-white capitalize">{account?.type ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400">Balance</span>
                  <span className="text-gray-900 dark:text-white font-medium">{balance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400">Member Since</span>
                  <span className="text-gray-900 dark:text-white">{memberSince}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400">Status</span>
                  <span className="text-green-400">Active</span>
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-white dark:bg-[#151717] rounded-lg p-4 border border-gray-200 dark:border-[#323738]">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-4 flex items-center">
                {theme === 'dark' ? <Moon className="h-4 w-4 mr-2" /> : <Sun className="h-4 w-4 mr-2" />}
                Appearance
              </h2>
              <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-[#323738] rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Dark mode</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">Switch between light and dark theme</div>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white dark:bg-[#151717] rounded-lg p-4 border border-gray-200 dark:border-[#323738]">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-4 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Personal Information
              </h2>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <Label className="text-gray-600 dark:text-gray-300 text-xs">First Name</Label>
                  <Input
                    value={profile.firstName}
                    onChange={(e) => handleProfileUpdate('firstName', e.target.value)}
                    className="mt-1 bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-300 text-xs">Last Name</Label>
                  <Input
                    value={profile.lastName}
                    onChange={(e) => handleProfileUpdate('lastName', e.target.value)}
                    className="mt-1 bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-gray-600 dark:text-gray-300 text-xs">Email Address</Label>
                  <Input
                    value={profile.email}
                    disabled
                    className="mt-1 bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] text-gray-400 dark:text-gray-500 dark:text-gray-400"
                  />
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-300 text-xs">Phone Number</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="mt-1 bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-300 text-xs">Country</Label>
                  <Input
                    value={profile.country}
                    onChange={(e) => handleProfileUpdate('country', e.target.value)}
                    placeholder="Not set"
                    className="mt-1 bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="mt-4 w-full bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {savingProfile ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>

            {/* Security */}
            <div className="bg-white dark:bg-[#151717] rounded-lg p-4 border border-gray-200 dark:border-[#323738]">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-4 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-[#323738] rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">Add an extra layer of security</div>
                  </div>
                  <Switch />
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-[#323738] rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Email Verification</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">Verify trades via email</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button variant="outline" className="w-full border-gray-300 dark:border-[#414647] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#323738]">
                  Change Password
                </Button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-[#151717] rounded-lg p-4 border border-gray-200 dark:border-[#323738]">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-4 flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Email Notifications</span>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => handleNotificationToggle('email', checked)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">SMS Notifications</span>
                  <Switch
                    checked={notifications.sms}
                    onCheckedChange={(checked) => handleNotificationToggle('sms', checked)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Push Notifications</span>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) => handleNotificationToggle('push', checked)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Trading Alerts</span>
                  <Switch
                    checked={notifications.trading}
                    onCheckedChange={(checked) => handleNotificationToggle('trading', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MobileBottomNav onMenuClick={() => setIsSidebarOpen(true)} />
    </div>
  );
};

export default Profile;
