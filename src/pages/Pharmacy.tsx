import { Pill } from 'lucide-react';

export const Pharmacy = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-12">
    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
      <Pill size={28} className="text-yellow-600" />
    </div>
    <h2 className="text-xl font-bold text-gray-900 mb-1">Pharmacy</h2>
    <p className="text-gray-400 text-sm">This module is coming in a future sprint.</p>
  </div>
);