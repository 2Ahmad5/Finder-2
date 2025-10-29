import React from 'react';
import Navbar from '../navbar/Navbar';

const API: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-screen bg-white">
      {/* Navbar */}
      <Navbar pageName="Connections" />

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          <p className="text-gray-600">Manage your API connections and integrations here.</p>
          {/* Add your API connection components here */}
        </div>
      </div>
    </div>
  );
};

export default API;
