import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './Navbar';
import AuthModal from './AuthModal';
import { useAuth } from '../auth/AuthContext';

const AppLayout = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  return (
    <div className="app-layout">
      <NavBar 
        onLoginClick={() => {
          setAuthMode('login');
          setShowAuthModal(true);
        }}
        onRegisterClick={() => {
          setAuthMode('register');
          setShowAuthModal(true);
        }}
      />
      
      <main>
        <Outlet />
      </main>

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSwitchMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        />
      )}
    </div>
  );
};

export default AppLayout;
