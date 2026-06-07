import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Cliente con service-role: SOLO para uso en el servidor (Server Actions / Route
// Handlers). Bypassa RLS, por lo que permite leer datos que el cliente no puede
// ver (p.ej. users.email) para enviar notificaciones. Nunca lo importes desde
// componentes cliente ni expongas SUPABASE_SERVICE_ROLE_KEY al navegador.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY para el cliente admin.',
    );
  }
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
