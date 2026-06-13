import { getTranslations } from 'next-intl/server';
import { LoginForm } from './login-form';
import { BrandLogo } from '@/components/brand-logo';
import { InstallButtonFloating } from '@/components/install-button';

export default async function LoginPage(props: PageProps<'/login'>) {
  const t = await getTranslations('App');
  const { next } = await props.searchParams;
  const nextPath = typeof next === 'string' ? next : '';

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-3">
        <BrandLogo alt={t('title')} className="h-auto w-full max-w-[280px]" />
        <p className="text-center text-sm text-muted">{t('tagline')}</p>
      </div>
      <LoginForm next={nextPath} />
      <InstallButtonFloating />
    </main>
  );
}
