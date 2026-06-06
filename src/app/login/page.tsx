import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from './login-form';
import { InstallButtonFloating } from '@/components/install-button';

export default async function LoginPage() {
  const t = await getTranslations('App');

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/logo.png"
          alt={t('title')}
          width={2657}
          height={1062}
          priority
          className="h-auto w-full max-w-[280px]"
        />
        <p className="text-center text-sm text-muted">{t('tagline')}</p>
      </div>
      <LoginForm />
      <InstallButtonFloating />
    </main>
  );
}
