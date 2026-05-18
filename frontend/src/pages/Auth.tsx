// src/pages/Auth.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, usersApi } from '@/services/shared/api';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Checkbox,
} from '@/components/ui';

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

  const strength = getPasswordStrength(regPassword);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden warm-bg p-6">
      {/* Floating foods – same as original */}
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
              <img src="/img/logo.png" alt="KhabirLens" className="h-11 w-11 rounded-xl object-cover" />
            </div>
            <div className="font-syne text-2xl font-extrabold text-[hsl(var(--green-dark))]">
              Khabir<span className="bg-gradient-to-br from-[hsl(var(--green))] to-[hsl(var(--orange))] bg-clip-text text-transparent">Lens</span>
            </div>
          </Link>
        </div>

        {/* Card – enhanced shadow + glassmorphic effect */}
        <Card className="relative overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm border border-white/30 shadow-kl-card transition-all hover:shadow-[0_24px_56px_rgba(0,0,0,0.16)]">
          {/* Decorative emojis */}
          <span className="absolute -top-2.5 -left-2.5 text-3xl opacity-10 pointer-events-none rotate-[-15deg]">🥗</span>
          <span className="absolute -bottom-2.5 -right-2.5 text-3xl opacity-10 pointer-events-none rotate-[15deg]">🥑</span>

          <CardHeader className="text-center pb-2">
            <CardTitle className="font-syne text-3xl font-extrabold bg-gradient-to-br from-[hsl(var(--text-dark))] to-[hsl(var(--orange))] bg-clip-text text-transparent">
              {page === 'login' && 'Welcome Back'}
              {page === 'register' && 'Create Account'}
              {page === 'forgot' && 'Reset Password'}
              {page === 'reset' && 'Set New Password'}
            </CardTitle>
            <CardDescription className="text-[hsl(var(--text-m))] text-sm mt-1 font-sans">
              {page === 'login' && 'Log in to access your health dashboard'}
              {page === 'register' && 'Join KhabirLens as a client'}
              {page === 'forgot' && "We'll send a reset link to your email"}
              {page === 'reset' && 'Create a strong password for your account'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {page === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="login-email" className="text-xs font-bold uppercase tracking-[0.8px] text-[hsl(var(--text-m))]">
                    Email Address
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="login-password" className="text-xs font-bold uppercase tracking-[0.8px] text-[hsl(var(--text-m))]">
                    Password
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" />
                    <Label htmlFor="remember" className="text-sm font-normal text-[hsl(var(--text-m))]">
                      Remember me
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-[hsl(var(--text-m))] hover:text-[hsl(var(--orange))]"
                    onClick={() => setPage('forgot')}
                  >
                    Forgot password?
                  </Button>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Log In →'}
                </Button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[hsl(var(--gray-line))]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-[hsl(var(--text-l))]">or</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setPage('register')}
                >
                  Create new account
                </Button>
              </form>
            )}

            {page === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="reg-name" className="text-xs font-bold uppercase tracking-[0.8px] text-[hsl(var(--text-m))]">
                    Full Name
                  </Label>
                  <Input
                    id="reg-name"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Your Name"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reg-email" className="text-xs font-bold uppercase tracking-[0.8px] text-[hsl(var(--text-m))]">
                    Email Address
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reg-password" className="text-xs font-bold uppercase tracking-[0.8px] text-[hsl(var(--text-m))]">
                    Password
                  </Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <div className="mt-2">
                    <div className="flex justify-between text-xs font-semibold text-[hsl(var(--text-l))] px-0.5 mb-1">
                      <span>Weak</span><span>Fair</span><span>Good</span><span>Strong</span>
                    </div>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-sm transition-all ${strengthClass(i, strength)}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Account →'}
                </Button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[hsl(var(--gray-line))]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-[hsl(var(--text-l))]">or</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setPage('login')}
                >
                  Sign in to existing account
                </Button>
              </form>
            )}

            {page === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="forgot-email" className="text-xs font-bold uppercase tracking-[0.8px] text-[hsl(var(--text-m))]">
                    Email Address
                  </Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-center"
                  onClick={() => setPage('login')}
                >
                  ← Back to login
                </Button>
              </form>
            )}

            {page === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="reset-password" className="text-xs font-bold uppercase tracking-[0.8px] text-[hsl(var(--text-m))]">
                    New Password
                  </Label>
                  <Input
                    id="reset-password"
                    type="password"
                    value={resetNewPass}
                    onChange={(e) => setResetNewPass(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reset-confirm" className="text-xs font-bold uppercase tracking-[0.8px] text-[hsl(var(--text-m))]">
                    Confirm Password
                  </Label>
                  <Input
                    id="reset-confirm"
                    type="password"
                    value={resetConfirm}
                    onChange={(e) => setResetConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password →'}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-center"
                  onClick={() => setPage('login')}
                >
                  ← Back to login
                </Button>
              </form>
            )}

            <div className="mt-6 pt-3 border-t border-dashed border-[hsl(var(--gray-line))] flex items-center justify-center gap-1.5 text-xs text-[hsl(var(--text-l))] font-sans">
              🔒 This is a secure, encrypted connection
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;