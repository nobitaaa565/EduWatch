import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, ChevronLeft, Facebook } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';

export default function Auth({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const isSignIn = mode === 'signin';
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithFacebook, loginWithEmail, signUpWithEmail, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/feed', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    
    try {
      if (isSignIn) {
        await loginWithEmail(email, password);
        navigate('/feed');
      } else {
        await signUpWithEmail(email, password, fullName);
        navigate('/feed');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already registered.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'An authentication error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate('/feed');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user' || err.message?.includes('popup-closed-by-user')) {
        // Closed by user, do not show any error banner
        return;
      }
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setError('');
    setSubmitting(true);
    try {
      await loginWithFacebook();
      navigate('/feed');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user' || err.message?.includes('popup-closed-by-user')) {
        // Closed by user, do not show any error banner
        return;
      }
      setError(err.message || 'Failed to sign in with Facebook.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col lg:flex-row">
      {/* Left Side: Branding/Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-inverse-surface relative overflow-hidden p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle,rgba(46,107,255,0.4)_0%,transparent_70%)]"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle,rgba(163,62,0,0.2)_0%,transparent_70%)]"></div>
        </div>
        
        <Link to="/" className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-black text-lg">E</div>
          <span className="text-lg font-black tracking-tighter text-white">EduWatch</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-extrabold font-manrope text-white leading-tight tracking-tighter mb-6">
            Curating the future of educational excellence.
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Join 50,000+ educators and leaders who receive our weekly curated journals on pedagogy, edtech, and system design.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-5">
          <div className="flex -space-x-2.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-9 h-9 rounded-full border-2 border-inverse-surface bg-slate-800 overflow-hidden">
                <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="User" />
              </div>
            ))}
          </div>
          <p className="text-xs font-medium text-slate-500">Trusted by leaders at top tech universities.</p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 flex items-center gap-2 text-secondary hover:text-primary transition-colors group z-20"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-widest">Back</span>
        </button>

        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold font-manrope tracking-tight text-on-surface mb-1.5">
              {isSignIn ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-secondary text-xs font-medium">
              {isSignIn 
                ? 'Enter your credentials to access your curated dashboard.' 
                : 'Start your journey into high-end technical editorial.'}
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <button 
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-surface-container-low hover:bg-surface-container disabled:opacity-50 transition-all rounded-xl font-bold text-xs text-on-surface border border-outline-variant/10"
            >
              <img src="https://www.google.com/favicon.ico" className="w-3.5 h-3.5" alt="Google" />
              Continue with Google
            </button>
            <button 
              onClick={handleFacebookSignIn}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-surface-container-low hover:bg-surface-container disabled:opacity-50 transition-all rounded-xl font-bold text-xs text-on-surface border border-outline-variant/10"
            >
              <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
              Continue with Facebook
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/20"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
              <span className="bg-surface px-3 text-outline-variant">Or continue with email</span>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div 
                id="auth-error-message"
                className={cn(
                  "p-3 rounded-lg text-[11px] font-bold text-center transition-all duration-300",
                  error.includes("No registered account found with that username") 
                    ? "bg-red-500/10 border-2 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse" 
                    : "bg-error/10 border border-error/20 text-error"
                )}
              >
                {error}
              </div>
            )}
            {!isSignIn && (
              <div>
                <label className="block text-[10px] font-bold text-secondary mb-1.5 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline-variant" />
                  <input 
                    className="w-full bg-surface-container-low border-none rounded-xl pl-11 pr-4 py-3 text-on-surface text-xs focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all" 
                    placeholder="Alex Rivera" 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-secondary mb-1.5 uppercase tracking-wider">
                {isSignIn ? 'Email Address or Username' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline-variant" />
                <input 
                  className="w-full bg-surface-container-low border-none rounded-xl pl-11 pr-4 py-3 text-on-surface text-xs focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all" 
                  placeholder={isSignIn ? "alex@example.com or alex_rivera" : "alex@example.com"} 
                  type={isSignIn ? "text" : "email"} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Password</label>
                {isSignIn && (
                  <Link to="/forgot-password" title="Forgot password?" className="text-[9px] font-bold text-primary uppercase tracking-widest hover:underline">Forgot password?</Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline-variant" />
                <input 
                  className="w-full bg-surface-container-low border-none rounded-xl pl-11 pr-4 py-3 text-on-surface text-xs focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all" 
                  placeholder="Password (min 6 chars)" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isSignIn ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-secondary font-medium">
            {isSignIn ? "Don't have an account?" : "Already have an account?"}{' '}
            <Link 
              to={isSignIn ? "/signup" : "/signin"} 
              className="text-primary font-bold hover:underline"
            >
              {isSignIn ? 'Sign up for free' : 'Sign in here'}
            </Link>
          </p>

          <p className="mt-10 text-center text-[9px] text-outline-variant leading-relaxed">
            By continuing, you agree to EduWatch's <br />
            <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
