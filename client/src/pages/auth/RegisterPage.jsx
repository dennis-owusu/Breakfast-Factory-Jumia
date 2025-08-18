import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerStart, registerSuccess, registerFailure } from '../../redux/slices/authSlice';

// Self-contained icons and loader to make component portable
const Eye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" x2="22" y1="2" y2="22"/>
  </svg>
);

const AlertCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" x2="12" y1="8" y2="12"/>
    <line x1="12" x2="12.01" y1="16" y2="16"/>
  </svg>
);

const Store = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
    <path d="M2 7h20"/>
    <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
  </svg>
);

const Loader = ({ size = "sm", color = "white" }) => (
  <div className={`flex items-center justify-center ${size === "sm" ? "h-5 w-5" : "h-8 w-8"}`}>
    <div className={`animate-spin rounded-full ${size === "sm" ? "h-4 w-4 border-2" : "h-6 w-6 border-3"} border-t-transparent ${color === "white" ? "border-white" : "border-orange-500"}`}></div>
  </div>
);

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentUser, error } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [outletName, setOutletName] = useState('');
  const [outletDescription, setOutletDescription] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const validateForm = () => {
    if (!name.trim()) {
      setFormError('Name is required');
      return false;
    }

    if (!email.trim()) {
      setFormError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError('Please enter a valid email address');
      return false;
    }

    if (!password) {
      setFormError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }

    if (!outletName.trim()) {
      setFormError('Outlet name is required');
      return false;
    }

    if (!outletDescription.trim()) {
      setFormError('Outlet description is required');
      return false;
    }

    setFormError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateForm()) return;
  
    const userData = {
      name,
      email,
      password,
      usersRole: 'outlet',
      storeName: outletName,
      description: outletDescription,
    };
  
    try {
      dispatch(registerStart());
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
  
      if (!response.ok) {
        throw new Error('Failed to register');
      }
  
      const data = await response.json();
      dispatch(registerSuccess(data));
      navigate('/login');
    } catch (err) {
      dispatch(registerFailure(err.message || 'Failed to register'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Store className="h-12 w-12 text-orange-500 dark:text-orange-400" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Create your outlet account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Or{' '}
          <Link 
            to="/login" 
            className="font-medium text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200 dark:border-slate-700">
          {(error || formError) && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {formError || error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:focus:ring-orange-400 dark:focus:border-orange-400 sm:text-sm bg-white dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:focus:ring-orange-400 dark:focus:border-orange-400 sm:text-sm bg-white dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:focus:ring-orange-400 dark:focus:border-orange-400 sm:text-sm bg-white dark:bg-slate-700 dark:text-white pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-slate-500 hover:text-gray-500 dark:hover:text-slate-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Password must be at least 6 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:focus:ring-orange-400 dark:focus:border-orange-400 sm:text-sm bg-white dark:bg-slate-700 dark:text-white pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-slate-500 hover:text-gray-500 dark:hover:text-slate-400"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="outletName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Outlet/Store Name
              </label>
              <div className="mt-1">
                <input
                  id="outletName"
                  name="outletName"
                  type="text"
                  required
                  value={outletName}
                  onChange={(e) => setOutletName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:focus:ring-orange-400 dark:focus:border-orange-400 sm:text-sm bg-white dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="outletDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Outlet Description
              </label>
              <div className="mt-1">
                <textarea
                  id="outletDescription"
                  name="outletDescription"
                  rows="3"
                  required
                  value={outletDescription}
                  onChange={(e) => setOutletDescription(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:focus:ring-orange-400 dark:focus:border-orange-400 sm:text-sm bg-white dark:bg-slate-700 dark:text-white"
                  placeholder="Describe your outlet, products, and services"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-orange-500 dark:text-orange-400 focus:ring-orange-500 dark:focus:ring-orange-400 border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                I agree to the{' '}
                <Link 
                  to="/terms" 
                  className="font-medium text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link 
                  to="/privacy" 
                  className="font-medium text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-orange-400 disabled:opacity-50"
              >
                {loading ? <Loader size="sm" color="white" /> : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;