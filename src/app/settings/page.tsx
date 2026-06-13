import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/settings-form';
import { InstallButtonInline } from '@/components/install-button';
import { logout } from '@/lib/actions/auth';

export default async function SettingsPage() {
  const t = await getTranslations();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('username, role, language, use_affinity_scoring')
    .eq('id', user!.id)
    .single();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">{t('Settings.title')}</h1>
        {profile?.username && (
          <p className="text-sm text-muted">{profile.username}</p>
        )}
      </header>

      <SettingsForm
        language={profile?.language ?? 'en'}
        useAffinity={profile?.use_affinity_scoring ?? false}
      />

      <InstallButtonInline />

      <nav className="flex flex-col items-start gap-3 border-t border-border-muted pt-5">
        <Link href="/appearance" className="btn-secondary w-full">
          {t('Settings.changeSkin')}
        </Link>
        <Link href="/friends" className="btn-secondary w-full">
          {t('Home.friends')}
        </Link>
        {profile?.role === 'admin' && (
          <Link href="/admin" className="btn-secondary w-full">
            {t('Home.admin')}
          </Link>
        )}
        <form action={logout} className="w-full">
          <button type="submit" className="btn-secondary w-full">
            {t('Auth.logout')}
          </button>
        </form>
      </nav>
    </main>
  );
}
