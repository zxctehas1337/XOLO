import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './styles/animations.css';
import './tauri-api'; // Инициализация Tauri API

console.log('main.tsx loaded');
console.log('Root element:', document.getElementById('root'));
console.log('window.electronAPI:', window.electronAPI);

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
} else {
  console.log('Creating React root...');
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('Rendering App...');
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('App rendered successfully');
  } catch (error) {
    console.error('Error rendering app:', error);
  }
}
