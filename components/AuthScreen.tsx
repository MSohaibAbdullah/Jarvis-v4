
import React, { useState } from 'react';
import { User } from '../types';
import { generateId } from '../services/storageService';
import { auth } from '../services/firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile,
  AuthError
} from 'firebase/auth';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGuestLogin = () => {
    const guestUser: User = {
      id: generateId(),
      name: 'Guest Operator',
      isGuest: true,
      provider: 'guest'
    };
    onLogin(guestUser);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const appUser: User = {
        id: user.uid,
        name: user.displayName || 'Google User',
        email: user.email || '',
        isGuest: false,
        provider: 'google'
      };
      
      onLogin(appUser);
    } catch (err: any) {
      console.error(err);
      setError("Google Authentication Failed: " + err.message);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isRegistering && !name) return;

    setIsLoading(true);
    setError(null);
    
    try {
      let userCredential;
      
      if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Update display name immediately after registration
        if (auth.currentUser && name) {
          await updateProfile(auth.currentUser, { displayName: name });
        }
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const firebaseUser = userCredential.user;
      
      const appUser: User = {
        id: firebaseUser.uid,
        name: isRegistering ? name : (firebaseUser.displayName || email.split('@')[0]),
        email: firebaseUser.email || email,
        isGuest: false,
        provider: 'email'
      };

      onLogin(appUser);
    } catch (err: any) {
      console.error(err);
      let msg = "Authentication failed.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already in use.";
      if (err.code === 'auth/wrong-password') msg = "Invalid credentials.";
      if (err.code === 'auth/user-not-found') msg = "User not found.";
      if (err.code === 'auth/weak-password') msg = "Password is too weak.";
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-white font-sans text-gray-800 p-4">
      <div className="w-full max-w-md animate-fade-in">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-2xl shadow-black/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-black">JARVIS</h1>
            <p className="text-sm text-gray-500 font-medium tracking-wide uppercase mt-1">Sovereign Intelligence Interface</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-8 relative overflow-hidden">
          
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-black rounded-full animate-spin"></div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {isRegistering && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="Tony Stark"
                />
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                placeholder="operator@jarvis.net"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg font-medium text-sm hover:bg-neutral-800 transition-transform active:scale-[0.98] shadow-lg mt-2"
            >
              {isRegistering ? 'Initialize Account' : 'Authenticate'}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-gray-100 flex-1"></div>
            <span className="text-xs text-gray-400 font-medium">OR ACCESS VIA</span>
            <div className="h-px bg-gray-100 flex-1"></div>
          </div>

          <div className="space-y-3">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 group"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Google Account</span>
            </button>
            
            <button 
              type="button"
              onClick={handleGuestLogin}
              className="w-full bg-gray-50 border border-transparent text-gray-500 py-2.5 rounded-lg font-medium text-sm hover:text-black hover:bg-gray-100 transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            {isRegistering ? "Already have a clearance?" : "Need a new access node?"}{" "}
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-black font-semibold hover:underline"
            >
              {isRegistering ? "Log in" : "Register now"}
            </button>
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-4 text-[10px] text-gray-400 uppercase tracking-widest">
            <span>Secure</span>
            <span>•</span>
            <span>Encrypted</span>
            <span>•</span>
            <span>Local</span>
        </div>

      </div>
    </div>
  );
};
