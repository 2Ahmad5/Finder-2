import React from 'react';
import Sidebar from './navbar/Sidebar';
import Page from './pages/page';

function App() {
    return (
        <div className="flex w-screen h-screen overflow-hidden">
            <Sidebar />
            <Page />
        </div>
    )
}

export default App
