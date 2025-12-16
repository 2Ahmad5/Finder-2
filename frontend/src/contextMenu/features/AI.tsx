import React, { useState, useEffect } from 'react';
import { SummarizeDirectory } from '../../../wailsjs/go/main/App';

interface SummarizeProps {
  x: number;
  y: number;
  filePath: string;
  onClose: () => void;
  onRefresh: () => void;
}

const Summarize: React.FC<SummarizeProps> = ({ x, y, filePath, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    SummarizeDirectory(filePath)
      .then(() => {
        setLoading(false);
        setSuccess(true);
        onRefresh();
        // Auto-close after success
        setTimeout(() => {
          onClose();
        }, 1500);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.toString());
      });
  }, [filePath, onClose, onRefresh]);

  return (
    <div
      className="fixed bg-white shadow-md rounded-md border border-gray-300 p-3 min-w-[200px] z-50"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      {loading && (
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-xs text-gray-600">Analyzing directory...</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span className="text-xs text-green-600">Summary created!</span>
        </div>
      )}
      {error && (
        <div className="space-y-2">
          <p className="text-xs text-red-600">Error: {error}</p>
          <button
            onClick={onClose}
            className="w-full px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default Summarize;
