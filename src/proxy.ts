import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

// Next 16: el antiguo middleware.ts se llama ahora proxy.ts (runtime nodejs).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Excluir assets estáticos y de PWA (manifest, service worker, iconos).
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)',
  ],
};
