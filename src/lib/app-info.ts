import 'server-only';
import { headers } from 'next/headers';
import pkg from '../../package.json';

// Datos de despliegue que se muestran en el panel de administración. Sirven
// para saber de un vistazo qué versión está viva y dónde corre cada pieza
// (útil, por ejemplo, al diagnosticar latencia entre app y base de datos).

// Región del proyecto de Supabase. No hay forma de consultarla desde el
// cliente, así que se declara aquí y se puede sobrescribir por entorno.
const DEFAULT_DB_REGION = 'eu-west-1 (Dublín)';

// Nombres legibles de las regiones de Vercel que usamos.
const VERCEL_REGIONS: Record<string, string> = {
  dub1: 'dub1 (Dublín)',
  iad1: 'iad1 (Washington)',
  fra1: 'fra1 (Fráncfort)',
  arn1: 'arn1 (Estocolmo)',
  cdg1: 'cdg1 (París)',
};

export type AppInfo = {
  version: string;
  serverRegion: string;
  dbRegion: string;
  domain: string;
  ip: string;
};

// IP pública de salida de la función (la que ven las APIs externas y Supabase).
// Best-effort: si el servicio no responde a tiempo, se muestra un guion.
async function publicIp(): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2000);
  try {
    const res = await fetch('https://api.ipify.org?format=json', {
      signal: ctrl.signal,
      cache: 'no-store',
    });
    if (!res.ok) return '—';
    const data = (await res.json()) as { ip?: string };
    return data.ip ?? '—';
  } catch {
    return '—';
  } finally {
    clearTimeout(timer);
  }
}

export async function getAppInfo(): Promise<AppInfo> {
  const h = await headers();
  const region = process.env.VERCEL_REGION;

  return {
    version: pkg.version,
    serverRegion: region
      ? (VERCEL_REGIONS[region] ?? region)
      : 'local (sin desplegar)',
    dbRegion: process.env.SUPABASE_REGION ?? DEFAULT_DB_REGION,
    domain: h.get('host') ?? '—',
    ip: await publicIp(),
  };
}
