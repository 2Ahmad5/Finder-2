import React, { useState, useRef, useEffect } from 'react';
import { HiFolder, HiDocument, HiCube } from 'react-icons/hi2';
import { FileItem as FileItemType } from '../types/filesystem';
import AIRecommendation from './AIRecommendation';

interface FileItemProps {
  file: FileItemType;
  onClick: (path: string) => void;
  onDoubleClick: (path: string, isDirectory: boolean, isApp: boolean) => void;
  onContextMenu: (path: string | null, x: number, y: number) => void;
  isSelected: boolean;
  viewMode?: 'list' | 'grid';
  onRefresh?: () => void;
}

interface TooltipPosition {
  x: number;
  y: number;
}

const FileItem: React.FC<FileItemProps> = ({ file, onClick, onDoubleClick, onContextMenu, isSelected, viewMode = 'list', onRefresh }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ x: 0, y: 0 });
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (file.isDirectory || file.isApp) return;

    hoverTimerRef.current = setTimeout(() => {
      setTooltipPosition({ x: e.clientX, y: e.clientY });
      setShowTooltip(true);
    }, 2000);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setShowTooltip(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(file.path, e.clientX, e.clientY);
  };
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const displayName = file.isApp ? file.name.replace('.app', '') : file.name;

  if (viewMode === 'grid') {
    return (
      <div
        className={`relative flex flex-col items-center p-4 cursor-pointer rounded-lg transition-colors ${
          isSelected ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-gray-100'
        }`}
        onClick={() => onClick(file.path)}
        onDoubleClick={() => onDoubleClick(file.path, file.isDirectory, file.isApp)}
        onContextMenu={handleContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {showTooltip && (
          <AIRecommendation
            x={tooltipPosition.x}
            y={tooltipPosition.y}
            filePath={file.path}
            onClose={() => setShowTooltip(false)}
            onMoved={() => onRefresh?.()}
          />
        )}
        <div className="w-16 h-16 mb-2 flex items-center justify-center">
          {file.iconPath ? (
            <img
              src={file.iconPath}
              alt={displayName}
              className="w-full h-full object-contain"
              style={{ imageRendering: '-webkit-optimize-contrast' }}
              onError={(e) => {
                // Fallback to icon if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : file.isApp ? (
            <HiCube className="w-full h-full text-blue-500" />
          ) : file.isDirectory ? (
            <HiFolder className="w-full h-full text-blue-500" />
          ) : (
            <HiDocument className="w-full h-full text-gray-400" />
          )}
        </div>
        <p className="text-sm font-medium text-gray-900 text-center w-full truncate" title={displayName}>{displayName}</p>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center px-3 py-1 cursor-pointer rounded transition-colors ${
        isSelected ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-gray-100'
      }`}
      onClick={() => onClick(file.path)}
      onDoubleClick={() => onDoubleClick(file.path, file.isDirectory, file.isApp)}
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showTooltip && (
        <AIRecommendation
          x={tooltipPosition.x}
          y={tooltipPosition.y}
          filePath={file.path}
          onClose={() => setShowTooltip(false)}
          onMoved={() => onRefresh?.()}
        />
      )}
      <div className="flex-1 flex items-center min-w-0">
        {file.isApp ? (
          <HiCube className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
        ) : file.isDirectory ? (
          <HiFolder className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
        ) : (
          <HiDocument className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
        )}
        <p className="text-xs font-medium text-gray-900 truncate">{displayName}</p>
      </div>
      <div className="w-32 text-xs text-gray-500">
        <span>{formatDate(file.modifiedTime)}</span>
      </div>
      <div className="w-24 text-xs text-gray-500">
        {!file.isDirectory && <span>{formatSize(file.size)}</span>}
      </div>
    </div>
  );
};

export default FileItem;
