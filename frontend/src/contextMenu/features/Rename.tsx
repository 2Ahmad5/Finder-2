import React, { useState } from 'react';
import { RenameFile } from '../../../wailsjs/go/main/App';

interface RenameProps {
  x: number;
  y: number;
  filePath: string;
  onClose: () => void;
  onRefresh: () => void;
}

const Rename: React.FC<RenameProps> = ({ x, y, filePath, onClose, onRefresh }) => {
  const fileName = filePath.split('/').pop() || '';
  const [newName, setNewName] = useState(fileName);

  const handleSubmit = (e: React.FormEvent) => {
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

  const handleCancel = () => {
    onClose();
  };

  return (
    <div
      className="fixed bg-white shadow-md rounded-md border border-gray-300 p-2 min-w-[200px] z-50"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <form onSubmit={handleSubmit}>
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
            onClick={handleCancel}
            className="flex-1 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default Rename;
