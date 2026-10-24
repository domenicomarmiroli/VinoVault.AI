// Stato condiviso dell'evento 'beforeinstallprompt': il browser lo emette
// una sola volta per sessione di pagina, quindi va catturato a livello
// globale (non dentro un singolo componente) così sia il banner sia il
// pulsante nelle impostazioni possono usarlo, anche se il banner è già
// stato chiuso.

type Listener = () => void;

let deferredEvent: any = null;
let installed = false;
const listeners = new Set<Listener>();

const notify = () => listeners.forEach(l => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    deferredEvent = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredEvent = null;
    notify();
  });
}

export const hasDeferredInstallPrompt = () => !!deferredEvent;

export const onInstallStateChange = (cb: Listener) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const isAppInstalled = () => {
  if (installed) return true;
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
};

export type InstallPlatform = 'android-chrome' | 'desktop-chrome' | 'ios-safari' | 'mac-safari' | 'other';

export const detectInstallPlatform = (): InstallPlatform => {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|EdgiOS|Edg\//.test(ua);
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isMac = /Macintosh/.test(ua) && !isIOS;
  if (isIOS && isSafari) return 'ios-safari';
  if (isMac && isSafari) return 'mac-safari';
  if (/Android/.test(ua)) return 'android-chrome';
  return 'desktop-chrome';
};

export const triggerInstallPrompt = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
  if (!deferredEvent) return 'unavailable';
  deferredEvent.prompt();
  const { outcome } = await deferredEvent.userChoice;
  deferredEvent = null;
  notify();
  return outcome;
};
