import React from 'react';
import { HiArrowDownTray, HiDocumentText, HiCube, HiMusicalNote } from 'react-icons/hi2';

const Sidebar = () => {
  const menuItems = [
    { name: 'Downloads', icon: HiArrowDownTray },
    { name: 'Documents', icon: HiDocumentText },
    { name: 'Applications', icon: HiCube },
    { name: 'Media', icon: HiMusicalNote }
  ];

  return (
    <div className="w-[15%] px-2 h-screen bg-gray-100 flex flex-col">
      <div className="p-2">
        <h3 className="m-0 text-xl font-cinzel font-semibold text-gray-900 tracking-wider">NORN</h3>
      </div>
      <nav className="py-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.name} 
              className="flex items-center px-2 py-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-200"
            >
              <Icon className="text-xl mr-3 text-gray-600" />
              <span className="text-sm text-gray-900">{item.name}</span>
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;

