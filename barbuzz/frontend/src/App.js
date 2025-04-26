import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';

// Components
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import BarDetail from './components/BarDetail';
import UserProfile from './components/UserProfile';
import BarSearch from './components/BarSearch';

// Simple protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl text-amber mb-4">Authentication Required</h1>
        <p className="text-offWhite mb-4">You need to be logged in to access this page.</p>
      </div>
    );
  }
  
  return children;
};

function App() {
  return (
    // REMOVE the Router wrapper - it exists elsewhere
    <AuthProvider>
      <FavoritesProvider>
        <div className="min-h-screen bg-charcoal bg-gradient-to-br from-charcoal to-charcoal-dark text-offWhite">
          <Navbar />
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            
            <Route path="/bars/:id" element={
              <ProtectedRoute>
                <BarDetail />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            
            <Route path="/search" element={
              <ProtectedRoute>
                <BarSearch />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={
              <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-3xl text-amber mb-4">404 - Page Not Found</h1>
                <p className="text-offWhite">The page you are looking for doesn't exist.</p>
              </div>
            } />
          </Routes>
        </div>
      </FavoritesProvider>
    </AuthProvider>
  );
}

export default App;