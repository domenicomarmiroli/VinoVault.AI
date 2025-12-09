
import React, { useState } from 'react';
import { Logo } from './Logo';

interface AuthFormProps {
  onLogin: (token: string, userEmail: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center mb-8">
            <Logo className="w-20 h-20 mb-4" />
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
                    placeholder="sommelier@esempio.com"
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
                {loading ? 'Attendere...' : (isLogin ? 'Accedi alla Cantina' : 'Crea Account')}
            </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <p className="text-gray-500 text-sm mb-2">
                {isLogin ? 'Nuovo sommelier?' : 'Hai già le chiavi?'}
            </p>
            <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-wine-700 font-bold hover:underline"
            >
                {isLogin ? 'Registrati gratuitamente' : 'Accedi al tuo account'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
