'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div className="page-readable container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Settings</h1>

      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Please connect your wallet to access settings.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Account Section */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Wallet Address</label>
                <input
                  type="text"
                  value={address}
                  disabled
                  className="w-full border rounded-lg px-4 py-2 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Add an extra layer of security</p>
                </div>
                <button
                  onClick={() => setTwoFactor(!twoFactor)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    twoFactor ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      twoFactor ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive updates about your portfolio</p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Default Currency</label>
                <select className="w-full border rounded-lg px-4 py-2">
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Language</label>
                <select className="w-full border rounded-lg px-4 py-2">
                  <option>English</option>
                  <option>Français</option>
                  <option>Español</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
