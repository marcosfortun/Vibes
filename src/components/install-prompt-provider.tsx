'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

// ¿La app corre como instalada? Standalone display o iOS standalone.
// Es estado del navegador: se lee con useSyncExternalStore para evitar
// setState síncrono en un efecto y desajustes de hidratación (SSR → false).
const STANDALONE_QUERY = '(display-mode: standalone)';

function subscribeStandalone(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia(STANDALONE_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getStandaloneSnapshot() {
  return (
    window.matchMedia(STANDALONE_QUERY).matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type Ctx = {
  canInstall: boolean;
  isInstalled: boolean;
  install: () => Promise<void>;
};

const InstallCtx = createContext<Ctx>({
  canInstall: false,
  isInstalled: false,
  install: async () => {},
});

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  // Instalada durante la sesión (evento appinstalled o install() aceptado).
  const [installedThisSession, setInstalledThisSession] = useState(false);
  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    () => false,
  );
  const isInstalled = isStandalone || installedThisSession;

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      setInstalledThisSession(true);
      setPromptEvent(null);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    // Registro del service worker (requisito de PWA instalable).
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') setInstalledThisSession(true);
    setPromptEvent(null);
  }

  return (
    <InstallCtx.Provider
      value={{ canInstall: !!promptEvent, isInstalled, install }}
    >
      {children}
    </InstallCtx.Provider>
  );
}

export function useInstallPrompt() {
  return useContext(InstallCtx);
}
