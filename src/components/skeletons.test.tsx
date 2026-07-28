import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomeLoading from '@/app/loading';
import NewLoading from '@/app/new/loading';
import FriendsLoading from '@/app/friends/loading';
import SettingsLoading from '@/app/settings/loading';

// Los loading.tsx se ven durante el render del servidor, así que en local
// apenas se perciben: estos tests fijan su forma y su texto para que no se
// rompan sin que nadie se entere.
//
// El mock de next-intl (vitest.setup.ts) devuelve la última parte de la clave,
// así que aquí se comprueba QUÉ clave se pinta, no el literal traducido.
describe('skeletons de carga', () => {
  it('la home pinta las tres pestañas reales y filas en carga', () => {
    const { container } = render(<HomeLoading />);
    for (const tab of ['myList', 'friends', 'trending']) {
      expect(screen.getByText(tab)).toBeInTheDocument();
    }
    expect(container.querySelector('[role="tablist"]')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(container.querySelectorAll('.neon-border').length).toBeGreaterThanOrEqual(4);
  });

  it('el alta pinta título, enlace a carga masiva y etiqueta de categoría', () => {
    render(<NewLoading />);
    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
    expect(screen.getByText('bulk')).toBeInTheDocument();
    expect(screen.getByText('category')).toBeInTheDocument();
  });

  it('amigos pinta cabecera con volver y título reales', () => {
    const { container } = render(<FriendsLoading />);
    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
    expect(container.querySelector('.back-button')).not.toBeNull();
    expect(container.querySelectorAll('.list-row')).toHaveLength(4);
  });

  it('ajustes pinta título y las opciones fijas del menú', () => {
    render(<SettingsLoading />);
    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
    // Opciones que existen para cualquier usuario (el acceso admin no se pinta:
    // aparecería y desaparecería según el rol).
    expect(screen.getByText('changeSkin')).toBeInTheDocument();
    expect(screen.getByText('friends')).toBeInTheDocument();
    expect(screen.queryByText('admin')).not.toBeInTheDocument();
  });

  it('los bloques en carga son decorativos para el lector de pantalla', () => {
    const { container } = render(<HomeLoading />);
    for (const el of container.querySelectorAll('.skeleton')) {
      expect(el.getAttribute('aria-hidden')).toBe('true');
    }
  });
});
