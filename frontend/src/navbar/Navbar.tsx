import React, { useState, useEffect, useRef } from 'react';
import { HiFunnel, HiSparkles, HiChevronLeft, HiSquares2X2, HiListBullet, HiPhoto } from 'react-icons/hi2';

interface NavbarProps {
  pageName: string;
  currentPath?: string;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  isAISearchOpen?: boolean;
  onAIClick?: () => void;
  onGoUp?: () => void;
  canGoUp?: boolean;
  viewMode?: 'list' | 'grid' | 'render';
  onViewModeChange?: (mode: 'list' | 'grid' | 'render') => void;
}

const Navbar: React.FC<NavbarProps> = ({ pageName, currentPath, searchQuery = '', onSearch, isAISearchOpen = false, onAIClick, onGoUp, canGoUp = true, viewMode = 'list', onViewModeChange }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [copied, setCopied] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCopyPath = () => {
    if (currentPath) {
      navigator.clipboard.writeText(currentPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSearchChange = (value: string) => {
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className="w-full  flex items-center justify-between px-6 py-2">
      {/* Left side - Back button and Page name */}
      <div className="flex items-center gap-2">
        {onGoUp && (
          <button
            onClick={canGoUp ? onGoUp : undefined}
            disabled={!canGoUp}
            className={`p-1.5 rounded-lg transition-colors ${
              canGoUp ? 'hover:bg-gray-200 cursor-pointer' : 'cursor-not-allowed opacity-40'
            }`}
            title={canGoUp ? "Go up one directory (⌘B)" : "Cannot go up"}
          >
            <HiChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <h1 className="text-base font-semibold text-gray-900">{pageName}</h1>
      </div>

      {/* Right side - Icons and search */}
      <div className="flex items-center gap-2">
        {/* Current path display */}
        {currentPath && (
          <button
            onClick={handleCopyPath}
            className={`text-xs text-gray-600 mr-2 max-w-xs truncate px-3 py-1 rounded transition-colors cursor-pointer ${
              copied ? 'bg-green-200 hover:bg-green-300' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            title={copied ? 'Copied!' : 'Click to copy path'}
          >
            {copied ? '✓ Copied!' : currentPath}
          </button>
        )}
        {/* Filter icon */}
        <button className="p-2 hover:bg-gray-300 rounded-lg transition-colors">
          <HiFunnel className="w-5 h-3 text-gray-600" />
        </button>

        {/* AI icon */}
        <button
          onClick={onAIClick}
          className="p-2 hover:bg-gray-300 rounded-lg transition-colors"
        >
          <HiSparkles className={`w-5 h-5 transition-colors ${isAISearchOpen ? 'text-yellow-500' : 'text-gray-600'}`} />
        </button>

        {/* View mode icons */}
        {onViewModeChange && (
          <div className="flex items-center gap-1 border-l border-gray-300 pl-2 ml-2">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-gray-300' : 'hover:bg-gray-200'
              }`}
              title="Grid view"
            >
              <HiSquares2X2 className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-gray-300' : 'hover:bg-gray-200'
              }`}
              title="List view"
            >
              <HiListBullet className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => onViewModeChange('render')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'render' ? 'bg-gray-300' : 'hover:bg-gray-200'
              }`}
              title="Render view"
            >
              <HiPhoto className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        {/* Search bar */}
        <div className="relative w-[250px]">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="bg-transparent outline-none text-sm text-gray-900 flex-1 placeholder-gray-400"
              placeholder="Search..."
            />
            {!isFocused && searchQuery === '' && (
              <span className="text-sm text-gray-500 flex items-center gap-1 pointer-events-none absolute right-4">
                <span className="font-semibold text-gray-600">⌘</span>
                <span className="text-gray-400">+</span>
                <span className="font-semibold text-gray-600">K</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

