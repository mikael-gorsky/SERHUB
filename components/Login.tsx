
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserService } from '../services/UserService';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Mail, Lock, ArrowRight, ChevronDown, UserCheck, ShieldCheck } from 'lucide-react';
import { User } from '../types';

const Login = () => {
  const { currentUser, signInEmail, enterGuestMode } = useAuth();
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
        const users = await UserService.getAllAsUsers();
        setAvailableUsers(users);
      } catch (err) {
        console.warn("Could not fetch user list for dropdown.");
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleEmailLogin = async (e?: React.FormEvent, overrideEmail?: string, overridePass?: string) => {
    if (e) e.preventDefault();
    
    const targetEmail = overrideEmail || email;
    const targetPass = overridePass || password;

    if (!targetEmail || !targetPass) {
      setError("Selection Required");
      setErrorDetails("Please select your institutional identity and enter your access key.");
      return;
    }

    setError('');
    setErrorDetails('');
    setLoading(true);

    try {
      await signInEmail(targetEmail, targetPass);
      navigate('/');
    } catch (err: any) {
      setError('Verification Failed');
      const msg = err.message?.includes('Invalid login credentials')
        ? 'The security key entered does not match this identity.'
        : (err.message || 'Authentication failed');
      setErrorDetails(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleMgShortcut = () => {
    const mgEmail = 'mikaelg@hit.ac.il';
    const mgPass = '123456';
    setEmail(mgEmail);
    setPassword(mgPass);
    handleEmailLogin(undefined, mgEmail, mgPass);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-gray-100 to-gray-200">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
        
        {/* HIT Brand Header */}
        <div className="bg-hit-dark p-12 text-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
          
          <div className="w-24 h-24 bg-hit-accent rounded-[2rem] flex items-center justify-center font-black text-5xl text-hit-dark mx-auto mb-6 shadow-2xl rotate-3 border-4 border-white/20">
            S
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">SER HUB</h1>
          <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.3em] mt-3 opacity-80 leading-relaxed">
            Institutional Quality Assurance <br/> & Self-Evaluation Authority
          </p>
        </div>

        {/* Login Body */}
        <div className="p-12">
          <div className="text-center mb-10">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Access Verification</h2>
            <p className="text-gray-400 text-xs font-bold mt-2">Identify yourself to access the roadmap.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-6 rounded-3xl mb-10 border border-red-100 animate-in shake duration-300">
              <div className="flex items-start gap-4">
                <AlertCircle size={24} className="shrink-0 text-red-500" />
                <div>
                  <p className="font-black uppercase text-xs tracking-wider">{error}</p>
                  <p className="text-[11px] mt-1 font-bold leading-relaxed opacity-80">{errorDetails}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-8">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Institutional Identity</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-hit-blue transition-colors z-10">
                  <UserCheck size={20} />
                </div>
                <select 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loadingUsers}
                  className="w-full pl-14 pr-12 py-5 bg-gray-50 border-none rounded-[1.5rem] text-sm font-black text-gray-800 focus:ring-2 focus:ring-hit-blue appearance-none transition-all cursor-pointer disabled:opacity-50"
                  required
                >
                  <option value="" disabled>Search Directory...</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.email}>
                      {user.name} — {user.role}
                    </option>
                  ))}
                  <option value="mikaelg@hit.ac.il">Mikael Gorsky (Admin)</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
              {loadingUsers && (
                <p className="text-[9px] text-hit-blue mt-3 font-black uppercase flex items-center justify-center gap-2 tracking-widest">
                  <Loader2 className="animate-spin" size={12} /> Syncing institutional records...
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Secure Access Key</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-hit-blue transition-colors" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-gray-50 border-none rounded-[1.5rem] text-sm font-black text-gray-800 focus:ring-2 focus:ring-hit-blue transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-4 bg-hit-blue hover:bg-hit-dark text-white font-black py-5 px-8 rounded-[1.5rem] transition-all shadow-2xl shadow-hit-blue/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase text-xs tracking-[0.3em]"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} strokeWidth={3} />}
              <span>{loading ? 'Verifying...' : 'Authenticate'}</span>
            </button>
          </form>

          <div className="relative my-12">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.5em]">
              <span className="px-6 bg-white text-gray-300">Fast Lane</span>
            </div>
          </div>

          <button
            onClick={handleMgShortcut}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-hit-accent text-hit-dark font-black py-5 px-8 rounded-[1.5rem] transition-all shadow-lg hover:bg-hit-accent/5 active:scale-95 disabled:opacity-70 uppercase text-[10px] tracking-widest mb-4"
          >
            <ArrowRight size={18} className="text-hit-accent" />
            <span>Institutional Administrator Login</span>
          </button>

          <button
            onClick={() => { enterGuestMode(); navigate('/'); }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-gray-100 text-gray-600 font-black py-5 px-8 rounded-[1.5rem] transition-all hover:bg-gray-200 active:scale-95 disabled:opacity-70 uppercase text-[10px] tracking-widest"
          >
            <UserCheck size={18} />
            <span>Enter as Guest (Demo Mode)</span>
          </button>

          <div className="mt-16 pt-8 border-t border-gray-50 text-center">
             <img src="https://upload.wikimedia.org/wikipedia/en/thumb/9/99/Holon_Institute_of_Technology_Logo.svg/1200px-Holon_Institute_of_Technology_Logo.svg.png" alt="HIT Logo" className="h-10 mx-auto opacity-30 grayscale hover:grayscale-0 transition-all cursor-pointer" />
             <p className="text-[9px] text-gray-300 font-black uppercase tracking-widest mt-8 leading-relaxed">
               Proprietary Educational Management Gateway <br/>
               Quality Assurance Unit • HIT {new Date().getFullYear()}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
