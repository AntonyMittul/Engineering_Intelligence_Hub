import React from 'react';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import './index.css';

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <Chat />
    </div>
  );
}

export default App;
