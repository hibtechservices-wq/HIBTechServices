import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker with automatic updates for offline POS support (in production)
if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('CongoBiz: Une nouvelle version est disponible.');
    },
    onOfflineReady() {
      console.log('CongoBiz: Prêt pour le fonctionnement hors ligne (PWA).');
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />);
