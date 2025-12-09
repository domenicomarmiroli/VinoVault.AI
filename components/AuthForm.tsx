
import React, { useState } from 'react';

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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-serif font-bold text-wine-900 mb-2">VinoVault</h1>
            <p className="text-gray-500">La tua cantina digitale intelligente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-wine-600 outline-none"
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
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-wine-600 outline-none"
                    placeholder="••••••••"
                />
            </div>

            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-wine-700 text-white font-bold rounded-xl hover:bg-wine-800 transition-colors shadow-lg shadow-wine-200 disabled:opacity-50"
            >
                {loading ? 'Attendere...' : (isLogin ? 'Accedi' : 'Registrati')}
            </button>
        </form>

        <div className="mt-6 text-center">
            <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-wine-600 hover:text-wine-800 font-medium"
            >
                {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
