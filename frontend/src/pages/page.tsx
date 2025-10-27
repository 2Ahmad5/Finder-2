import React from 'react';
import Navbar from '../navbar/Navbar';
import Downloads from './Downloads';

const Page = () => {
  return (
    <div className="flex-1 h-full overflow-auto bg-white flex flex-col">
      <Navbar pageName="Downloads" />
      <div className="flex-1 overflow-auto">
        <Downloads />
      </div>
    </div>
  );
};

export default Page;

