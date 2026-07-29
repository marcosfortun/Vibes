import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsForm } from './settings-form';

vi.mock('@/lib/actions/preferences', () => ({ updatePreferences: vi.fn() }));

// El scoring por afinidad queda reservado a admin mientras se termina de
// afinar: al resto ni se le ofrece el control (y la server action lo ignora
// aunque llegue en una petición manipulada, ver preferences.ts).
describe('SettingsForm (visibilidad del scoring por afinidad)', () => {
  it('un usuario normal no ve la opción', () => {
    render(<SettingsForm language="es" useAffinity={false} />);
    expect(screen.getByText('language')).toBeInTheDocument();
    expect(screen.queryByText('affinityScoring')).not.toBeInTheDocument();
    expect(document.querySelector('input[name="use_affinity_scoring"]')).toBeNull();
  });

  it('un admin sí la ve', () => {
    render(<SettingsForm language="es" useAffinity={true} showAffinity />);
    expect(screen.getByText('affinityScoring')).toBeInTheDocument();
    const checkbox = document.querySelector(
      'input[name="use_affinity_scoring"]',
    ) as HTMLInputElement | null;
    expect(checkbox).not.toBeNull();
    expect(checkbox!.defaultChecked).toBe(true);
  });
});
