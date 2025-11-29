import React, { useState, useEffect } from 'react';
import { HasClipboardContent } from '../../wailsjs/go/main/App';
import { menuItems, MenuAction } from './Config';

interface ContextMenuProps {
  x: number;
  y: number;
  filePath: string | null;
  currentDirectory: string;
  onClose: () => void;
  onRefresh: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, filePath, currentDirectory, onClose, onRefresh }) => {
  const isEmpty = !filePath;
  const [hasClipboard, setHasClipboard] = useState(false);
  const [activeItem, setActiveItem] = useState<typeof menuItems[0] | null>(null);

  useEffect(() => {
    HasClipboardContent().then(setHasClipboard);
  }, []);

  const effectivePath = filePath || currentDirectory;
  const actionContext: MenuAction = { filePath: effectivePath, currentDirectory, onClose, onRefresh };

  const handleMenuItemClick = (item: typeof menuItems[0]) => {
    if (item.component) {
      setActiveItem(item);
    } else {
      item.action(actionContext);
    }
  };

  // Filter items based on isEmpty
  const visibleItems = menuItems.filter(item => isEmpty ? item.showOnEmpty : true);

  // Render active component if one is selected
  if (activeItem?.component) {
    const Component = activeItem.component;
    return <Component x={x} y={y} filePath={effectivePath} onClose={onClose} onRefresh={onRefresh} />;
  }

  // Render main menu
  return (
    <div
      className="fixed bg-white shadow-md rounded-md border border-gray-300 py-1 min-w-[120px] z-50"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      {visibleItems.map((item, index) => {
        const isDisabled = item.disabled?.({ hasClipboard, filePath: effectivePath }) ?? false;
        // Show divider if item has showDividerAfter AND it's not the last visible item
        const showDivider = item.showDividerAfter && index < visibleItems.length - 1;

        return (
          <React.Fragment key={item.id}>
            <button
              className={`w-full text-left px-3 py-1 text-xs transition-colors ${
                isDisabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : item.isDanger
                  ? 'text-red-600 hover:bg-red-500 hover:text-white'
                  : 'text-gray-700 hover:bg-blue-500 hover:text-white'
              }`}
              onClick={() => !isDisabled && handleMenuItemClick(item)}
              disabled={isDisabled}
            >
              {item.label}
            </button>
            {showDivider && <div className="border-t border-gray-300 my-1" />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ContextMenu;
