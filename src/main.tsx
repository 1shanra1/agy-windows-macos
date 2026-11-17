import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/eb-garamond/400.css';
import { OSProvider } from './core/osStore';
import { App } from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OSProvider>
      <App />
    </OSProvider>
  </React.StrictMode>
);
