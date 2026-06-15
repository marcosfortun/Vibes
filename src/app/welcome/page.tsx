import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WelcomeOnboarding } from '@/components/welcome-onboarding';
import { BrandLogo } from '@/components/brand-logo';

// Paso final del alta (tras verificar el correo): elección de skin. Requiere
// sesión; el middleware ya bloquea el acceso sin autenticar.
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = typeof next === 'string' && next.startsWith('/') ? next : '/';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8">
      <BrandLogo className="h-auto w-full max-w-[220px]" />
      <WelcomeOnboarding next={nextPath} />
    </main>
  );
}
