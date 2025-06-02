import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { Home } from './components/Home';

function App() {
  const { user, loading, initialize } = useAuthStore();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const [showHome, setShowHome] = useState(() => {
    const hasVisited = localStorage.getItem('hasVisitedHome');
    return !hasVisited;
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    // Handle iOS vh bug
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);

    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  const handleProceed = () => {
    localStorage.setItem('hasVisitedHome', 'true');
    setShowHome(false);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gray-100 dark:bg-gray-900 flex items-center justify-center safe-area-pb">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showHome) {
    return <Home onProceed={handleProceed} />;
  }

  return (
    <div className="min-h-[100dvh] bg-gray-100 dark:bg-gray-900 flex flex-col safe-area-pb">
      {user ? <Dashboard /> : <AuthForm />}
    </div>
  );
}

export default App;