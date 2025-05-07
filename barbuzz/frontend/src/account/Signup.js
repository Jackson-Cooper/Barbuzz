import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    is_over_21: false 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Check age verification first - most important check
    if (!formData.is_over_21) {
      setError('You must be 21 or older to use this site');
      return;
    }
    
    // Validate password match
    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      // Success - redirect to login
      navigate('/login');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-8">
      <div className="bg-slate-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-amber-400 mb-6">Sign Up</h1>
        
        {error && (
          <div className="bg-red-500 bg-opacity-80 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* AGE VERIFICATION SECTION - HIGHLIGHTED */}
          <div className="mb-6 bg-slate-700 p-4 rounded border-l-4 border-amber-400">
            <h2 className="text-white text-lg font-bold mb-2">Age Verification</h2>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_over_21"
                name="is_over_21"
                checked={formData.is_over_21}
                onChange={handleChange}
                className="mr-2 h-5 w-5"
              />
              <label htmlFor="is_over_21" className="text-white">
                I confirm that I am 21 years of age or older
              </label>
            </div>
            <p className="text-sm text-red-400 mt-2">
              * You must be 21+ to use BarBuzz
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-white mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-2 rounded bg-slate-700 text-white"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-white mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 rounded bg-slate-700 text-white"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-white mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 rounded bg-slate-700 text-white"
              required
              minLength={6}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-white mb-1">Confirm Password</label>
            <input
              type="password"
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              className="w-full p-2 rounded bg-slate-700 text-white"
              required
              minLength={6}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 text-black font-bold py-2 rounded hover:bg-amber-500 transition"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-white">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-400 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;