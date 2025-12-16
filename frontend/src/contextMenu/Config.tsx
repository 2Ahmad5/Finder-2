import React from 'react';
import { CopyFile, CutFile, PasteFile, TrashFile, Zip, UnZip } from '../../wailsjs/go/main/App';
import Rename from './features/Rename';
import Share from './features/Share';
import Summarize from './features/AI';
import { CreateFileComponent, CreateFolderComponent } from './features/Create';

// Types
export interface MenuAction {
  filePath: string;
  currentDirectory: string;
  onClose: () => void;
  onRefresh: () => void;
}

export interface SubMenuProps {
  x: number;
  y: number;
  filePath: string;
  onClose: () => void;
  onRefresh: () => void;
}

export interface MenuItem {
  id: string;
  label: string;
  action: (ctx: MenuAction) => void;
  isDanger?: boolean;
  showDividerAfter?: boolean;
  showOnEmpty?: boolean;
  disabled?: (ctx: { hasClipboard: boolean; filePath: string }) => boolean;
  component?: React.FC<SubMenuProps>;
}

// Menu Configuration
export const menuItems: MenuItem[] = [
  {
    id: 'createFile',
    label: 'Create File',
    component: CreateFileComponent,
    showOnEmpty: true,
    action: () => {},
  },
  {
    id: 'createFolder',
    label: 'Create Folder',
    component: CreateFolderComponent,
    showDividerAfter: true,
    showOnEmpty: true,
    action: () => {},
  },
  {
    id: 'copy',
    label: 'Copy',
    showOnEmpty: false,
    action: ({ filePath, onClose }) => {
      CopyFile(filePath)
        .then(() => onClose())
        .catch(err => console.error('Copy error:', err));
    },
  },
  {
    id: 'cut',
    label: 'Cut',
    showOnEmpty: false,
    action: ({ filePath, onClose }) => {
      CutFile(filePath)
        .then(() => onClose())
        .catch(err => console.error('Cut error:', err));
    },
  },
  {
    id: 'paste',
    label: 'Paste',
    showOnEmpty: true,
    disabled: ({ hasClipboard }) => !hasClipboard,
    action: ({ currentDirectory, onClose, onRefresh }) => {
      PasteFile(currentDirectory)
        .then(() => {
          onRefresh();
          onClose();
        })
        .catch(err => console.error('Paste error:', err));
    },
  },
  {
    id: 'share',
    label: 'Share',
    showOnEmpty: false,
    component: Share,
    action: () => {},
  },
  {
    id: 'rename',
    label: 'Rename',
    showOnEmpty: false,
    component: Rename,
    action: () => {},
  },
  {
    id: 'unzip',
    label: 'Unzip',
    showOnEmpty: false,
    disabled: ({ filePath }) => !filePath.endsWith('.zip'),
    action: ({ filePath, onClose, onRefresh }) => {
      UnZip(filePath)
        .then(() => {
          onRefresh();
          onClose();
        })
        .catch(err => console.error('Unzip error:', err));
    },
  },
  {
    id: 'zip',
    label: 'Zip',
    showOnEmpty: false,
    disabled: ({ filePath }) => filePath.endsWith('.zip'),
    action: ({ filePath, onClose, onRefresh }) => {
      Zip(filePath)
        .then(() => {
          onRefresh();
          onClose();
        })
        .catch(err => console.error('Zip error:', err));
    },
  },
  {
    id: 'summarize',
    label: 'Summarize',
    showOnEmpty: false,
    showDividerAfter: true,
    component: Summarize,
    disabled: ({ filePath }) => !filePath || filePath.endsWith('.zip'),
    action: () => {},
  },
  {
    id: 'trash',
    label: 'Move to Trash',
    isDanger: true,
    showOnEmpty: false,
    action: ({ filePath, onClose, onRefresh }) => {
      TrashFile(filePath)
        .then(() => {
          onRefresh();
          onClose();
        })
        .catch(err => console.error('Trash error:', err));
    },
  },
];
