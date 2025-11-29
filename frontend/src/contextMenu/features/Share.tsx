import React, { useState } from 'react';
import { ShareFile } from '../../../wailsjs/go/main/App';

interface ShareProps {
  x: number;
  y: number;
  filePath: string;
  onClose: () => void;
}

const Share: React.FC<ShareProps> = ({ x, y, filePath, onClose }) => {
  const [shareEmail, setShareEmail] = useState('');
  const [emailList, setEmailList] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;
    if (!emailList.includes(shareEmail.trim())) {
      setEmailList([...emailList, shareEmail.trim()]);
    }
    setShareEmail('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      const finalEmailList = shareEmail.trim()
        ? [...emailList, shareEmail.trim()].filter((email, index, self) => self.indexOf(email) === index)
        : emailList;

      if (finalEmailList.length === 0) {
        alert('Please add at least one email address');
        return;
      }

      Promise.all(
        finalEmailList.map(email =>
          ShareFile(filePath, email)
            .then(() => console.log('Successfully shared with:', email))
            .catch(err => {
              console.error('Share error with', email, ':', err);
              throw new Error(`Failed to share with ${email}: ${err}`);
            })
        )
      )
        .then(() => {
          alert(`Successfully shared with ${finalEmailList.length} recipient(s)`);
          onClose();
        })
        .catch(() => {
          alert('Some emails failed to send. Check console for details.');
        });
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmailList(emailList.filter(email => email !== emailToRemove));
  };

  return (
    <div
      className="fixed bg-white shadow-lg rounded-xl border border-gray-200 p-3 min-w-[300px] max-w-[400px] z-50"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      {emailList.length > 0 && (
        <div className="mb-2 max-h-[150px] overflow-y-auto">
          {emailList.map((email, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-blue-50 px-2 py-1 mb-1 rounded text-xs"
            >
              <span className="text-blue-700">{email}</span>
              <button
                type="button"
                onClick={() => handleRemoveEmail(email)}
                className="text-blue-500 hover:text-red-500 ml-2"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={shareEmail}
          onChange={(e) => setShareEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter email address..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      </form>
      <div className="mt-2 text-xs text-gray-500">
        <div>Press Enter to add email</div>
        <div>Press Cmd+Enter to send to all</div>
      </div>
    </div>
  );
};

export default Share;
