import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { BottomDock } from "@/components/bottom-dock";
import { InstallPromptProvider } from "@/components/install-prompt-provider";
import { SkinManager } from "@/components/skin-manager";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_SKIN,
  isSkinStyle,
  SKIN_STORAGE_KEY,
  SKINS,
  type SkinStyle,
} from "@/lib/skins";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("App");
  return {
    title: t("title"),
    description: t("tagline"),
    manifest: "/manifest.webmanifest",
  };
}

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  // Skin del perfil (puede ser null = "sin fijar"). La resolución final
  // (localStorage / BD / aleatoria) la hace SkinManager tras la hidratación.
  let dbSkin: SkinStyle | null = null;
  let loggedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      loggedIn = true;
      const { data } = await supabase
        .from("users")
        .select("skin")
        .eq("id", user.id)
        .single();
      if (isSkinStyle(data?.skin)) dbSkin = data.skin;
    }
  } catch {
    // Sin sesión o consulta fallida: la skin se resuelve en cliente.
  }

  // Script de arranque: fija data-skin ANTES del primer pintado para evitar
  // parpadeo. Precedencia: skin de BD (con sesión) → localStorage → por defecto.
  // Los casos sin resolver (sin BD ni localStorage) los completa SkinManager.
  const skinBootstrap = `(function(){try{var valid=${JSON.stringify(
    SKINS.map((s) => s.style),
  )};var s=${JSON.stringify(dbSkin)};var v=localStorage.getItem(${JSON.stringify(
    SKIN_STORAGE_KEY,
  )});if(valid.indexOf(v)<0)v=null;document.documentElement.dataset.skin=s||v||${JSON.stringify(
    DEFAULT_SKIN,
  )};}catch(e){document.documentElement.dataset.skin=${JSON.stringify(
    DEFAULT_SKIN,
  )};}})();`;

  return (
    <html lang={locale} suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col pb-28">
        <script dangerouslySetInnerHTML={{ __html: skinBootstrap }} />
        <NextIntlClientProvider>
          <SkinManager dbSkin={dbSkin} loggedIn={loggedIn} />
          <InstallPromptProvider>
            {children}
            <BottomDock />
          </InstallPromptProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
