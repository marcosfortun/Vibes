// Forma común de los errores de Supabase, deliberadamente laxa para aceptar
// tanto PostgrestError (RPC/consultas: message/details/hint/code) como AuthError
// (GoTrue: name/status/code/message) sin pelearnos con sus tipos nominales.
type SupabaseLikeError = {
  message?: string;
  code?: string | number;
  details?: string;
  hint?: string;
  status?: number;
  name?: string;
};

// Loggea de forma uniforme los errores de Supabase en la consola del servidor
// (visibles en los logs de funciones de Vercel). No-op si no hay error, para
// poder envolver cualquier llamada sin condicionales extra en el call site.
//
// Cobertura por capa:
// - RPC / PostgREST: el mensaje del `raise exception` de un trigger o función
//   SECURITY DEFINER SÍ llega en `error.message`; aquí se captura íntegro.
// - Auth (GoTrue, p. ej. el trigger handle_new_user): el error llega genérico
//   (unexpected_failure); el detalle real vive en los Postgres logs de Supabase.
export function logSupabaseError(
  context: string,
  error: SupabaseLikeError | null | undefined,
): void {
  if (!error) return;
  console.error(`[supabase] ${context}:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    status: error.status,
    name: error.name,
  });
}
