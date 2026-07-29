import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomeLoading from '@/app/loading';
import NewLoading from '@/app/new/loading';
import BulkLoading from '@/app/new/bulk/loading';
import FriendsLoading from '@/app/friends/loading';
import SettingsLoading from '@/app/settings/loading';
import AppearanceLoading from '@/app/appearance/loading';
import AdminLoading from '@/app/admin/loading';
import AdminCategoriesLoading from '@/app/admin/categories/loading';
import NewCategoryLoading from '@/app/admin/categories/new/loading';
import { SKINS } from '@/lib/skins';

// El botón de instalar depende del navegador; en los tests damos un contexto
// controlado (no instalable) para poder renderizar el skeleton de ajustes.
vi.mock('@/components/install-prompt-provider', () => ({
  useInstallPrompt: () => ({ canInstall: false, isInstalled: false, install: vi.fn() }),
}));

// Los loading.tsx se ven durante el render del servidor, así que en local
// apenas se perciben: estos tests fijan su forma y su texto.
//
// El mock de next-intl (vitest.setup.ts) devuelve la última parte de la clave,
// así que aquí se comprueba QUÉ clave se pinta, no el literal traducido.
describe('skeletons de carga', () => {
  it('home: las tres pestañas reales y filas en carga', () => {
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

  it('alta: título, enlace a carga masiva y campo de categoría con su hueco', () => {
    const { container } = render(<NewLoading />);
    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
    expect(screen.getByText('bulk')).toBeInTheDocument();
    expect(screen.getByText('category')).toBeInTheDocument();
    // El campo se pinta vacío pero con el estilo real, para no dar el salto.
    expect(container.querySelector('.field')).not.toBeNull();
  });

  it('carga masiva: título, enlace al alta simple, intro y campo', () => {
    const { container } = render(<BulkLoading />);
    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
    expect(screen.getByText('single')).toBeInTheDocument();
    expect(screen.getByText('intro')).toBeInTheDocument();
    expect(container.querySelector('.field')).not.toBeNull();
  });

  it('amigos: cabecera con volver y título reales', () => {
    const { container } = render(<FriendsLoading />);
    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
    expect(container.querySelector('.back-button')).not.toBeNull();
    expect(container.querySelectorAll('.list-row')).toHaveLength(4);
  });

  it('ajustes: idioma, afinidad, instalar y opciones fijas; sin admin', () => {
    const { container } = render(<SettingsLoading />);
    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
    // Preferencias con sus etiquetas y su ayuda.
    expect(screen.getByText('language')).toBeInTheDocument();
    expect(screen.getByText('affinityScoring')).toBeInTheDocument();
    expect(screen.getByText('affinityHint')).toBeInTheDocument();
    // Botón de instalar real (aquí, estado "no se puede instalar").
    expect(screen.getByRole('button', { name: 'unavailable' })).toBeDisabled();
    // Menú: apariencia, amigos y cerrar sesión; el acceso admin NO se pinta.
    expect(screen.getByText('changeSkin')).toBeInTheDocument();
    expect(screen.getByText('friends')).toBeInTheDocument();
    expect(screen.getByText('logout')).toBeInTheDocument();
    expect(screen.queryByText('admin')).not.toBeInTheDocument();
    // Hueco reservado para el nombre de usuario.
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('apariencia: catálogo de skins con sus nombres (solo falta cuál está activa)', () => {
    render(<AppearanceLoading />);
    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
    for (const skin of SKINS) {
      expect(screen.getByText(skin.name)).toBeInTheDocument();
    }
  });

  it('admin: cabecera y acceso a categorías', () => {
    render(<AdminLoading />);
    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
    expect(screen.getByText('categories')).toBeInTheDocument();
  });

  it('categorías: cabecera con botón de crear y filas en carga', () => {
    const { container } = render(<AdminCategoriesLoading />);
    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
    // Cabecera con volver + botón "+".
    expect(container.querySelectorAll('.back-button')).toHaveLength(2);
    expect(container.querySelectorAll('.list-row')).toHaveLength(6);
  });

  it('nueva categoría: campos vacíos con su estilo y botón de crear', () => {
    const { container } = render(<NewCategoryLoading />);
    expect(screen.getByRole('heading', { name: 'newTitle' })).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('icon')).toBeInTheDocument();
    expect(screen.getByText('create')).toBeInTheDocument();
    expect(container.querySelectorAll('.field')).toHaveLength(2);
  });

  it('los bloques en carga son decorativos para el lector de pantalla', () => {
    const { container } = render(<HomeLoading />);
    for (const el of container.querySelectorAll('.skeleton')) {
      expect(el.getAttribute('aria-hidden')).toBe('true');
    }
  });
});
