import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useThemeStore } from './store/themeStore';

// Initialize theme on app load
const isDarkMode = useThemeStore.getState().isDarkMode;
document.documentElement.classList.toggle('dark', isDarkMode);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);