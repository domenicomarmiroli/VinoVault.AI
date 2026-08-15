
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserIcon, LogoutIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useAnalysisStyle } from '../contexts/AnalysisStyleContext';
import { Language } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  userEmail: string | null;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, onLogout, userEmail }) => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  
  // Language Context
  const { language, setLanguage, t } = useLanguage();
  const { analysisStyle, setAnalysisStyle } = useAnalysisStyle();

  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Account Deletion State
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch Profile Data on Open
  useEffect(() => {
    if (isOpen) {
        fetchProfile();
    } else {
        setIsChangingPassword(false);
        setNewPassword('');
        setConfirmPassword('');
        setPassError('');
        setPassSuccess('');
        setIsDeletingAccount(false);
        setDeleteConfirmText('');
        setDeleteError('');
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
            if (data.language) {
                setLanguage(data.language as Language);
            }
        }
    } catch (e) {
        console.error("Profile fetch error", e);
    } finally {
        setLoading(false);
    }
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newLang = e.target.value as Language;
      setLanguage(newLang); // Update UI immediately
      
      const token = localStorage.getItem('vinovault_token');
      try {
          await fetch('/api/users/me/language', {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({ language: newLang })
          });
      } catch (e) {
          console.error("Language update failed", e);
      }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword.length < 6) {
        setPassError("Password min 6 chars.");
        return;
    }
    if (newPassword !== confirmPassword) {
        setPassError("Password mismatch.");
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
            setPassSuccess("OK!");
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setIsChangingPassword(false), 2000);
        } else {
            const err = await res.json();
            setPassError(err.error || "Error.");
        }
    } catch (e) {
        setPassError("Connection error.");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (deleteConfirmText.trim().toLowerCase() !== (userEmail || '').trim().toLowerCase()) {
        setDeleteError("L'email non corrisponde.");
        return;
    }

    setDeleteLoading(true);
    const token = localStorage.getItem('vinovault_token');
    try {
        const res = await fetch('/api/users/me', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            onLogout();
            onClose();
        } else {
            const err = await res.json().catch(() => ({}));
            setDeleteError(err.error || "Eliminazione non riuscita.");
        }
    } catch (e) {
        setDeleteError("Errore di connessione.");
    } finally {
        setDeleteLoading(false);
    }
  };

  if (!isOpen) return null;

  const isPremium = profileData?.is_premium;
  const usageCount = profileData?.ai_usage_count || 0;
  const monthlyLimit = isPremium ? 1000 : 50;
  const usagePercentage = Math.min((usageCount / monthlyLimit) * 100, 100);

  const content = (
    <div className="fixed inset-0 bg-black/60 z-[250] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-sm max-h-[90vh] rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-br from-wine-700 to-wine-900 p-6 text-white flex flex-col items-center relative shrink-0">
             <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">✕</button>

             <div className="bg-white/10 p-4 rounded-full mb-3 backdrop-blur-sm">
                 <UserIcon className="w-10 h-10 text-white" filled />
             </div>
             <h2 className="font-serif font-bold text-lg">{userEmail}</h2>

             <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${isPremium ? 'bg-amber-400 text-amber-900 border-amber-300' : 'bg-gray-200 text-gray-600 border-gray-300'}`}>
                 {isPremium ? 'Premium' : 'Free Plan'}
             </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">

            {/* Language Selector */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t('language')}</label>
                <select 
                    value={language} 
                    onChange={handleLanguageChange}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                    <option value="it">Italiano</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                </select>
            </div>

            <hr className="border-gray-100" />

            {/* Analysis Style Selector */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Stile Analisi AI</label>
                <div className="flex p-1 bg-gray-100 rounded-xl">
                    <button
                        onClick={() => setAnalysisStyle('pop')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${analysisStyle === 'pop' ? 'bg-white shadow-sm text-wine-700' : 'text-gray-500'}`}
                    >
                        Semplice
                    </button>
                    <button
                        onClick={() => setAnalysisStyle('sommelier')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${analysisStyle === 'sommelier' ? 'bg-white shadow-sm text-wine-700' : 'text-gray-500'}`}
                    >
                        Sommelier
                    </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">
                    {analysisStyle === 'sommelier'
                        ? 'Linguaggio tecnico e analisi approfondita, per chi conosce già il vino.'
                        : 'Linguaggio semplice e consigli pratici, pensato per chi non è un esperto.'}
                </p>
            </div>

            <hr className="border-gray-100" />

            {/* Stats Section */}
            <div>
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">AI Usage</span>
                    <span className="text-sm font-bold text-wine-900">{usageCount} <span className="text-gray-400 font-normal">/ {isPremium ? '∞' : monthlyLimit}</span></span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${isPremium ? 'bg-amber-400' : 'bg-wine-600'}`} 
                        style={{ width: `${usagePercentage}%` }}
                    ></div>
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* Change Password */}
            <div>
                {!isChangingPassword ? (
                    <button 
                        onClick={() => setIsChangingPassword(true)}
                        className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Change Password
                    </button>
                ) : (
                    <form onSubmit={handleChangePassword} className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                        <input type="password" placeholder="Confirm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                        {passError && <p className="text-xs text-red-500">{passError}</p>}
                        {passSuccess && <p className="text-xs text-green-600">{passSuccess}</p>}
                        <div className="flex gap-2 pt-1">
                            <button type="button" onClick={() => setIsChangingPassword(false)} className="flex-1 py-2 text-xs font-bold text-gray-500">Cancel</button>
                            <button type="submit" className="flex-1 py-2 bg-wine-600 text-white rounded-lg text-xs font-bold">Confirm</button>
                        </div>
                    </form>
                )}
            </div>

            <button
                onClick={() => { onLogout(); onClose(); }}
                className="w-full flex items-center justify-center gap-2 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors"
            >
                <LogoutIcon className="w-5 h-5" />
                {t('logout')}
            </button>

            <hr className="border-gray-100" />

            {/* Eliminazione account — richiesta da App Store e Google Play */}
            <div>
                {!isDeletingAccount ? (
                    <button
                        onClick={() => setIsDeletingAccount(true)}
                        className="w-full py-2.5 text-xs font-bold text-gray-400 hover:text-red-600 transition-colors"
                    >
                        Elimina account
                    </button>
                ) : (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                        <div>
                            <h4 className="text-sm font-bold text-red-900">Eliminare definitivamente l'account?</h4>
                            <p className="text-xs text-red-700/80 mt-1 leading-relaxed">
                                Verranno cancellati per sempre i tuoi vini, le foto, lo storico delle degustazioni
                                e le tue valutazioni. L'operazione non è reversibile.
                            </p>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-red-800 mb-1">
                                Scrivi <span className="font-mono">{userEmail}</span> per confermare
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder={userEmail || ''}
                                autoComplete="off"
                                className="w-full p-2 border border-red-300 rounded-lg text-sm bg-white"
                            />
                        </div>
                        {deleteError && <p className="text-xs text-red-600 font-medium">{deleteError}</p>}
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setIsDeletingAccount(false); setDeleteConfirmText(''); setDeleteError(''); }}
                                className="flex-1 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleteLoading ? 'Elimino...' : 'Elimina definitivamente'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-center gap-4 text-[11px] text-gray-400 pt-1">
                <a href="/privacy" className="hover:text-wine-700 hover:underline">Privacy</a>
                <span>·</span>
                <a href="/termini" className="hover:text-wine-700 hover:underline">Termini</a>
            </div>

        </div>
      </div>
    </div>
  );
  
  return createPortal(content, document.body);
};

export default UserProfileModal;
