import React, { useState } from 'react';
import { CreateFile, CreateFolder, CreateGoogleDoc } from '../../../wailsjs/go/main/App';

interface CreateProps {
  x: number;
  y: number;
  filePath: string;
  onClose: () => void;
  onRefresh: () => void;
  isFolder: boolean;
}

const Create: React.FC<CreateProps> = ({ x, y, filePath, onClose, onRefresh, isFolder }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Check if creating a Google Doc (.goox file)
    if (!isFolder && name.endsWith('.goox')) {
      // Remove the .goox extension for the Google Doc name
      const docName = name.slice(0, -5);
      CreateGoogleDoc(filePath, docName)
        .then(() => {
          onRefresh();
          onClose();
        })
        .catch(err => {
          console.error('Create Google Doc error:', err);
          alert('Failed to create Google Doc: ' + err);
        });
      return;
    }

    const createFn = isFolder ? CreateFolder : CreateFile;

    createFn(filePath, name)
      .then(() => {
        onRefresh();
        onClose();
      })
      .catch(err => console.error(`Create ${isFolder ? 'folder' : 'file'} error:`, err));
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isFolder ? 'Folder name' : 'File name'}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-2"
          autoFocus
        />
        <div className="flex gap-2">
          <button type="submit" className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
            Create
          </button>
          <button type="button" onClick={onClose} className="flex-1 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// Wrapper components for Config
export const CreateFileComponent: React.FC<Omit<CreateProps, 'isFolder'>> = (props) => (
  <Create {...props} isFolder={false} />
);

export const CreateFolderComponent: React.FC<Omit<CreateProps, 'isFolder'>> = (props) => (
  <Create {...props} isFolder={true} />
);

export default Create;
