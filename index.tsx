import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA using a relative path to solve origin issues in sandboxes
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Using './' ensures it looks relative to the current origin, not the root domain
    navigator.serviceWorker.register('./service-worker.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.warn('SW registration failed (Standard for sandboxed previews): ', registrationError);
    });
  });
}