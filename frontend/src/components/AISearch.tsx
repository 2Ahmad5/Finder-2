import React, { useState, useEffect, useRef } from 'react';

interface AISearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const AISearch: React.FC<AISearchProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-[600px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI anything..."
            className="w-full resize-none outline-none text-sm text-gray-900 placeholder-gray-400"
            style={{
              minHeight: '40px',
              maxHeight: '300px',
              overflow: 'auto',
            }}
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 300) + 'px';
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AISearch;
