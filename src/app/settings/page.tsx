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

      <nav className="flex flex-col gap-2 border-t border-white/10 pt-5">
        <Link href="/friends" className="text-sm text-neon-green hover:underline">
          {t('Home.friends')}
        </Link>
        {profile?.role === 'admin' && (
          <Link href="/admin" className="text-sm text-neon-green hover:underline">
            {t('Home.admin')}
          </Link>
        )}
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            {t('Auth.logout')}
          </button>
        </form>
      </nav>
    </main>
  );
}
