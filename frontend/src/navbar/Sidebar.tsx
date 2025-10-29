import React, { useState, useEffect } from 'react';
import { HiFolder, HiDocument, HiArrowDownTray, HiMusicalNote, HiCube, HiMagnifyingGlass, HiLink } from 'react-icons/hi2';
import { GetHomeFolders } from '../../wailsjs/go/main/App';
import { Folder } from '../types/filesystem';

interface SidebarProps {
  onFolderSelect: (path: string) => void;
  currentPath: string;
  hasSearchQuery: boolean;
  isAISearchOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onFolderSelect, currentPath, hasSearchQuery, isAISearchOpen = false }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GetHomeFolders()
      .then((items) => {
        setFolders(items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading folders:', err);
        setLoading(false);
      });
  }, []);

  const getIcon = (folderName: string) => {
    switch (folderName) {
      case 'Applications':
        return <HiCube className="text-xl mr-3 text-gray-600" />;
      case 'Documents':
        return <HiDocument className="text-xl mr-3 text-gray-600" />;
      case 'Downloads':
        return <HiArrowDownTray className="text-xl mr-3 text-gray-600" />;
      case 'Media':
        return <HiMusicalNote className="text-xl mr-3 text-gray-600" />;
      default:
        return <HiFolder className="text-xl mr-3 text-gray-600" />;
    }
  };

  const isSearchActive = currentPath === 'search';
  const isConnectionsActive = currentPath === 'connections';

  return (
    <div className="w-[15%] px-2 h-screen bg-gray-100 flex flex-col">
      <div className="p-2">
        <h3 className="m-0 text-xl font-cinzel font-semibold text-gray-900 tracking-wider">Ahmad</h3>
      </div>
      <nav className="py-3">
        {loading && <p className="text-xs text-gray-500 px-2">Loading...</p>}
        {!loading && folders.map((folder) => {
          const isActive = currentPath === folder.path;
          return (
            <div
              key={folder.path}
              className={`flex items-center px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                isActive ? 'bg-gray-300' : 'hover:bg-gray-200'
              }`}
              onClick={() => onFolderSelect(folder.path)}
            >
              {getIcon(folder.name)}
              <span className="text-sm text-gray-900">{folder.name}</span>
            </div>
          );
        })}

        {/* Divider */}
        <div className="my-2 border-t border-gray-300"></div>

        {/* Search option */}
        <div
          className={`flex items-center px-2 py-2 rounded-lg transition-colors ${
            !hasSearchQuery
              ? 'text-gray-400 cursor-not-allowed'
              : isSearchActive
                ? 'bg-gray-300 cursor-pointer'
                : 'hover:bg-gray-200 cursor-pointer'
          }`}
          onClick={() => hasSearchQuery && onFolderSelect('search')}
        >
          <HiMagnifyingGlass className="text-xl mr-3" />
          <span className="text-sm">Search</span>
        </div>

        {/* Connections option */}
        <div
          className={`flex items-center px-2 py-2 rounded-lg cursor-pointer transition-colors ${
            isConnectionsActive ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
          onClick={() => onFolderSelect('connections')}
        >
          <HiLink className="text-xl mr-3 text-gray-600" />
          <span className="text-sm">Connections</span>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;

