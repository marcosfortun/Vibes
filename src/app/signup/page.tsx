import { createClient } from '@/lib/supabase/server';
import { SignupForm } from './signup-form';

export default async function SignupPage(props: PageProps<'/signup'>) {
  const { invite_token } = await props.searchParams;
  const inviteToken = typeof invite_token === 'string' ? invite_token : '';

  // Validamos el token en carga para informar antes de que el usuario rellene nada.
  let tokenValid = false;
  if (inviteToken) {
    const supabase = await createClient();
    const { data } = await supabase.rpc('invite_token_valid', {
      t: inviteToken,
    });
    tokenValid = Boolean(data);
  }

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <SignupForm inviteToken={inviteToken} tokenValid={tokenValid} />
    </main>
  );
}
