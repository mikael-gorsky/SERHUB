
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserService } from '../services/UserService';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Lock, ChevronDown, UserCheck, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import AppLogo from './AppLogo';

const Login = () => {
  const { currentUser, signInEmail } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState('');

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        const usersPromise = UserService.getAllAsUsers();
        const users = await Promise.race([usersPromise, timeoutPromise]) as User[];
        setAvailableUsers(users);
      } catch (err) {
        console.warn("Could not fetch user list for dropdown:", err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleEmailLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email || !password) {
      setError("Required");
      setErrorDetails("Please enter email and password.");
      return;
    }

    setError('');
    setErrorDetails('');
    setLoading(true);

    try {
      await signInEmail(email, password);
      navigate('/');
    } catch (err: any) {
      setError('Login Failed');
      const msg = err.message?.includes('Invalid login credentials')
        ? 'Invalid email or password.'
        : (err.message || 'Authentication failed');
      setErrorDetails(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 flex flex-col">

        {/* Header */}
        <div className="bg-teal-600 p-8 text-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-20 -mb-20"></div>

          <div className="flex justify-center mb-4">
            <AppLogo size={64} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SER HUB</h1>
          <p className="text-white/70 text-xs font-medium mt-1">
            Self-Evaluation Report Management
          </p>
        </div>

        {/* Login Body */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Sign In</h2>
            <p className="text-gray-600 text-sm mt-1">Select your identity and enter your password</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl mb-6 border border-red-100">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{error}</p>
                  <p className="text-xs mt-0.5 opacity-80">{errorDetails}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Email</label>
              <div className="relative">
                <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                {loadingUsers ? (
                  <div className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400 flex items-center gap-2">
                    <Loader2 className="animate-spin" size={14} /> Loading users...
                  </div>
                ) : availableUsers.length > 0 ? (
                  <>
                    <select
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none transition-all cursor-pointer"
                      required
                    >
                      <option value="" disabled>Select user...</option>
                      {availableUsers.map(user => (
                        <option key={user.id} value={user.email}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </>
                ) : (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    required
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
             <p className="text-[10px] text-gray-400 font-medium">
               Quality Assurance Unit • Holon Institute of Technology • {new Date().getFullYear()}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
