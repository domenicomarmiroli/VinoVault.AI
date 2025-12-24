
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
  const [googleClientId, setGoogleClientId] = useState('');
  const [isWtnReady, setIsWtnReady] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>(["Inizializzazione..."]);
  
  const { t, language, setLanguage } = useLanguage();

  const addLog = (msg: string) => {
    console.log("AUTH_LOG:", msg);
    setDebugLog(prev => [msg, ...prev].slice(0, 5));
  };

  useEffect(() => {
      // 1. Carica configurazione
      const fetchConfig = async () => {
          try {
              addLog("Chiamata /api/config...");
              const res = await fetch('/api/config');
              if (res.ok) {
                  const data = await res.json();
                  if (data.googleClientId) {
                      setGoogleClientId(data.googleClientId);
                      addLog("Client ID Ricevuto");
                  } else {
                      addLog("ERRORE: Client ID vuoto nella risposta");
                  }
              } else {
                  addLog("ERRORE: Status " + res.status);
              }
          } catch (e: any) {
              addLog("ECCEZIONE Config: " + e.message);
          }
      };
      fetchConfig();

      // 2. Rilevamento SDK WebToNative
      const interval = setInterval(() => {
          const WTN = (window as any).WTN;
          if (WTN?.socialLogin?.google) {
              setIsWtnReady(true);
              addLog("SDK WTN Rilevato");
              clearInterval(interval);
          }
      }, 1000);

      return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = (e?: any) => {
      if (e) {
          e.preventDefault();
          e.stopPropagation();
      }
      
      addLog("Tasto Google premuto");
      
      const WTN = (window as any).WTN;
      
      if (WTN?.socialLogin?.google) {
          addLog("Avvio Login Nativo...");
          setLoading(true);
          try {
              WTN.socialLogin.google.login({
                  callback: async (response: any) => {
                      addLog("Risposta WTN ricevuta");
                      if (response.isSuccess && response.idToken) {
                          try {
                              const res = await fetch('/api/auth/google', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                      token: response.idToken,
                                      language,
                                      ref: referralRef
                                  })
                              });
                              const data = await res.json();
                              if (res.ok) onLogin(data.token, data.user.email);
                              else {
                                  setError(data.error || 'Server Error');
                                  setLoading(false);
                              }
                          } catch (e) {
                              addLog("Errore fetch server");
                              setLoading(false);
                          }
                      } else {
                          setLoading(false);
                          addLog("Google App Fallito/Annullato");
                      }
                  }
              });
          } catch (err: any) {
              setLoading(false);
              addLog("Crash chiamata WTN: " + err.message);
          }
          return;
      }

      if (googleClientId) {
          addLog("Avvio Redirect Web...");
          const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
          const options: any = {
              client_id: googleClientId,
              redirect_uri: window.location.origin,
              response_type: 'id_token',
              scope: 'openid email profile',
              nonce: Math.random().toString(36).substring(2),
              state: JSON.stringify({ language, ref: referralRef }),
              prompt: 'select_account'
          };
          const qs = Object.keys(options).map(k => `${k}=${encodeURIComponent(options[k])}`).join('&');
          window.location.href = `${rootUrl}?${qs}`;
      } else {
          addLog("ERRORE: No ID, No WTN");
          alert("Sistema non pronto. Controlla i log di debug in alto.");
      }
  };

  // Fix: Added the handleSubmit function to process the manual email/password authentication form.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
        ? { email, password } 
        : { email, password, language, ref: referralRef };

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await res.json();
        if (res.ok) {
            onLogin(data.token, data.user.email);
        } else {
            setError(data.error || 'Authentication failed');
        }
    } catch (err: any) {
        addLog("ECCEZIONE Submit: " + err.message);
        setError('Connection error. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      
      {/* DEBUG PANEL - VISIBILE SOLO SE CI SONO ERRORI O IN TEST */}
      <div className="w-full max-w-md mb-4 p-2 bg-black text-[10px] font-mono text-green-400 rounded border border-gray-800 overflow-hidden shadow-lg">
          <div className="flex justify-between text-gray-500 mb-1 border-b border-gray-900 pb-1">
              <span>SYSTEM DEBUG LOG</span>
              <span>v1.2</span>
          </div>
          {debugLog.map((log, i) => (
              <div key={i} className={log.includes("ERRORE") ? "text-red-500" : ""}>
                  {`> ${log}`}
              </div>
          ))}
      </div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative overflow-hidden">
        
        {onBack && (
            <button onClick={onBack} className="absolute top-6 left-6 text-gray-400 p-1 z-50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
            </button>
        )}

        <div className="flex flex-col items-center justify-center mb-8">
            <Logo className="w-20 h-20 mb-4" />
            <div className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isWtnReady ? 'bg-emerald-500 animate-pulse' : 'bg-orange-400'}`}></div>
                {isWtnReady ? "Native App Active" : "Web Mode Active"}
            </div>
        </div>

        <div className="mb-6">
            <button 
                onClick={handleGoogleLogin}
                onTouchStart={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98] relative z-[999] pointer-events-auto"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-gray-700 font-bold">{loading ? t('loading') : t(isLogin ? 'signin_with' : 'signup_with')}</span>
            </button>
        </div>

        <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] uppercase font-bold tracking-widest">{t('or_email')}</span>
            <div className="flex-grow border-t border-gray-100"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-wine-600 outline-none bg-gray-50/50"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Password</label>
                <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-wine-600 outline-none bg-gray-50/50"
                />
            </div>

            {error && <div className="text-red-500 text-xs font-bold text-center bg-red-50 p-2.5 rounded-xl border border-red-100">{error}</div>}

            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-wine-700 text-white font-bold rounded-xl shadow-lg shadow-wine-200 disabled:opacity-50 active:scale-[0.98]"
            >
                {loading ? t('loading') : (isLogin ? t('login_title') : t('register_title'))}
            </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-100 space-y-4">
            <button onClick={() => setIsLogin(!isLogin)} className="text-wine-700 font-bold hover:underline text-sm block mx-auto">
                {isLogin ? t('register_btn') : t('login_btn')}
            </button>

            <div className="flex justify-center items-center gap-2 pt-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('language')}:</span>
                <div className="flex gap-2">
                    {(['it', 'en', 'fr', 'es', 'de'] as Language[]).map(l => (
                        <button 
                            key={l}
                            onClick={() => setLanguage(l)}
                            className={`text-[10px] font-black w-7 h-7 rounded-lg flex items-center justify-center transition-all ${language === l ? 'bg-wine-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}
                        >
                            {l.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );  
};

export default AuthForm;
