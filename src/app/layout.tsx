import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { BottomDock } from "@/components/bottom-dock";
import { InstallPromptProvider } from "@/components/install-prompt-provider";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("App");
  return {
    title: t("title"),
    description: t("tagline"),
    manifest: "/manifest.webmanifest",
    themeColor: "#000000",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col pb-28">
        <NextIntlClientProvider>
          <InstallPromptProvider>
            {children}
            <BottomDock />
          </InstallPromptProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
