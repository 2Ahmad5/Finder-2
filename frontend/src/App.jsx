import React, { useState, useEffect } from 'react';
import Sidebar from './navbar/Sidebar';
import FileBrowser from './components/FileBrowser';
import AISearch from './components/AISearch';
import API from './pages/API';
import { GetHomeDirectory, GoUpDirectory } from '../wailsjs/go/main/App';

function App() {
    const [currentPath, setCurrentPath] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAISearchOpen, setIsAISearchOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

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

            // Command+B to go up one directory
            if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
                e.preventDefault();
                goUpOneDirectory();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPath]);

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

    const handleCommandsExecuted = () => {
        // Trigger refresh by incrementing the refresh trigger
        setRefreshTrigger(prev => prev + 1);
    };

    const goUpOneDirectory = () => {
        // Don't navigate up if on special pages
        if (currentPath === 'search' || currentPath === 'connections' || !currentPath) {
            return;
        }

        GoUpDirectory(currentPath)
            .then(parentPath => {
                if (parentPath) {
                    setCurrentPath(parentPath);
                }
            })
            .catch(err => console.error('Error navigating up:', err));
    };

    return (
        <div className="flex w-screen h-screen overflow-hidden">
            <Sidebar onFolderSelect={handleFolderSelect} currentPath={currentPath} hasSearchQuery={searchQuery.trim() !== ''} isAISearchOpen={isAISearchOpen} />
            {currentPath === 'connections' ? (
                <API />
            ) : currentPath ? (
                <FileBrowser
                    currentPath={currentPath}
                    onNavigate={handleNavigate}
                    searchQuery={searchQuery}
                    onSearch={handleSearch}
                    isAISearchOpen={isAISearchOpen}
                    onAIClick={() => setIsAISearchOpen(true)}
                    onGoUp={goUpOneDirectory}
                    refreshTrigger={refreshTrigger}
                />
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                    Select a folder from the sidebar
                </div>
            )}
            <AISearch
                isOpen={isAISearchOpen}
                onClose={() => setIsAISearchOpen(false)}
                currentPath={currentPath === 'search' ? '' : currentPath}
                onCommandsExecuted={handleCommandsExecuted}
            />
        </div>
    );
}

export default App
