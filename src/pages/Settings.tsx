import { Settings as SettingsIcon } from 'lucide-react';

export const Settings = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-12">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <SettingsIcon size={28} className="text-gray-600" />
    </div>
    <h2 className="text-xl font-bold text-gray-900 mb-1">Settings</h2>
    <p className="text-gray-400 text-sm">This module is coming in a future sprint.</p>
  </div>
);