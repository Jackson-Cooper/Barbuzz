import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <nav className="bg-charcoal border-b border-white border-opacity-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-amber font-poppins text-2xl font-bold">
              Barbuzz
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/search" className="text-offWhite hover:text-electricBlue transition px-3 py-2">
              Find Bars
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="text-offWhite hover:text-electricBlue transition px-3 py-2">
                  My Profile
                </Link>
                <div className="hidden md:flex items-center text-offWhite text-sm px-3">
                  <span className="mr-2">Hi,</span>
                  <span className="text-teal font-medium">{user?.username || 'User'}</span>
                </div>
                <button 
                  onClick={logout}
                  className="bg-magenta bg-opacity-20 hover:bg-opacity-30 text-magenta font-medium rounded-full px-4 py-2 text-sm transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-electricBlue hover:text-opacity-80 transition font-medium px-3 py-2">
                  Login
                </Link>
                <Link to="/register" className="bg-electricBlue text-charcoal hover:bg-opacity-90 font-medium rounded-full px-4 py-2 text-sm transition">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;