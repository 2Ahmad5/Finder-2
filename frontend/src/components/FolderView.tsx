import React, { useState, useEffect } from 'react';
import { GetFolderContents } from '../../wailsjs/go/main/App';
import { FileItem as FileItemType } from '../types/filesystem';
import { HiFolder, HiDocument } from 'react-icons/hi2';

interface FolderViewProps {
  x: number;
  y: number;
  folderPath: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const FolderView: React.FC<FolderViewProps> = ({ x, y, folderPath, onMouseEnter, onMouseLeave }) => {
  const [files, setFiles] = useState<FileItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    GetFolderContents(folderPath)
      .then((items) => {
        setFiles(items || []);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load folder contents');
        setLoading(false);
        console.error('Error loading folder:', err);
      });
  }, [folderPath]);

  // Position the popup next to the cursor
  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${x+10}px`,
    top: `${y}px`,
    zIndex: 9999,
  };

  return (
    <div
      style={style}
      className="bg-white rounded-lg shadow-2xl border border-gray-300 w-64 max-h-96 flex flex-col"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Content */}
      <div className="overflow-y-auto flex-1 p-2">
        {loading && (
          <div className="text-xs text-gray-500 p-2">Loading...</div>
        )}

        {error && (
          <div className="text-xs text-red-500 p-2">{error}</div>
        )}

        {!loading && !error && files.length === 0 && (
          <div className="text-xs text-gray-400 p-2">Empty folder</div>
        )}

        {!loading && !error && files.length > 0 && (
          <div className="space-y-1">
            {files.map((file) => (
              <div
                key={file.path}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                {file.isDirectory ? (
                  <HiFolder className="text-blue-500 flex-shrink-0" size={16} />
                ) : (
                  <HiDocument className="text-gray-500 flex-shrink-0" size={16} />
                )}
                <span className="text-xs text-gray-700 truncate">{file.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderView;
