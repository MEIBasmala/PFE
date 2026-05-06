// src/pages/Auth.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, usersApi } from '@/services/shared/api';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Checkbox,
} from '@/components/ui';
import { toast } from 'sonner';

type AuthPage = 'login' | 'register' | 'forgot' | 'reset';

const floatingFoodsPositions = [
  { emoji: '🥗', top: '8%', left: '3%', fontSize: '2rem' },
  { emoji: '🥑', top: '12%', left: '15%', fontSize: '1.8rem' },
  { emoji: '🍎', top: '5%', right: '8%', fontSize: '2.5rem' },
  { emoji: '🍐', top: '18%', right: '22%', fontSize: '1.6rem' },
  { emoji: '🥦', top: '35%', left: '2%', fontSize: '2rem' },
  { emoji: '🥕', top: '42%', left: '12%', fontSize: '2rem' },
  { emoji: '🍅', top: '28%', left: '20%', fontSize: '2rem' },
  { emoji: '🥒', top: '32%', right: '5%', fontSize: '2rem' },
  { emoji: '🍓', top: '45%', right: '18%', fontSize: '2rem' },
  { emoji: '🫐', top: '38%', right: '28%', fontSize: '2rem' },
  { emoji: '🍒', bottom: '25%', left: '4%', fontSize: '2rem' },
  { emoji: '🍊', bottom: '18%', left: '18%', fontSize: '2rem' },
  { emoji: '🍌', bottom: '32%', left: '28%', fontSize: '2rem' },
  { emoji: '🥝', bottom: '15%', right: '6%', fontSize: '2rem' },
  { emoji: '🍍', bottom: '28%', right: '22%', fontSize: '2rem' },
  { emoji: '🥭', bottom: '8%', right: '35%', fontSize: '2rem' },
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [page, setPage] = useState<AuthPage>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [alert, setAlert] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, register } = useAuth();

  useEffect(() => {
    if (tokenFromUrl) setPage('reset');
  }, [tokenFromUrl]);

  const getPasswordStrength = (pwd: string): number => {
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  };

  const strengthClass = (idx: number, strength: number) => {
    if (idx >= strength) return 'bg-muted';
    if (strength <= 1) return 'bg-destructive';
    if (strength <= 2) return 'bg-amber-500';
    return 'bg-primary';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    try {
      const user = await login(loginEmail, loginPassword);

      if (user.role === 'PATIENT') {
        try {
          const profileRes = await usersApi.getProfile();
          if (!profileRes?.profile?.isProfileComplete) {
            navigate('/onboarding');
            return;
          }
        } catch {
          navigate('/onboarding');
          return;
        }
      }

      const routes: Record<string, string> = {
        PATIENT: '/patient',
        NUTRITIONIST: '/nutritionist',
        ADMIN: '/admin',
      };

      const destination = routes[user.role];
      if (!destination) {
        toast.error(`Unknown role: ${user.role}`);
        return;
      }
      navigate(destination);
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      toast.info('Please fill in all fields');
      return;
    }
    setLoading(true);
    setAlert(null);
    try {
      await register(regName, regEmail, regPassword);
      toast.success('Account created! Redirecting to complete your profile...');
      setTimeout(() => navigate('/onboarding'), 1500);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.info('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(forgotEmail);
      toast.success('If an account exists, a reset link was sent to your email.');
      setForgotEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenFromUrl) {
      toast.error('Invalid or missing reset token');
      return;
    }
    if (!resetNewPass || resetNewPass !== resetConfirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (resetNewPass.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(tokenFromUrl, resetNewPass);
      toast.success('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        setPage('login');
        navigate('/auth', { replace: true });
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  // Shared styles to match original design
  const inputClass = "w-full bg-[hsl(var(--cream-bg))] border-2 border-[hsl(var(--gray-line))] rounded-2xl px-4 py-3 font-sans text-[0.9rem] text-kl-text-dark outline-none transition-all focus:border-kl-orange focus:shadow-[0_0_0_3px_hsl(var(--orange-20))]";
  const gradientButtonClass = "w-full py-3.5 rounded-[60px] font-bold text-[0.95rem] cursor-pointer border-none bg-gradient-to-br from-[#ffa257] to-[#ffb07c] text-white shadow-[0_4px_14px_rgba(255,162,87,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(255,162,87,0.35)] disabled:opacity-70 flex items-center justify-center gap-2";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden warm-bg p-6">
      {/* Floating foods */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {floatingFoodsPositions.map((item, i) => (
          <span
            key={i}
            className="absolute animate-floatAround"
            style={{
              ...(item.top ? { top: item.top } : { bottom: item.bottom }),
              ...(item.left ? { left: item.left } : { right: item.right }),
              fontSize: item.fontSize,
              opacity: 0.35,
              animationDelay: `${i * -1.5}s`,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.05))',
            }}
          >
            {item.emoji}
          </span>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[440px] mx-auto">
        {/* Logo */}
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 transition-transform hover:scale-105">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--green))] to-[hsl(var(--orange))] shadow-md">
              <img src="../../img/logo.png" alt="KhabirLens" className="h-11 w-11 rounded-xl object-cover" />
            </div>
            <div className="font-syne text-2xl font-extrabold text-[hsl(var(--green-dark))]">
              Khabir<span className="bg-gradient-to-br from-[hsl(var(--green))] to-[hsl(var(--orange))] bg-clip-text text-transparent">Lens</span>
            </div>
          </Link>
        </div>

        {/* Card – semi-transparent like original */}
        <div className="rounded-[32px] bg-white/10 p-8 shadow-lg backdrop-blur-sm border border-white/30 transition-all hover:shadow-xl relative overflow-hidden">
          {/* Decorative emojis */}
          <span className="absolute -top-2.5 -left-2.5 text-3xl opacity-10 pointer-events-none rotate-[-15deg]">🥗</span>
          <span className="absolute -bottom-2.5 -right-2.5 text-3xl opacity-10 pointer-events-none rotate-[15deg]">🥑</span>

          <div className="text-center mb-6">
            <h1 className="font-syne text-3xl font-extrabold bg-gradient-to-br from-kl-text-dark to-kl-orange bg-clip-text text-transparent">
              {page === 'login' && 'Welcome Back'}
              {page === 'register' && 'Create Account'}
              {page === 'forgot' && 'Reset Password'}
              {page === 'reset' && 'Set New Password'}
            </h1>
            <p className="text-kl-text-m text-sm mt-1">
              {page === 'login' && 'Log in to access your health dashboard'}
              {page === 'register' && 'Join KhabirLens as a patient'}
              {page === 'forgot' && "We'll send a reset link to your email"}
              {page === 'reset' && 'Create a strong password for your account'}
            </p>
          </div>

          {page === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[0.75rem] font-bold text-kl-text-m uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="user@example.com"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-[0.75rem] font-bold text-kl-text-m uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                  required
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-1.5 text-kl-text-m text-sm">
                  <input type="checkbox" className="accent-kl-green" /> Remember me
                </label>
                <button type="button" className="text-kl-text-m hover:text-kl-orange bg-transparent border-none cursor-pointer text-sm" onClick={() => setPage('forgot')}>
                  Forgot password?
                </button>
              </div>
              <button type="submit" disabled={loading} className={gradientButtonClass}>
                {loading ? 'Logging in...' : 'Log In →'}
              </button>
              <div className="flex items-center gap-3 my-4 text-kl-text-l text-sm">
                <span className="flex-1 h-px bg-kl-gray-line"></span><span>or</span><span className="flex-1 h-px bg-kl-gray-line"></span>
              </div>
              <button type="button" onClick={() => setPage('register')} className="w-full py-3.5 rounded-[60px] font-bold text-sm cursor-pointer bg-transparent text-kl-text-m border-2 border-kl-gray-line transition-all hover:border-kl-green hover:text-kl-green-dark hover:bg-kl-green-light">
                Create new account
              </button>
            </form>
          )}

          {page === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[0.75rem] font-bold text-kl-text-m uppercase tracking-wider mb-1">Full Name</label>
                <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Your Name" className={inputClass} required />
              </div>
              <div>
                <label className="block text-[0.75rem] font-bold text-kl-text-m uppercase tracking-wider mb-1">Email Address</label>
                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="user@example.com" className={inputClass} required />
              </div>
              <div>
                <label className="block text-[0.75rem] font-bold text-kl-text-m uppercase tracking-wider mb-1">Password</label>
                <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="••••••••" className={inputClass} required />
                <div className="mt-2">
                  <div className="flex justify-between text-xs font-semibold text-kl-text-l px-0.5 mb-1">
                    <span>Weak</span><span>Fair</span><span>Good</span><span>Strong</span>
                  </div>
                  <div className="flex gap-1">
                    {[0,1,2,3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-sm transition-all ${strengthClass(i, getPasswordStrength(regPassword))}`} />
                    ))}
                  </div>
                </div>
              </div>
              <button type="submit" disabled={loading} className={gradientButtonClass}>
                {loading ? 'Creating...' : 'Create Account →'}
              </button>
              <div className="flex items-center gap-3 my-4 text-kl-text-l text-sm">
                <span className="flex-1 h-px bg-kl-gray-line"></span><span>or</span><span className="flex-1 h-px bg-kl-gray-line"></span>
              </div>
              <button type="button" onClick={() => setPage('login')} className="w-full py-3.5 rounded-[60px] font-bold text-sm cursor-pointer bg-transparent text-kl-text-m border-2 border-kl-gray-line transition-all hover:border-kl-green hover:text-kl-green-dark hover:bg-kl-green-light">
                Sign in to existing account
              </button>
            </form>
          )}

          {page === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-[0.75rem] font-bold text-kl-text-m uppercase tracking-wider mb-1">Email Address</label>
                <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="user@example.com" className={inputClass} required />
              </div>
              <button type="submit" disabled={loading} className={gradientButtonClass}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => setPage('login')} className="w-full text-center text-kl-text-m text-sm hover:text-kl-orange mt-2">
                ← Back to login
              </button>
            </form>
          )}

          {page === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[0.75rem] font-bold text-kl-text-m uppercase tracking-wider mb-1">New Password</label>
                <input type="password" value={resetNewPass} onChange={(e) => setResetNewPass(e.target.value)} placeholder="Enter new password" className={inputClass} required />
              </div>
              <div>
                <label className="block text-[0.75rem] font-bold text-kl-text-m uppercase tracking-wider mb-1">Confirm Password</label>
                <input type="password" value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)} placeholder="Re-enter new password" className={inputClass} required />
              </div>
              <button type="submit" disabled={loading} className={gradientButtonClass}>
                {loading ? 'Resetting...' : 'Reset Password →'}
              </button>
              <button type="button" onClick={() => setPage('login')} className="w-full text-center text-kl-text-m text-sm hover:text-kl-orange mt-2">
                ← Back to login
              </button>
            </form>
          )}

          <div className="mt-4 pt-3 border-t border-dashed border-kl-gray-line flex items-center justify-center gap-1.5 text-xs text-kl-text-l">
            🔒 This is a secure, encrypted connection
          </div>
        </div>
      </div>

      <style>{`
        @keyframes floatAround {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -15px) rotate(5deg); }
          50% { transform: translate(35px, 5px) rotate(10deg); }
          75% { transform: translate(10px, 20px) rotate(5deg); }
        }
        .animate-floatAround {
          animation: floatAround 25s infinite ease-in-out;
        }
        .warm-bg {
          background: linear-gradient(135deg, #fef9f0 0%, #fff5e6 100%);
        }
      `}</style>
    </div>
  );
};

export default Auth;