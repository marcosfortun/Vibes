import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { SignupForm } from './signup-form';
import { BrandLogo } from '@/components/brand-logo';
import { InstallButtonFloating } from '@/components/install-button';

export default async function SignupPage(props: PageProps<'/signup'>) {
  const { invite_token, next } = await props.searchParams;
  const inviteToken = typeof invite_token === 'string' ? invite_token : '';
  const nextPath =
    typeof next === 'string' ? next : inviteToken ? `/invite/${inviteToken}` : '/';

  // Validamos el token en carga para informar antes de que el usuario rellene nada.
  let tokenValid = false;
  if (inviteToken) {
    const supabase = await createClient();
    const { data } = await supabase.rpc('invite_token_valid', {
      t: inviteToken,
    });
    tokenValid = Boolean(data);
  }

  const t = await getTranslations('App');

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-3">
        <BrandLogo alt={t('title')} className="h-auto w-full max-w-[280px]" />
        <p className="text-center text-sm text-muted">{t('tagline')}</p>
      </div>
      <SignupForm
        inviteToken={inviteToken}
        tokenValid={tokenValid}
        next={nextPath}
      />
      <InstallButtonFloating />
    </main>
  );
}
