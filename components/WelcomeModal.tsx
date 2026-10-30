import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CameraIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

// Primo accesso in 60 secondi: una domanda facoltativa, poi subito la prima etichetta.
const HEARD_FROM = ['fiera', 'biglietto', 'passaparola', 'social', 'google', 'locale', 'altro'] as const;

interface WelcomeModalProps {
  isOpen: boolean;
  onScan: () => void;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onScan, onClose }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<'heard' | 'scan'>('heard');

  if (!isOpen) return null;

  const answer = (heardFrom: string) => {
    const token = localStorage.getItem('vinovault_token');
    fetch('/api/users/me/heard-from', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ heardFrom }),
    }).catch(() => { /* la risposta è facoltativa */ });
    setStep('scan');
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/70 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="bg-wine-700 px-6 pt-6 pb-5 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-wine-200">{step === 'heard' ? '1 / 2' : '2 / 2'}</p>
          <h2 className="text-2xl font-serif font-bold mt-1">{step === 'heard' ? t('welcome_title') : t('welcome_first_title')}</h2>
        </div>

        {step === 'heard' ? (
          <div className="p-6 space-y-4">
            <p className="font-bold text-gray-900">{t('welcome_heard_q')}</p>
            <div className="flex flex-wrap gap-2">
              {HEARD_FROM.map(option => (
                <button
                  key={option}
                  onClick={() => answer(option)}
                  className="px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 hover:border-wine-400 hover:bg-wine-50 active:scale-95 transition-all"
                >
                  {t(`heard_${option}`)}
                </button>
              ))}
            </div>
            <button onClick={() => setStep('scan')} className="w-full text-xs font-bold text-gray-400 hover:text-gray-600 pt-2">
              {t('welcome_skip')}
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <p className="text-sm text-gray-600 leading-relaxed">{t('welcome_first_desc')}</p>
            <button
              onClick={onScan}
              className="w-full py-4 bg-wine-700 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <CameraIcon className="w-5 h-5" /> {t('welcome_scan_cta')}
            </button>
            <button onClick={onClose} className="w-full text-xs font-bold text-gray-400 hover:text-gray-600">
              {t('welcome_explore')}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default WelcomeModal;
