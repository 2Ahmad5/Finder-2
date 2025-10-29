import React, { useState, useEffect, useRef } from 'react';
import { HiCheck } from 'react-icons/hi';
import { GetAICommands, ExecuteAICommands } from '../../wailsjs/go/main/App';

interface Command {
  action: string;
  path: string;
  name: string;
}

interface AISearchProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onCommandsExecuted: () => void;
}

const AISearch: React.FC<AISearchProps> = ({ isOpen, onClose, currentPath, onCommandsExecuted }) => {
  const [input, setInput] = useState('');
  const [commands, setCommands] = useState<Command[]>([]);
  const [selectedCommands, setSelectedCommands] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setInput('');
    setCommands([]);
    setSelectedCommands(new Set());
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!input.trim() || !currentPath) return;

    setLoading(true);
    setError(null);

    try {
      // Call AI backend via Wails
      const commands = await GetAICommands(input, currentPath);
      setCommands(commands || []);

      // Select all commands by default
      setSelectedCommands(new Set((commands || []).map((_: any, i: number) => i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    const commandsToExecute = commands.filter((_, i) => selectedCommands.has(i));

    if (commandsToExecute.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Execute commands via Wails
      const errors = await ExecuteAICommands(commandsToExecute);

      if (errors && errors.length > 0) {
        setError(`Some commands failed: ${errors.join(', ')}`);
      } else {
        // Notify parent to refresh
        onCommandsExecuted();
        handleClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleCommand = (index: number) => {
    const newSelected = new Set(selectedCommands);

    if (newSelected.has(index)) {
      // Deselecting - also deselect all dependent paths
      newSelected.delete(index);

      const deselectedPath = commands[index].path + '/' + commands[index].name;

      // Find and deselect all commands that depend on this path
      commands.forEach((cmd, i) => {
        if (i > index && cmd.path.startsWith(deselectedPath)) {
          newSelected.delete(i);
        }
      });
    } else {
      // Selecting
      newSelected.add(index);
    }

    setSelectedCommands(newSelected);
  };

  // Check if a command is disabled (parent is deselected)
  const isCommandDisabled = (index: number) => {
    if (index === 0) return false; // First command is never disabled

    const cmd = commands[index];

    // Check if any parent path is deselected
    for (let i = 0; i < index; i++) {
      const parentCmd = commands[i];
      const parentPath = parentCmd.path + '/' + parentCmd.name;

      // If this command's path starts with a deselected parent path
      if (cmd.path.startsWith(parentPath) && !selectedCommands.has(i)) {
        return true;
      }
    }

    return false;
  };

  const getActionIcon = (action: string) => {
    if (action === 'createFolder') return '📁';
    if (action === 'createFile') return '📄';
    return '•';
  };

  const getActionLabel = (action: string) => {
    if (action === 'createFolder') return 'Create Folder';
    if (action === 'createFile') return 'Create File';
    return action;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-[600px] max-w-[90vw] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Section */}
        <div className="p-4 border-b border-gray-200">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask AI to create files or folders..."
            className="w-full resize-none outline-none text-sm text-gray-900 placeholder-gray-400"
            style={{
              minHeight: '40px',
              maxHeight: '120px',
              overflow: 'auto',
            }}
            rows={2}
            disabled={loading || commands.length > 0}
          />

          {error && (
            <div className="mt-2 text-xs text-red-600">{error}</div>
          )}
        </div>

        {/* Commands Section */}
        {commands.length > 0 && (
          <div className="flex-1 overflow-auto p-4">
            <div className="text-xs font-semibold text-gray-600 mb-3">
              Commands to execute ({selectedCommands.size} selected):
            </div>
            <div className="space-y-2">
              {commands.map((cmd, index) => {
                const disabled = isCommandDisabled(index);
                const isSelected = selectedCommands.has(index);

                return (
                  <div
                    key={index}
                    onClick={() => !disabled && toggleCommand(index)}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      disabled
                        ? 'bg-gray-100 border border-gray-200 opacity-40 cursor-not-allowed'
                        : isSelected
                          ? 'bg-blue-50 border border-blue-200 cursor-pointer'
                          : 'bg-gray-50 border border-gray-200 opacity-60 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                      {isSelected ? (
                        <HiCheck className="w-5 h-5 text-blue-600" />
                      ) : (
                        <div className={`w-4 h-4 border-2 rounded ${disabled ? 'border-gray-300' : 'border-gray-400'}`} />
                      )}
                    </div>
                    <div className="text-2xl flex-shrink-0">{getActionIcon(cmd.action)}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
                        {getActionLabel(cmd.action)}
                      </div>
                      <div className={`text-xs truncate ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
                        {cmd.name}
                      </div>
                    </div>
                    <div className={`text-xs font-mono max-w-[200px] overflow-x-auto whitespace-nowrap flex-shrink-0 scrollbar-hide ${disabled ? 'text-gray-300' : 'text-gray-400'}`}>
                      {cmd.path}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions Section */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          {commands.length === 0 ? (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm text-white bg-gray-900 hover:bg-black rounded-lg transition-colors disabled:opacity-50"
                disabled={loading || !input.trim()}
              >
                {loading ? 'Thinking...' : 'Generate'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                className="px-4 py-2 text-sm text-white bg-black hover:bg-black-900 rounded-lg transition-colors disabled:opacity-50"
                disabled={loading || selectedCommands.size === 0}
              >
                {loading ? 'Executing...' : `Execute ${selectedCommands.size} Command${selectedCommands.size !== 1 ? 's' : ''}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AISearch;
