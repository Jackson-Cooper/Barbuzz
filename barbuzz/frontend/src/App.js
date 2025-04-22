import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage';
import BarSearch from './components/BarSearch';
import BarDetail from './components/BarDetail';
import UserProfile from './components/UserProfile';
import AuthForm from './components/AuthForm';
import Navbar from './components/Navbar';
import { useAuth } from './auth/AuthContext';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <div className="min-h-screen bg-charcoal text-offWhite">
      <Navbar />
      <div className="container mx-auto py-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={
            <ProtectedRoute>
              <BarSearch />
            </ProtectedRoute>
          } />
          <Route path="/bars/:barId" element={
            <ProtectedRoute>
              <BarDetail />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<AuthForm mode="login" />} />
          <Route path="/register" element={<AuthForm mode="register" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;