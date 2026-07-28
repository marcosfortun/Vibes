import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import HomeLoading from '@/app/loading';
import NewLoading from '@/app/new/loading';
import FriendsLoading from '@/app/friends/loading';
import SettingsLoading from '@/app/settings/loading';

// Los loading.tsx se ven durante el render del servidor, así que en local
// apenas se perciben: estos tests fijan su forma para que no se rompan sin
// que nadie se entere.
describe('skeletons de carga', () => {
  it('la home imita las tres pestañas y una lista de filas', () => {
    const { container } = render(<HomeLoading />);
    // Una fila de recomendación = contenedor con el borde de tarjeta.
    expect(container.querySelectorAll('.neon-border').length).toBeGreaterThanOrEqual(4);
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(10);
  });

  it('el alta imita título, enlace y campo de categoría', () => {
    const { container } = render(<NewLoading />);
    expect(container.querySelectorAll('.skeleton')).toHaveLength(4);
  });

  it('amigos imita cabecera con volver, invitación y lista', () => {
    const { container } = render(<FriendsLoading />);
    expect(container.querySelector('.page-header')).not.toBeNull();
    expect(container.querySelectorAll('.list-row')).toHaveLength(4);
  });

  it('ajustes imita título, usuario y botonera', () => {
    const { container } = render(<SettingsLoading />);
    expect(container.querySelectorAll('.list-row')).toHaveLength(4);
  });

  it('los skeletons son decorativos (no los anuncia el lector de pantalla)', () => {
    const { container } = render(<HomeLoading />);
    for (const el of container.querySelectorAll('.skeleton')) {
      expect(el.getAttribute('aria-hidden')).toBe('true');
    }
  });
});
