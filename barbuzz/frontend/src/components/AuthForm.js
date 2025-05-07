import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, register } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import logo from '../assets/barbuzz_logo.png'; 

const AuthForm = ({ mode }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [isOver21, setIsOver21] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // setLoading(true);
    setError('');

    // For registration, check age verification
    if (mode != 'login' && !isOver21) {
      setError('You must be 21 or older to use BarBuzz');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await authLogin({ username, password });
        
        // Redirect to home page after successful login
        navigate('/');
      } else {
        // Register mode
        await register({ username, email, password });
        setError('Registration successful! Please login.');
        navigate('/login');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-charcoal bg-gradient-to-br from-charcoal to-charcoal-dark">
      <div className="w-full max-w-md">
        {/* Logo and App Name */}
        <div className="flex flex-col items-center mb-10">
          <img src={logo} alt="BarBuzz Logo" className="h-20 mb-4" />
          <h1 className="text-4xl font-bold text-amber">BarBuzz</h1>
          <p className="text-offWhite mt-2 text-center">Find the perfect spot for your night out</p>
        </div>
        
        {/* Auth Card */}
        <div className="bg-slate bg-opacity-50 backdrop-blur-sm border border-white border-opacity-10 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-amber mb-8 text-center">
            {mode === 'login' ? 'Log In' : 'Create Account'}
          </h2>
          
          {error && (
            <div className={`p-4 rounded-lg mb-6 ${error.includes('successful') ? 'bg-green-500 bg-opacity-20 border border-green-500' : 'bg-magenta bg-opacity-20 border border-magenta'} text-offWhite`}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
          {mode != 'login' && (
            <div className="p-4 rounded-lg border-2 border-electricBlue bg-deepNavy mb-4">
              <h3 className="text-electricBlue text-lg font-semibold mb-2">Age Verification</h3>
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="isOver21"
                  checked={isOver21}
                  onChange={(e) => setIsOver21(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="isOver21" className="text-offWhite">
                  I confirm that I am 21 years of age or older
                  <span className="block text-magenta text-sm mt-1">
                    * You must be 21+ to use BarBuzz
                  </span>
                </label>
              </div>
            </div>
          )}

            <div>
              <label htmlFor="username" className="block text-offWhite text-lg mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 bg-charcoal border border-slate-600 rounded-lg text-offWhite focus:outline-none focus:ring-2 focus:ring-electricBlue"
                required
              />
            </div>
            
            {mode === 'register' && (
              <div className="mt-6">
                <label htmlFor="email" className="block text-offWhite text-lg mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 bg-charcoal border border-slate-600 rounded-lg text-offWhite focus:outline-none focus:ring-2 focus:ring-electricBlue"
                  required
                />
              </div>
            )}
            
            <div className="mt-6">
              <label htmlFor="password" className="block text-offWhite text-lg mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-charcoal border border-slate-600 rounded-lg text-offWhite focus:outline-none focus:ring-2 focus:ring-electricBlue"
                required
              />
            </div>
            
            <button
              type="submit"
              className={`w-full p-4 rounded-lg font-semibold text-lg transition mt-8
                ${loading ? 'bg-amber bg-opacity-60 cursor-not-allowed' : 'bg-amber hover:bg-amber-600 text-charcoal'}`}
              disabled={loading}
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-600 text-center">
            {mode === 'login' ? (
              <p className="text-offWhite">
                Don't have an account? <Link to="/register" className="text-electricBlue hover:underline font-medium">Sign Up</Link>
              </p>
            ) : (
              <p className="text-offWhite">
                Already have an account? <Link to="/login" className="text-electricBlue hover:underline font-medium">Log In</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;