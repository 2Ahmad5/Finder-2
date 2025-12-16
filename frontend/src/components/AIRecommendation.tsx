import React, { useEffect, useState } from 'react';
import { HiFolder, HiSparkles } from 'react-icons/hi2';
import { RecommendMove, MoveFile, ReadFileContent } from '../../wailsjs/go/main/App';

interface AIRecommendationProps {
  x: number;
  y: number;
  filePath: string;
  onClose: () => void;
  onMoved: () => void;
}

const AIRecommendation: React.FC<AIRecommendationProps> = ({ x, y, filePath, onClose, onMoved }) => {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Read first ~4000 chars of file content (roughly 2 pages)
        const content = await ReadFileContent(filePath);
        const truncatedContent = content.slice(0, 4000);

        const fileName = filePath.split('/').pop() || '';
        const response = await RecommendMove(fileName, truncatedContent);

        if (response.paths && response.paths.length > 0) {
          setRecommendations(response.paths);
        } else {
          setError('No recommendations');
        }
      } catch (err) {
        setError('Failed to get recommendations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [filePath]);

  const handleMove = async (destinationPath: string) => {
    try {
      await MoveFile(filePath, destinationPath);
      onMoved();
      onClose();
    } catch (err) {
      console.error('Failed to move file:', err);
    }
  };

  // Get just the folder name from path for display
  const getFolderName = (path: string) => {
    return path.split('/').pop() || path;
  };

  return (
    <div
      className="fixed z-50 bg-white shadow-md rounded-md border border-gray-300 py-2 min-w-[200px] max-w-[300px]"
      style={{
        left: x + 10,
        top: y - 10,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1.5 px-3 pb-2 border-b border-gray-200">
        <HiSparkles className="w-3.5 h-3.5 text-yellow-500" />
        <span className="text-xs font-medium text-gray-700">Move to</span>
      </div>
      <div className="py-1">
        {loading && (
          <div className="px-3 py-1.5 text-xs text-gray-500">Loading...</div>
        )}
        {error && (
          <div className="px-3 py-1.5 text-xs text-red-500">{error}</div>
        )}
        {!loading && !error && recommendations.map((path, index) => (
          <button
            key={index}
            onClick={() => handleMove(path)}
            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-2"
            title={path}
          >
            <HiFolder className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{getFolderName(path)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AIRecommendation;
