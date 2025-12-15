import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserIcon, LogoutIcon } from './Icons';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  userEmail: string | null;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, onLogout, userEmail }) => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  
  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Fetch Profile Data on Open
  useEffect(() => {
    if (isOpen) {
        fetchProfile();
    } else {
        // Reset states on close
        setIsChangingPassword(false);
        setNewPassword('');
        setConfirmPassword('');
        setPassError('');
        setPassSuccess('');
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setLoading(true);
    const token = localStorage.getItem('vinovault_token');
    try {
        const res = await fetch('/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setProfileData(data);
        }
    } catch (e) {
        console.error("Profile fetch error", e);
    } finally {
        setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword.length < 6) {
        setPassError("La password deve essere di almeno 6 caratteri.");
        return;
    }
    if (newPassword !== confirmPassword) {
        setPassError("Le password non coincidono.");
        return;
    }

    const token = localStorage.getItem('vinovault_token');
    try {
        const res = await fetch('/api/users/me/password', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ newPassword })
        });
        
        if (res.ok) {
            setPassSuccess("Password aggiornata con successo!");
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setIsChangingPassword(false), 2000);
        } else {
            const err = await res.json();
            setPassError(err.error || "Errore durante l'aggiornamento.");
        }
    } catch (e) {
        setPassError("Errore di connessione.");
    }
  };

  if (!isOpen) return null;

  // Visual Limits for Progress Bar (Mockup logic for visual context)
  const isPremium = profileData?.is_premium;
  const usageCount = profileData?.ai_usage_count || 0;
  const monthlyLimit = isPremium ? 1000 : 50; // Visual limit
  const usagePercentage = Math.min((usageCount / monthlyLimit) * 100, 100);

  const content = (
    <div className="fixed inset-0 bg-black/60 z-[250] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Header with User Icon */}
        <div className="bg-gradient-to-br from-wine-700 to-wine-900 p-6 text-white flex flex-col items-center relative">
             <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">✕</button>
             
             <div className="bg-white/10 p-4 rounded-full mb-3 backdrop-blur-sm">
                 <UserIcon className="w-10 h-10 text-white" filled />
             </div>
             <h2 className="font-serif font-bold text-lg">{userEmail}</h2>
             
             {/* Level Badge */}
             <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${isPremium ? 'bg-amber-400 text-amber-900 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-gray-200 text-gray-600 border-gray-300'}`}>
                 {isPremium ? 'Utente Premium' : 'Utente Free'}
             </div>
        </div>

        <div className="p-6 space-y-6">
            
            {/* Stats Section */}
            <div>
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Utilizzo AI (Mese)</span>
                    <span className="text-sm font-bold text-wine-900">{usageCount} <span className="text-gray-400 font-normal">/ {isPremium ? '∞' : monthlyLimit}</span></span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${isPremium ? 'bg-amber-400' : 'bg-wine-600'}`} 
                        style={{ width: `${usagePercentage}%` }}
                    ></div>
                </div>
                {!isPremium && (
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                        Passa a Premium per richieste illimitate.
                    </p>
                )}
            </div>

            <hr className="border-gray-100" />

            {/* Change Password Section */}
            <div>
                {!isChangingPassword ? (
                    <button 
                        onClick={() => setIsChangingPassword(true)}
                        className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Cambia Password
                    </button>
                ) : (
                    <form onSubmit={handleChangePassword} className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in slide-in-from-top-2">
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Nuova Password</h3>
                        <input 
                            type="password" 
                            placeholder="Nuova password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-wine-500"
                        />
                        <input 
                            type="password" 
                            placeholder="Conferma password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-wine-500"
                        />
                        
                        {passError && <p className="text-xs text-red-500 font-bold">{passError}</p>}
                        {passSuccess && <p className="text-xs text-green-600 font-bold">{passSuccess}</p>}

                        <div className="flex gap-2 pt-1">
                            <button 
                                type="button" 
                                onClick={() => setIsChangingPassword(false)}
                                className="flex-1 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                            >
                                Annulla
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 py-2 bg-wine-600 text-white rounded-lg text-xs font-bold shadow-sm"
                            >
                                Conferma
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Logout Button */}
            <button 
                onClick={() => { onLogout(); onClose(); }}
                className="w-full flex items-center justify-center gap-2 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors"
            >
                <LogoutIcon className="w-5 h-5" />
                Disconnetti
            </button>

        </div>
      </div>
    </div>
  );
  
  return createPortal(content, document.body);
};

export default UserProfileModal;