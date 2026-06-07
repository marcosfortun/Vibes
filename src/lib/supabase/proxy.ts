import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Refresca la sesión de Supabase en cada request (Next 16: proxy, runtime nodejs).
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Importante: no metas lógica entre createServerClient y getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Route handlers de auth (callback de recuperación): siempre pasan.
  if (path.startsWith('/auth/')) {
    return response;
  }

  // La landing de invitación es accesible con o sin sesión: los no autenticados
  // ven "iniciar sesión o crear cuenta"; los autenticados ven "aceptar".
  if (path.startsWith('/invite/')) {
    return response;
  }

  const publicRoutes = ['/login', '/signup', '/forgot'];
  const isPublic = publicRoutes.includes(path);

  // No autenticado fuera de las rutas públicas -> a login.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Autenticado en una ruta pública -> a la home.
  if (user && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}
