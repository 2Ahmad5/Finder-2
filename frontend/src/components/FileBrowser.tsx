import React, { useState, useEffect } from 'react';
import { GetFolderContents, OpenFile, OpenApplication, SortByName, SortByDate, SortBySize, SearchFilenames, GetHomeDirectory } from '../../wailsjs/go/main/App';
import { FileItem as FileItemType } from '../types/filesystem';
import FileItem from './FileItem';
import Navbar from '../navbar/Navbar';
import ContextMenu from '../contextMenu/ContextMenu';
import FileRenderer from './FileRenderer';
import { HiChevronUp, HiChevronDown } from 'react-icons/hi2';

interface FileBrowserProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  isAISearchOpen?: boolean;
  onAIClick?: () => void;
  onGoUp?: () => void;
  refreshTrigger?: number;
}

type SortColumn = 'name' | 'date' | 'size';
type SortDirection = 'asc' | 'desc';

const FileBrowser: React.FC<FileBrowserProps> = ({ currentPath, onNavigate, searchQuery, onSearch, isAISearchOpen = false, onAIClick, onGoUp, refreshTrigger = 0 }) => {
  const [files, setFiles] = useState<FileItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string | null } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'render'>('list');

  useEffect(() => {
    if (!currentPath) return;

    setLoading(true);
    setError(null);

    // Handle search mode
    if (currentPath === 'search' && searchQuery) {
      GetHomeDirectory()
        .then((homeDir) => {
          SearchFilenames(homeDir, searchQuery)
            .then((filenameResults) => {
              const fileItems = (filenameResults || []).map((result: any) => result.fileItem);
              setFiles(fileItems);
              setLoading(false);
            })
            .catch((err) => {
              setError(err.toString());
              setLoading(false);
            });
        })
        .catch((err) => {
          setError(err.toString());
          setLoading(false);
        });
    } else if (currentPath !== 'search') {
      // Normal folder browsing
      GetFolderContents(currentPath)
        .then((items) => {
          setFiles(items || []);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.toString());
          setLoading(false);
        });
    }
  }, [currentPath, searchQuery, refreshTrigger]);

  const handleFileClick = (path: string) => {
    setSelectedFile(path);
  };

  const handleFileDoubleClick = (path: string, isDirectory: boolean, isApp: boolean) => {
    if (isApp) {
      OpenApplication(path)
        .then(() => {
          console.log('Opened application:', path);
        })
        .catch((err) => {
          console.error('Error opening application:', err);
        });
    } else if (isDirectory) {
      onNavigate(path);
    } else {
      OpenFile(path)
        .then(() => {
          console.log('Opened file:', path);
        })
        .catch((err) => {
          console.error('Error opening file:', err);
        });
    }
  };

  const handleContextMenu = (path: string | null, x: number, y: number) => {
    setContextMenu({ x, y, path });
  };

  const handleEmptyContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, path: null });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const refreshFiles = () => {
    if (currentPath === 'search' && searchQuery) {
      GetHomeDirectory()
        .then((homeDir) => {
          SearchFilenames(homeDir, searchQuery)
            .then((filenameResults) => {
              const fileItems = (filenameResults || []).map((result: any) => result.fileItem);
              setFiles(fileItems);
            })
            .catch(console.error);
        })
        .catch(console.error);
    } else if (currentPath !== 'search') {
      GetFolderContents(currentPath)
        .then((items) => setFiles(items || []))
        .catch(console.error);
    }
  };

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const getFolderName = (path: string) => {
    if (!path) return 'Home';
    if (path === 'search') return 'Search Results';
    const parts = path.split('/');
    return parts[parts.length - 1] || 'Home';
  };

  const handleSort = (column: SortColumn) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);

    const ascending = newDirection === 'asc';

    switch (column) {
      case 'name':
        SortByName(files, ascending).then(setFiles);
        break;
      case 'date':
        SortByDate(files, ascending).then(setFiles);
        break;
      case 'size':
        SortBySize(files, ascending).then(setFiles);
        break;
    }
  };

  const isApplicationsFolder = currentPath.endsWith('/Applications');

  // Auto-set grid view for Applications folder, otherwise use user's choice
  useEffect(() => {
    if (isApplicationsFolder) {
      setViewMode('grid');
    }
  }, [isApplicationsFolder]);

  // Determine if we can go up (not at a top-level folder or special page)
  const isSpecialPage = currentPath === 'search' || currentPath === 'connections';
  const isTopLevelFolder = currentPath.endsWith('/Documents') ||
                           currentPath.endsWith('/Downloads') ||
                           currentPath.endsWith('/Applications') ||
                           currentPath.endsWith('/Media');
  const canGoUp = !isSpecialPage && !isTopLevelFolder && currentPath !== '';

  return (
    <div className="flex-1 h-full overflow-auto bg-white flex flex-col">
      <Navbar
        pageName={getFolderName(currentPath)}
        currentPath={currentPath === 'search' ? undefined : currentPath}
        searchQuery={searchQuery}
        onSearch={onSearch}
        isAISearchOpen={isAISearchOpen}
        onAIClick={onAIClick}
        onGoUp={onGoUp}
        canGoUp={canGoUp}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      {viewMode === 'render' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left side - File list without date/size */}
          <div className="w-80 flex-shrink-0 overflow-auto px-6 py-2 border-r border-gray-200">
            {loading && <p className="text-gray-500">Loading...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}
            {!loading && !error && files.length === 0 && (
              <p className="text-gray-500">This folder is empty</p>
            )}
            {!loading && !error && files.length > 0 && (
              <div className="space-y-1">
                {files.map((file) => (
                  <div
                    key={file.path}
                    className={`flex items-center px-3 py-2 cursor-pointer rounded transition-colors ${
                      selectedFile === file.path ? 'bg-blue-100' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleFileClick(file.path)}
                    onDoubleClick={() => handleFileDoubleClick(file.path, file.isDirectory, file.isApp)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleContextMenu(file.path, e.clientX, e.clientY);
                    }}
                  >
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Right side - File renderer */}
          <div className="flex-1 overflow-hidden">
            <FileRenderer file={files.find(f => f.path === selectedFile) || null} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-6 py-2" onContextMenu={handleEmptyContextMenu}>
          {loading && <p className="text-gray-500">Loading...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!loading && !error && files.length === 0 && (
            <p className="text-gray-500">This folder is empty</p>
          )}
          {!loading && !error && files.length > 0 && (
            <>
              {viewMode === 'list' && (
                <div className="flex items-center px-3 py-2 border-b border-gray-200 text-xs font-semibold text-gray-600 mb-1">
                  <div className="flex-1 flex items-center cursor-pointer hover:text-gray-900" onClick={() => handleSort('name')}>
                    <span>Name</span>
                    {sortColumn === 'name' && (
                      sortDirection === 'asc' ? <HiChevronUp className="ml-1 w-3 h-3" /> : <HiChevronDown className="ml-1 w-3 h-3" />
                    )}
                  </div>
                  <div className="w-32 flex items-center cursor-pointer hover:text-gray-900" onClick={() => handleSort('date')}>
                    <span>Date Modified</span>
                    {sortColumn === 'date' && (
                      sortDirection === 'asc' ? <HiChevronUp className="ml-1 w-3 h-3" /> : <HiChevronDown className="ml-1 w-3 h-3" />
                    )}
                  </div>
                  <div className="w-24 flex items-center cursor-pointer hover:text-gray-900" onClick={() => handleSort('size')}>
                    <span>Size</span>
                    {sortColumn === 'size' && (
                      sortDirection === 'asc' ? <HiChevronUp className="ml-1 w-3 h-3" /> : <HiChevronDown className="ml-1 w-3 h-3" />
                    )}
                  </div>
                </div>
              )}
              <div className={viewMode === 'grid' ? 'grid grid-cols-6 gap-4' : 'space-y-1'}>
                {files.map((file) => (
                  <FileItem
                    key={file.path}
                    file={file}
                    onClick={handleFileClick}
                    onDoubleClick={handleFileDoubleClick}
                    onContextMenu={handleContextMenu}
                    isSelected={selectedFile === file.path}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          filePath={contextMenu.path}
          currentDirectory={currentPath}
          onClose={closeContextMenu}
          onRefresh={refreshFiles}
        />
      )}
    </div>
  );
};

export default FileBrowser;
