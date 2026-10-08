import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@xyflow/react/dist/style.css';
import './style.css';
import './canvas.css';
import './flow.css';
import './workspace.css';
import './process.css';
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
