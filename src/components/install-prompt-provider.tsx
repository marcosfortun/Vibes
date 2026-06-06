'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

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
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // ¿Ya está instalada? Standalone display o iOS standalone.
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      setIsInstalled(true);
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
    if (choice.outcome === 'accepted') setIsInstalled(true);
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
