
import { useState } from 'react';
import { User, Mail, Phone, MapPin, Shield, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import TradingSidebar from '@/components/TradingSidebar';

const Profile = () => {
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    country: 'United States',
    notifications: {
      email: true,
      sms: false,
      push: true,
      trading: true
    }
  });

  const handleProfileUpdate = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationToggle = (type: string, value: boolean) => {
    setProfile(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [type]: value }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <TradingSidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-gray-300">First Name</Label>
                    <Input
                      value={profile.firstName}
                      onChange={(e) => handleProfileUpdate('firstName', e.target.value)}
                      className="mt-1 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Last Name</Label>
                    <Input
                      value={profile.lastName}
                      onChange={(e) => handleProfileUpdate('lastName', e.target.value)}
                      className="mt-1 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Email Address</Label>
                    <Input
                      value={profile.email}
                      onChange={(e) => handleProfileUpdate('email', e.target.value)}
                      className="mt-1 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-gray-300">Phone Number</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                      className="mt-1 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Country</Label>
                    <Input
                      value={profile.country}
                      onChange={(e) => handleProfileUpdate('country', e.target.value)}
                      className="mt-1 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <Button className="mt-6 bg-red-600 hover:bg-red-700">
                  Save Changes
                </Button>
              </div>

              {/* Security Settings */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-white">Two-Factor Authentication</div>
                      <div className="text-sm text-gray-400">Add an extra layer of security</div>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-white">Email Verification</div>
                      <div className="text-sm text-gray-400">Verify trades via email</div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    Change Password
                  </Button>
                </div>
              </div>
            </div>

            {/* Account Summary & Notifications */}
            <div className="space-y-6">
              {/* Account Summary */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Account Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account Type</span>
                    <span className="text-white">Demo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Balance</span>
                    <span className="text-white">$10,000.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Member Since</span>
                    <span className="text-white">Jan 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className="text-green-400">Active</span>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Email Notifications</span>
                    <Switch
                      checked={profile.notifications.email}
                      onCheckedChange={(checked) => handleNotificationToggle('email', checked)}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">SMS Notifications</span>
                    <Switch
                      checked={profile.notifications.sms}
                      onCheckedChange={(checked) => handleNotificationToggle('sms', checked)}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Push Notifications</span>
                    <Switch
                      checked={profile.notifications.push}
                      onCheckedChange={(checked) => handleNotificationToggle('push', checked)}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Trading Alerts</span>
                    <Switch
                      checked={profile.notifications.trading}
                      onCheckedChange={(checked) => handleNotificationToggle('trading', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
