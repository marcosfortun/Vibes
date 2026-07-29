import { describe, it, expect, vi, afterEach } from 'vitest';

const headerMap = new Map<string, string>([['host', 'vibes.oneman.es']]);
vi.mock('next/headers', () => ({
  headers: async () => ({ get: (k: string) => headerMap.get(k) ?? null }),
}));

import { getAppInfo } from './app-info';
import pkg from '../../package.json';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function mockIp(ip: string | null) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      ip
        ? { ok: true, json: async () => ({ ip }) }
        : { ok: false, json: async () => ({}) },
    ),
  );
}

describe('getAppInfo (panel de administración)', () => {
  it('informa versión, regiones, dominio e IP', async () => {
    vi.stubEnv('VERCEL_REGION', 'dub1');
    mockIp('76.76.21.21');

    const info = await getAppInfo();

    expect(info.version).toBe(pkg.version);
    expect(info.serverRegion).toContain('dub1');
    expect(info.dbRegion).toContain('eu-west-1');
    expect(info.domain).toBe('vibes.oneman.es');
    expect(info.ip).toBe('76.76.21.21');
  });

  it('sin VERCEL_REGION indica que no está desplegado', async () => {
    mockIp('127.0.0.1');
    const info = await getAppInfo();
    expect(info.serverRegion).toContain('local');
  });

  it('la región de BD se puede sobrescribir por entorno', async () => {
    vi.stubEnv('SUPABASE_REGION', 'us-east-1 (Virginia)');
    mockIp('1.2.3.4');
    expect((await getAppInfo()).dbRegion).toBe('us-east-1 (Virginia)');
  });

  it('si el servicio de IP falla, no rompe la pantalla', async () => {
    mockIp(null);
    expect((await getAppInfo()).ip).toBe('—');
  });
});
