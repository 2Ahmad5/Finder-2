import React, { useState, useEffect } from 'react';
import Sidebar from './navbar/Sidebar';
import FileBrowser from './components/FileBrowser';
import AISearch from './components/AISearch';
import { GetHomeDirectory } from '../wailsjs/go/main/App';

function App() {
    const [currentPath, setCurrentPath] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAISearchOpen, setIsAISearchOpen] = useState(false);

    useEffect(() => {
        GetHomeDirectory()
            .then(homeDir => {
                const docs = `${homeDir}/Documents`;
                setCurrentPath(docs);
            })
            .catch(err => console.error('Error getting home directory:', err));
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
                e.preventDefault();
                setIsAISearchOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleFolderSelect = (path) => {
        setCurrentPath(path);
    };

    const handleNavigate = (path) => {
        setCurrentPath(path);
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.trim()) {
            setCurrentPath('search');
        }
    };

    return (
        <div className="flex w-screen h-screen overflow-hidden">
            <Sidebar onFolderSelect={handleFolderSelect} currentPath={currentPath} hasSearchQuery={searchQuery.trim() !== ''} isAISearchOpen={isAISearchOpen} />
            {currentPath ? (
                <FileBrowser currentPath={currentPath} onNavigate={handleNavigate} searchQuery={searchQuery} onSearch={handleSearch} isAISearchOpen={isAISearchOpen} />
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                    Select a folder from the sidebar
                </div>
            )}
            <AISearch isOpen={isAISearchOpen} onClose={() => setIsAISearchOpen(false)} />
        </div>
    );
}

export default App
