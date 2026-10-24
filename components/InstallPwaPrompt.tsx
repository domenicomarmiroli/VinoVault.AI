import React, { useEffect, useState } from 'react';

const DISMISS_KEY = 'aiknow_install_dismissed_at';
const DISMISS_DAYS = 10;

type Platform = 'android-chrome' | 'desktop-chrome' | 'ios-safari' | 'mac-safari' | 'other';

const detectPlatform = (): Platform => {
  const ua = navigator.userAgent;
  const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|EdgiOS|Edg\//.test(ua);
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isMac = /Macintosh/.test(ua) && !isIOS;
  if (isIOS && isSafari) return 'ios-safari';
  if (isMac && isSafari) return 'mac-safari';
  if (/Android/.test(ua)) return 'android-chrome';
  return 'desktop-chrome';
};

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as any).standalone === true;

const wasRecentlyDismissed = () => {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (!dismissedAt) return false;
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return daysSince < DISMISS_DAYS;
};

const InstallPwaPrompt: React.FC = () => {
  const [deferredEvent, setDeferredEvent] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>('other');

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return;

    setPlatform(detectPlatform());

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Safari (iOS e Mac) non emette beforeinstallprompt: mostriamo
    // istruzioni manuali dopo un breve ritardo, così non è intrusivo.
    const detected = detectPlatform();
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (detected === 'ios-safari' || detected === 'mac-safari') {
      timer = setTimeout(() => setVisible(true), 2500);
    }

    const handleInstalled = () => {
      setVisible(false);
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  const handleInstallClick = async () => {
    if (!deferredEvent) return;
    deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    if (outcome === 'accepted' || outcome === 'dismissed') {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setVisible(false);
    setDeferredEvent(null);
  };

  if (!visible) return null;

  const isManual = platform === 'ios-safari' || platform === 'mac-safari';

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-start gap-3 animate-in slide-in-from-bottom duration-300">
        <div className="w-10 h-10 rounded-xl bg-wine-700 flex items-center justify-center shrink-0 text-white font-black text-sm">AI</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">Installa AIKNOW.WINE</p>
          {isManual ? (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              {platform === 'ios-safari'
                ? <>Tocca <span className="font-semibold">Condividi</span> <span aria-hidden>⬆️</span> poi <span className="font-semibold">"Aggiungi alla schermata Home"</span>.</>
                : <>Apri il menu <span className="font-semibold">Condividi</span> nella barra di Safari e scegli <span className="font-semibold">"Aggiungi al Dock"</span>.</>}
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5">Accedi più velocemente, anche offline, direttamente dalla home del telefono o del computer.</p>
          )}
          {!isManual && (
            <div className="flex gap-2 mt-3">
              <button onClick={handleInstallClick} className="flex-1 py-2 bg-wine-700 text-white text-xs font-bold rounded-lg hover:bg-wine-800 transition-colors">Installa</button>
              <button onClick={dismiss} className="px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">Non ora</button>
            </div>
          )}
          {isManual && (
            <button onClick={dismiss} className="mt-2 text-xs font-medium text-gray-400 hover:text-gray-600">Ho capito</button>
          )}
        </div>
        <button onClick={dismiss} aria-label="Chiudi" className="text-gray-300 hover:text-gray-500 shrink-0 leading-none text-lg">×</button>
      </div>
    </div>
  );
};

export default InstallPwaPrompt;
