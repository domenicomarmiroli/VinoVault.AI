
import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../types';

interface AuthFormProps {
  onLogin: (token: string, userEmail: string) => void;
  onBack?: () => void;
  referralRef?: string | null;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onBack, referralRef }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Rilevamento immediato e aggressivo dell'ambiente APP
  const [isApp, setIsApp] = useState(() => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    const w = window as any;
    
    // Controlliamo: 
    // 1. Stringa custom (AIKNOW-APP) impostata nel pannello WebToNative
    // 2. Presenza dei bridge JavaScript comuni
    // 3. Flag standard di WebView
    return (
        ua.includes('aiknow-app') || 
        ua.includes('webtonative') || 
        !!(w.WTN || w.webtonative || w.webInterface || w.AndroidInterface) ||
        (ua.includes('wv') && ua.includes('android'))
    );
  });
  
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
      // Polling di sicurezza per il bridge (se lo UserAgent dovesse tardare o fallire)
      const interval = setInterval(() => {
          const w = window as any;
          const hasBridge = !!(w.WTN || w.webtonative || w.webInterface || w.AndroidInterface);
          if (hasBridge && !isApp) {
              setIsApp(true);
              clearInterval(interval);
          }
      }, 500);
      
      const timeout = setTimeout(() => clearInterval(interval), 4000);
      return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [isApp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, language, ref: referralRef })
        });
        const data = await res.json();
        if (res.ok) onLogin(data.token, data.user.email);
        else setError(data.error || 'Errore di autenticazione');
    } catch (err) { 
        setError('Errore di connessione al server'); 
    } finally { 
        setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative overflow-hidden border border-gray-100">
        
        {onBack && (
            <button onClick={onBack} className="absolute top-6 left-6 text-gray-300 p-1 hover:text-wine-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
            </button>
        )}

        <div className="flex flex-col items-center justify-center mb-8">
            <Logo className="w-20 h-20 mb-2" />
            <p className="text-gray-400 text-[9px] uppercase font-black tracking-[0.2em]">
                {isApp ? "Mobile App Interface" : "Web Sommelier Portal"}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Email</label>
                <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full p-3.5 border-2 border-gray-50 rounded-2xl focus:border-wine-600 outline-none bg-gray-50/50 transition-colors" 
                />
            </div>
            <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Password</label>
                <input 
                    type="password" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full p-3.5 border-2 border-gray-50 rounded-2xl focus:border-wine-600 outline-none bg-gray-50/50 transition-colors" 
                />
            </div>

            {error && <div className="text-red-500 text-[10px] font-bold text-center bg-red-50 p-3 rounded-2xl border border-red-100">{error}</div>}

            <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-4 bg-wine-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg disabled:opacity-50 active:scale-[0.98] transition-all"
            >
                {loading ? t('loading') : (isLogin ? t('login_title') : t('register_title'))}
            </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-50 space-y-4">
            <button onClick={() => setIsLogin(!isLogin)} className="text-wine-700 font-black text-[10px] uppercase tracking-widest hover:underline block mx-auto">
                {isLogin ? t('register_btn') : t('login_btn')}
            </button>
            <div className="flex justify-center items-center gap-1.5 opacity-50">
                {(['it', 'en', 'fr', 'es', 'de'] as Language[]).map(l => (
                    <button key={l} onClick={() => setLanguage(l)} className={`text-[9px] font-black w-6 h-6 rounded-lg ${language === l ? 'bg-wine-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {l.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );  
};

export default AuthForm;
