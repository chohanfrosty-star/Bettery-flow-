import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Initialize auto-updating Progressive Web App service worker
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] App update detected.');
  },
  onOfflineReady() {
    console.log('[PWA] BatteryFlow is ready for offline operation.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
