import React, { useState, useEffect } from 'react';
import { CopyFile, CutFile, PasteFile, HasClipboardContent, TrashFile, RenameFile } from '../../wailsjs/go/main/App';

interface ContextMenuProps {
  x: number;
  y: number;
  filePath: string;
  currentDirectory: string;
  onClose: () => void;
  onRefresh: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, filePath, currentDirectory, onClose, onRefresh }) => {
  const [hasClipboard, setHasClipboard] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    HasClipboardContent().then(setHasClipboard);
  }, []);

  const handleCopy = () => {
    CopyFile(filePath)
      .then(() => {
        console.log('Copied:', filePath);
        onClose();
      })
      .catch(err => console.error('Copy error:', err));
  };

  const handleCut = () => {
    CutFile(filePath)
      .then(() => {
        console.log('Cut:', filePath);
        onClose();
      })
      .catch(err => console.error('Cut error:', err));
  };

  const handlePaste = () => {
    PasteFile(currentDirectory)
      .then(() => {
        console.log('Pasted to:', currentDirectory);
        onRefresh();
        onClose();
      })
      .catch(err => console.error('Paste error:', err));
  };

  const handleTrash = () => {
    TrashFile(filePath)
      .then(() => {
        console.log('Trashed:', filePath);
        onRefresh();
        onClose();
      })
      .catch(err => console.error('Trash error:', err));
  };

  const handleShare = () => {
    console.log('Share:', filePath);
    onClose();
  };

  const handleRename = () => {
    const fileName = filePath.split('/').pop() || '';
    setNewName(fileName);
    setIsRenaming(true);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    RenameFile(filePath, newName)
      .then(() => {
        console.log('Renamed:', filePath, 'to', newName);
        onRefresh();
        onClose();
      })
      .catch(err => console.error('Rename error:', err));
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
    setNewName('');
  };

  if (isRenaming) {
    return (
      <div
        className="fixed bg-white shadow-md rounded-md border border-gray-300 p-2 min-w-[200px] z-50"
        style={{ top: y, left: x }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleRenameSubmit}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={handleRenameCancel}
              className="flex-1 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div
      className="fixed bg-white shadow-md rounded-md border border-gray-300 py-1 min-w-[120px] z-50"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="w-full text-left px-3 py-1 text-xs text-gray-700 hover:bg-blue-500 hover:text-white transition-colors"
        onClick={handleCopy}
      >
        Copy
      </button>

      <button
        className="w-full text-left px-3 py-1 text-xs text-gray-700 hover:bg-blue-500 hover:text-white transition-colors"
        onClick={handleCut}
      >
        Cut
      </button>

      <button
        className={`w-full text-left px-3 py-1 text-xs transition-colors ${
          hasClipboard
            ? 'text-gray-700 hover:bg-blue-500 hover:text-white'
            : 'text-gray-400 cursor-not-allowed'
        }`}
        onClick={hasClipboard ? handlePaste : undefined}
        disabled={!hasClipboard}
      >
        Paste
      </button>

      <button
        className="w-full text-left px-3 py-1 text-xs text-gray-700 hover:bg-blue-500 hover:text-white transition-colors"
        onClick={handleShare}
      >
        Share
      </button>

      <button
        className="w-full text-left px-3 py-1 text-xs text-gray-700 hover:bg-blue-500 hover:text-white transition-colors"
        onClick={handleRename}
      >
        Rename
      </button>

      <div className="border-t border-gray-300 my-1" />

      <button
        className="w-full text-left px-3 py-1 text-xs text-red-600 hover:bg-red-500 hover:text-white transition-colors"
        onClick={handleTrash}
      >
        Move to Trash
      </button>
    </div>
  );
};

export default ContextMenu;
