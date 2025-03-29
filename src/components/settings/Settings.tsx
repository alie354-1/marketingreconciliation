import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { 
  Settings as SettingsIcon, 
  User,
  Bell,
  Eye,
  Lock,
  Save,
  FileText,
  Moon,
  Sun
} from 'lucide-react';
import { cn } from '../../utils/cn';

export function Settings() {
  const dispatch = useAppDispatch();
  
  // Get user data with type assertion
  const user = useAppSelector(state => {
    const auth = state.auth as { user: any };
    return auth.user || { email: 'user@example.com', role: 'Admin' };
  });
  
  // State for form values
  const [profileForm, setProfileForm] = useState({
    name: user.name || 'Admin User',
    email: user.email || 'user@example.com',
    role: user.role || 'Admin',
  });
  
  const [notificationsForm, setNotificationsForm] = useState({
    emailNotifications: true,
    campaignAlerts: true,
    weeklyReports: true,
    systemUpdates: false,
  });
  
  const [appearanceForm, setAppearanceForm] = useState({
    theme: 'light',
    compactMode: false,
    highContrastMode: false,
  });
  
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Update profile form
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    });
  };
  
  // Update notifications form
  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationsForm({
      ...notificationsForm,
      [key]: value,
    });
  };
  
  // Update appearance form
  const handleAppearanceChange = (key: string, value: any) => {
    setAppearanceForm({
      ...appearanceForm,
      [key]: value,
    });
  };
  
  // Update security form
  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecurityForm({
      ...securityForm,
      [e.target.name]: e.target.value,
    });
  };
  
  // Handle form submissions
  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, dispatch an action to update the profile
    console.log('Profile updated:', profileForm);
  };
  
  const handleSubmitNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, dispatch an action to update notification settings
    console.log('Notification settings updated:', notificationsForm);
  };
  
  const handleSubmitAppearance = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, dispatch an action to update appearance settings
    console.log('Appearance settings updated:', appearanceForm);
  };
  
  const handleSubmitSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, dispatch an action to update password
    console.log('Security settings updated');
    
    // Reset form
    setSecurityForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center mb-6">
        <SettingsIcon className="h-6 w-6 text-primary-500 mr-2" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>
      
      {/* Profile Settings */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <User className="h-5 w-5 text-primary-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmitProfile}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="Name"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                fullWidth
              />
              
              <Input
                label="Email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                fullWidth
              />
              
              <Select
                label="Role"
                value={profileForm.role}
                onChange={(value) => setProfileForm({...profileForm, role: value})}
                options={[
                  { value: 'Admin', label: 'Administrator' },
                  { value: 'Manager', label: 'Campaign Manager' },
                  { value: 'Viewer', label: 'Viewer' },
                ]}
              />
            </div>
            
            <div className="mt-6">
              <Button 
                type="submit" 
                variant="default"
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save Profile
              </Button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Notification Settings */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-primary-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmitNotifications}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">Email Notifications</div>
                  <div className="text-sm text-gray-500">Receive important notifications via email</div>
                </div>
                <div className="relative inline-block h-6 w-11 flex-shrink-0">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={notificationsForm.emailNotifications}
                    onChange={() => handleNotificationChange('emailNotifications', !notificationsForm.emailNotifications)}
                    id="email-notifications"
                  />
                  <label
                    htmlFor="email-notifications"
                    className="block h-6 w-11 cursor-pointer rounded-full bg-gray-200 peer-checked:bg-primary-500 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-5"
                  ></label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">Campaign Alerts</div>
                  <div className="text-sm text-gray-500">Get notified when campaigns start or end</div>
                </div>
                <div className="relative inline-block h-6 w-11 flex-shrink-0">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={notificationsForm.campaignAlerts}
                    onChange={() => handleNotificationChange('campaignAlerts', !notificationsForm.campaignAlerts)}
                    id="campaign-alerts"
                  />
                  <label
                    htmlFor="campaign-alerts"
                    className="block h-6 w-11 cursor-pointer rounded-full bg-gray-200 peer-checked:bg-primary-500 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-5"
                  ></label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">Weekly Reports</div>
                  <div className="text-sm text-gray-500">Receive weekly summary reports</div>
                </div>
                <div className="relative inline-block h-6 w-11 flex-shrink-0">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={notificationsForm.weeklyReports}
                    onChange={() => handleNotificationChange('weeklyReports', !notificationsForm.weeklyReports)}
                    id="weekly-reports"
                  />
                  <label
                    htmlFor="weekly-reports"
                    className="block h-6 w-11 cursor-pointer rounded-full bg-gray-200 peer-checked:bg-primary-500 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-5"
                  ></label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">System Updates</div>
                  <div className="text-sm text-gray-500">Get notified about system updates and maintenance</div>
                </div>
                <div className="relative inline-block h-6 w-11 flex-shrink-0">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={notificationsForm.systemUpdates}
                    onChange={() => handleNotificationChange('systemUpdates', !notificationsForm.systemUpdates)}
                    id="system-updates"
                  />
                  <label
                    htmlFor="system-updates"
                    className="block h-6 w-11 cursor-pointer rounded-full bg-gray-200 peer-checked:bg-primary-500 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-5"
                  ></label>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Button 
                type="submit" 
                variant="default"
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save Notification Settings
              </Button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Appearance Settings */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Eye className="h-5 w-5 text-primary-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Appearance</h2>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmitAppearance}>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Theme</label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={cn(
                      "border rounded-lg p-4 flex items-center cursor-pointer",
                      appearanceForm.theme === 'light' ? "border-primary-500 bg-primary-50" : "border-gray-200"
                    )}
                    onClick={() => handleAppearanceChange('theme', 'light')}
                  >
                    <Sun className="h-5 w-5 text-primary-500 mr-2" />
                    <span>Light Mode</span>
                  </div>
                  
                  <div 
                    className={cn(
                      "border rounded-lg p-4 flex items-center cursor-pointer",
                      appearanceForm.theme === 'dark' ? "border-primary-500 bg-primary-50" : "border-gray-200"
                    )}
                    onClick={() => handleAppearanceChange('theme', 'dark')}
                  >
                    <Moon className="h-5 w-5 text-primary-500 mr-2" />
                    <span>Dark Mode</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">Compact Mode</div>
                  <div className="text-sm text-gray-500">Use a more compact UI layout</div>
                </div>
                <div className="relative inline-block h-6 w-11 flex-shrink-0">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={appearanceForm.compactMode}
                    onChange={() => handleAppearanceChange('compactMode', !appearanceForm.compactMode)}
                    id="compact-mode"
                  />
                  <label
                    htmlFor="compact-mode"
                    className="block h-6 w-11 cursor-pointer rounded-full bg-gray-200 peer-checked:bg-primary-500 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-5"
                  ></label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">High Contrast Mode</div>
                  <div className="text-sm text-gray-500">Increase contrast for better readability</div>
                </div>
                <div className="relative inline-block h-6 w-11 flex-shrink-0">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={appearanceForm.highContrastMode}
                    onChange={() => handleAppearanceChange('highContrastMode', !appearanceForm.highContrastMode)}
                    id="high-contrast-mode"
                  />
                  <label
                    htmlFor="high-contrast-mode"
                    className="block h-6 w-11 cursor-pointer rounded-full bg-gray-200 peer-checked:bg-primary-500 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-5"
                  ></label>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Button 
                type="submit" 
                variant="default"
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save Appearance Settings
              </Button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Security Settings */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Lock className="h-5 w-5 text-primary-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Security</h2>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmitSecurity}>
            <div className="space-y-4">
              <Input
                label="Current Password"
                name="currentPassword"
                type="password"
                value={securityForm.currentPassword}
                onChange={handleSecurityChange}
                fullWidth
              />
              
              <Input
                label="New Password"
                name="newPassword"
                type="password"
                value={securityForm.newPassword}
                onChange={handleSecurityChange}
                fullWidth
              />
              
              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={securityForm.confirmPassword}
                onChange={handleSecurityChange}
                fullWidth
              />
            </div>
            
            <div className="mt-6">
              <Button 
                type="submit" 
                variant="default"
                leftIcon={<Save className="h-4 w-4" />}
              >
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
