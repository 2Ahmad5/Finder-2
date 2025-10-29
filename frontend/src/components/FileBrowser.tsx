import React, { useState, useEffect } from 'react';
import { GetFolderContents, OpenFile, OpenApplication, SortByName, SortByDate, SortBySize, SearchFilenames, GetHomeDirectory } from '../../wailsjs/go/main/App';
import { FileItem as FileItemType } from '../types/filesystem';
import FileItem from './FileItem';
import Navbar from '../navbar/Navbar';
import ContextMenu from './ContextMenu';
import { HiChevronUp, HiChevronDown } from 'react-icons/hi2';

interface FileBrowserProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  isAISearchOpen?: boolean;
}

type SortColumn = 'name' | 'date' | 'size';
type SortDirection = 'asc' | 'desc';

const FileBrowser: React.FC<FileBrowserProps> = ({ currentPath, onNavigate, searchQuery, onSearch, isAISearchOpen = false }) => {
  const [files, setFiles] = useState<FileItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string } | null>(null);

  useEffect(() => {
    if (!currentPath) return;

    setLoading(true);
    setError(null);

    // Handle search mode
    if (currentPath === 'search' && searchQuery) {
      // Get user's home directory from backend
      GetHomeDirectory()
        .then((homeDir) => {
          // Search filenames using fd (fast and reliable)
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
          setFiles(items);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.toString());
          setLoading(false);
        });
    }
  }, [currentPath, searchQuery]);

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

  const handleContextMenu = (path: string, x: number, y: number) => {
    setContextMenu({ x, y, path });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const refreshFiles = () => {
    // Trigger a re-fetch by updating the effect dependency
    if (currentPath === 'search' && searchQuery) {
      // Re-run search
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
      // Re-fetch folder contents
      GetFolderContents(currentPath)
        .then(setFiles)
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
  const viewMode = isApplicationsFolder ? 'grid' : 'list';

  return (
    <div className="flex-1 h-full overflow-auto bg-white flex flex-col">
      <Navbar pageName={getFolderName(currentPath)} currentPath={currentPath === 'search' ? undefined : currentPath} searchQuery={searchQuery} onSearch={onSearch} isAISearchOpen={isAISearchOpen} />
      <div className="flex-1 overflow-auto px-6 py-2">
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
