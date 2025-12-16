
import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { useLanguage } from '../contexts/LanguageContext';

declare global {
    interface Window {
        google: any;
    }
}

interface AuthFormProps {
  onLogin: (token: string, userEmail: string) => void;
  onBack?: () => void; // New prop
  referralRef?: string | null; // NEW: Origin of registration
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onBack, referralRef }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  
  const { t, language } = useLanguage();

  useEffect(() => {
      const fetchConfig = async () => {
          try {
              const res = await fetch('/api/config');
              if (res.ok) {
                  const data = await res.json();
                  if (data.googleClientId) setGoogleClientId(data.googleClientId);
              }
          } catch (e) {
              console.log("Config fetch failed", e);
          }
      };
      fetchConfig();
  }, []);

  useEffect(() => {
    if (window.google && googleClientId) {
        try {
            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: handleGoogleCallback
            });
            window.google.accounts.id.renderButton(
                document.getElementById("googleSignInBtn"),
                { theme: "outline", size: "large", width: "100%", text: isLogin ? "signin_with" : "signup_with" }
            );
        } catch (e) {
            console.error("Google Init Error", e);
        }
    }
  }, [googleClientId, isLogin]);

  const handleGoogleCallback = async (response: any) => {
      setLoading(true);
      setError('');
      try {
          const res = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  token: response.credential,
                  clientId: googleClientId,
                  language, // Send current detected language
                  ref: referralRef // Send referral
              })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Google login failed');
          onLogin(data.token, data.user.email);
      } catch (err: any) {
          setError("Errore login Google: " + err.message);
      } finally {
          setLoading(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload: any = { email, password, language };
    
    // Add referral only on registration
    if (!isLogin && referralRef) {
        payload.ref = referralRef;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) 
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Autenticazione fallita');
      }

      onLogin(data.token, data.user.email);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-500 relative">
        
        {onBack && (
            <button 
                onClick={onBack}
                className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 p-1"
                title="Indietro"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
            </button>
        )}

        <div className="flex flex-col items-center justify-center mb-8">
            <Logo className="w-20 h-20 mb-4" />
        </div>

        {googleClientId && (
            <div className="mb-6">
                <div id="googleSignInBtn" className="w-full h-[40px] flex justify-center"></div>
            </div>
        )}

        <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold">{t('or_email')}</span>
            <div className="flex-grow border-t border-gray-100"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-wine-600 outline-none transition-shadow"
                    placeholder="email@example.com"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-wine-600 outline-none transition-shadow"
                    placeholder="••••••••"
                />
            </div>

            {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</div>}

            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-wine-700 text-white font-bold rounded-xl hover:bg-wine-800 transition-all shadow-lg shadow-wine-200 disabled:opacity-50 transform active:scale-[0.98]"
            >
                {loading ? t('loading') : (isLogin ? t('login_title') : t('register_title'))}
            </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-wine-700 font-bold hover:underline text-sm"
            >
                {isLogin ? t('register_btn') : t('login_btn')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
