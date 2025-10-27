import React from 'react';
import { HiFunnel, HiArrowUpTray, HiPlus } from 'react-icons/hi2';

interface NavbarProps {
  pageName: string;
}

const Navbar: React.FC<NavbarProps> = ({ pageName }) => {
  return (
    <div className="w-full bg-gray-100 flex items-center justify-between px-6 py-2">
      {/* Left side - Page name */}
      <h1 className="text-xl font-semibold text-gray-900">{pageName}</h1>
      
      {/* Right side - Icons and search */}
      <div className="flex items-center gap-2">
        {/* Filter icon */}
        <button className="p-2 hover:bg-gray-300 rounded-lg transition-colors">
          <HiFunnel className="w-5 h-3 text-gray-600" />
        </button>
        
        {/* Share icon */}
        <button className="p-2 hover:bg-gray-300 rounded-lg transition-colors">
          <HiArrowUpTray className="w-5 h-3 text-gray-600" />
        </button>
        
        {/* Plus icon */}
        <button className="p-2 hover:bg-gray-300 rounded-lg transition-colors">
          <HiPlus className="w-5 h-3 text-gray-600" />
        </button>
        
        {/* Search bar */}
        <div className="relative">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-text min-w-[250px]">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <span className="font-semibold text-gray-600">⌘</span>
              <span className="text-gray-400">+</span>
              <span className="font-semibold text-gray-600">K</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

