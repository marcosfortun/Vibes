import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Palette, Users, Shield, LogOut, ChevronRight } from 'lucide-react';
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

      <nav className="flex flex-col gap-3 border-t border-border-muted pt-5">
        <Link
          href="/appearance"
          className="list-row text-foreground transition-colors hover:bg-[var(--glass-bg)]"
        >
          <span className="flex min-w-0 items-center gap-3">
            <Palette size={20} strokeWidth={1.75} className="shrink-0 text-neon-pink" />
            <span className="truncate">{t('Settings.changeSkin')}</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-muted" />
        </Link>

        <Link
          href="/friends"
          className="list-row text-foreground transition-colors hover:bg-[var(--glass-bg)]"
        >
          <span className="flex min-w-0 items-center gap-3">
            <Users size={20} strokeWidth={1.75} className="shrink-0 text-neon-pink" />
            <span className="truncate">{t('Home.friends')}</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-muted" />
        </Link>

        {profile?.role === 'admin' && (
          <Link
            href="/admin"
            className="list-row text-foreground transition-colors hover:bg-[var(--glass-bg)]"
          >
            <span className="flex min-w-0 items-center gap-3">
              <Shield size={20} strokeWidth={1.75} className="shrink-0 text-neon-pink" />
              <span className="truncate">{t('Home.admin')}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-muted" />
          </Link>
        )}

        <form action={logout} className="w-full">
          <button
            type="submit"
            className="list-row w-full text-foreground transition-colors hover:bg-[var(--glass-bg)]"
          >
            <span className="flex min-w-0 items-center gap-3">
              <LogOut size={20} strokeWidth={1.75} className="shrink-0 text-neon-pink" />
              <span className="truncate">{t('Auth.logout')}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-muted" />
          </button>
        </form>
      </nav>
    </main>
  );
}
