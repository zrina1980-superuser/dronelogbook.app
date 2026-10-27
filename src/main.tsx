import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker for offline caching and standalone installation
registerSW({immediate: true});

createRoot(document.getElementById('root')!).render(<App />);
