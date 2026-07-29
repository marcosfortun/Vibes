'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, ChevronRight, LogOut, Palette, Plus, Tags, Users } from 'lucide-react';
import { InstallButtonInline } from '@/components/install-button';
import { SKINS } from '@/lib/skins';

// Skeletons de los loading.tsx. Tres reglas:
//
//  1. Lo ESTÁTICO se pinta ya definitivo y traducido (títulos, pestañas,
//     etiquetas, opciones de menú que siempre existen, textos de ayuda).
//  2. Lo DINÁMICO se pinta vacío pero con el mismo estilo, tamaño y posición
//     que tendrá (campos, filas, controles), para que al llegar los datos la
//     interfaz no dé un salto.
//  3. Nada que dependa de permisos o de estado del usuario aparece si luego
//     podría desaparecer (p. ej. el acceso de admin en ajustes).
//
// Son componentes de cliente: en las navegaciones del dock las traducciones y
// el contexto de instalación ya están en el navegador (sus proveedores viven en
// el layout, por encima del Suspense), así que el texto sale al instante.

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

// Campo de formulario vacío con el aspecto real del control.
function EmptyField({
  placeholder,
  className = '',
}: {
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`field flex items-center text-muted opacity-60 ${className}`}
    >
      {placeholder ?? ''}
    </div>
  );
}

// Cabecera de página con botón de volver y título reales.
function PageHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <header className="page-header shrink-0">
      <span className="back-button" aria-hidden>
        <ArrowLeft size={18} strokeWidth={2} />
      </span>
      <h1 className="page-title">{title}</h1>
      {action}
    </header>
  );
}

// Fila de menú con icono y texto reales (opciones fijas).
function StaticListRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="list-row text-foreground">
      <span className="flex min-w-0 items-center gap-3">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-muted" />
    </div>
  );
}

// Fila cuyo contenido depende de datos.
export function ListRowSkeleton() {
  return (
    <div className="list-row">
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <SkeletonBlock className="h-5 w-5 shrink-0 rounded-full" />
        <SkeletonBlock className="h-4 w-1/2" />
      </span>
      <SkeletonBlock className="h-4 w-4 shrink-0" />
    </div>
  );
}

// Fila compacta de recomendación: icono + título + dos acciones circulares.
export function RecommendationRowSkeleton({ width = 'w-2/3' }: { width?: string }) {
  return (
    <div className="neon-border flex items-center gap-2.5 px-3 py-2">
      <SkeletonBlock className="h-5 w-5 shrink-0 rounded-full" />
      <SkeletonBlock className={`h-4 ${width}`} />
      <div className="ml-auto flex items-center gap-2.5">
        <SkeletonBlock className="h-8 w-8 shrink-0 rounded-full" />
        <SkeletonBlock className="h-8 w-8 shrink-0 rounded-full" />
      </div>
    </div>
  );
}

// Anchos variados para que la lista no parezca un patrón repetido.
const ROW_WIDTHS = ['w-2/3', 'w-1/2', 'w-3/5', 'w-2/5', 'w-3/4', 'w-1/2'];

// ── Home ────────────────────────────────────────────────────────────────────
export function HomeSkeleton() {
  const t = useTranslations('Home');
  return (
    <div className="w-full">
      {/* Pestañas con su texto definitivo. Ninguna se marca activa: cuál lo
          está depende de los datos que todavía están cargando. */}
      <div className="sticky top-0 z-30 w-full">
        <div className="bg-[var(--background)] pt-3">
          <div className="mx-auto flex max-w-2xl px-4" role="tablist" aria-busy="true">
            {(['myList', 'friends', 'trending'] as const).map((key) => (
              <div
                key={key}
                className="relative flex-1 px-2 pb-4 pt-1 text-center text-sm font-medium text-muted"
              >
                {t(`tabs.${key}`)}
              </div>
            ))}
          </div>
        </div>
        <div
          aria-hidden
          className="pointer-events-none h-6 w-full"
          style={{
            background:
              'linear-gradient(to bottom, var(--background) 0%, rgba(13,13,17,0) 100%)',
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-2xl px-5">
        <ul className="flex flex-col gap-2 pb-5 pt-1">
          {ROW_WIDTHS.map((w, i) => (
            <li key={i}>
              <RecommendationRowSkeleton width={w} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Alta de recomendación ───────────────────────────────────────────────────
export function NewSkeleton() {
  const t = useTranslations('New');
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <span className="text-sm text-neon-pink">{t('bulk')}</span>
      </div>
      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('fields.category')}
        <EmptyField placeholder={t('categoryPlaceholder')} />
      </label>
    </main>
  );
}

// ── Carga masiva ────────────────────────────────────────────────────────────
export function BulkSkeleton() {
  const t = useTranslations('Bulk');
  const tNew = useTranslations('New');
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <span className="text-sm text-neon-pink">{t('single')}</span>
      </div>
      <div className="flex w-full flex-col gap-4">
        <p className="text-sm text-muted">{t('intro')}</p>
        <label className="flex flex-col gap-1 text-sm text-muted">
          {tNew('fields.category')}
          <EmptyField placeholder={tNew('categoryPlaceholder')} />
        </label>
      </div>
    </main>
  );
}

// ── Amigos ──────────────────────────────────────────────────────────────────
export function FriendsSkeleton() {
  const t = useTranslations('Friends');
  return (
    <main className="mx-auto -mb-28 flex h-[100dvh] w-full max-w-md flex-col gap-4 overflow-hidden px-6 pt-6">
      <PageHeader title={t('title')} />
      <SkeletonBlock className="h-20 w-full shrink-0 rounded-xl" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}

// ── Ajustes / perfil ────────────────────────────────────────────────────────
export function SettingsSkeleton() {
  const t = useTranslations();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">{t('Settings.title')}</h1>
        {/* El nombre de usuario depende de los datos: hueco del mismo alto. */}
        <SkeletonBlock className="mt-1 h-4 w-24" />
      </header>

      {/* Preferencias: etiquetas y ayudas son fijas; los controles, vacíos. */}
      <div className="flex w-full max-w-md flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm text-muted">
          {t('Settings.language')}
          <EmptyField />
        </label>
        <div className="flex items-start gap-3 text-sm">
          <span
            aria-hidden
            className="mt-0.5 h-5 w-5 shrink-0 rounded-md border border-border-muted opacity-60"
          />
          <span>
            {t('Settings.affinityScoring')}
            <span className="block text-xs text-muted">
              {t('Settings.affinityHint')}
            </span>
          </span>
        </div>
      </div>

      {/* El botón de instalar no depende del servidor: se pinta el real. */}
      <InstallButtonInline />

      <nav className="flex flex-col gap-3 border-t border-border-muted pt-5">
        <StaticListRow
          icon={
            <Palette size={20} strokeWidth={1.75} className="shrink-0 text-neon-pink" />
          }
          label={t('Settings.changeSkin')}
        />
        <StaticListRow
          icon={<Users size={20} strokeWidth={1.75} className="shrink-0 text-neon-pink" />}
          label={t('Home.friends')}
        />
        {/* El acceso de admin no se pinta: aparecería solo para algunos. */}
        <StaticListRow
          icon={
            <LogOut size={20} strokeWidth={1.75} className="shrink-0 text-neon-pink" />
          }
          label={t('Auth.logout')}
        />
      </nav>
    </main>
  );
}

// ── Apariencia (selector de skins) ──────────────────────────────────────────
export function AppearanceSkeleton() {
  const t = useTranslations('Settings');
  return (
    <main className="mx-auto -mb-28 flex h-[100dvh] w-full max-w-md flex-col gap-4 overflow-hidden px-6 pt-6">
      <PageHeader title={t('skins.title')} />
      {/* El catálogo de skins es estático: se pintan sus tarjetas ya con
          nombre, estilo y assets. Lo único que falta es cuál está activa. */}
      <section className="flex min-h-0 w-full flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-28 pr-1">
          {SKINS.map((skin) => (
            <div
              key={skin.style}
              data-skin={skin.style}
              style={{
                background: 'var(--background)',
                color: 'var(--foreground)',
                fontFamily: 'var(--app-font)',
                borderColor: 'var(--border-muted)',
                borderWidth: 1,
              }}
              className="flex items-center justify-between gap-3 rounded-2xl border p-3 text-left"
            >
              <span className="flex min-w-0 flex-col gap-2">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-bold">{skin.name}</span>
                  <span className="truncate text-xs text-muted">{skin.style}</span>
                </span>
                <span className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={skin.icon}
                    alt=""
                    aria-hidden
                    className="h-9 w-9 shrink-0 rounded-lg object-cover"
                  />
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

// ── Admin: menú + información del despliegue ────────────────────────────────
export function AdminSkeleton() {
  const t = useTranslations('Admin');
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <PageHeader title={t('title')} />
      <nav className="flex flex-col gap-3">
        <StaticListRow
          icon={<Tags size={20} strokeWidth={1.75} className="shrink-0 text-neon-pink" />}
          label={t('menu.categories')}
        />
      </nav>
      {/* Información de la app: las etiquetas son fijas; los valores llegan
          del servidor, así que se reserva su hueco. */}
      <section className="flex flex-col gap-3 border-t border-border-muted pt-5">
        <h2 className="text-sm font-semibold text-foreground">{t('info.title')}</h2>
        <dl className="flex flex-col gap-2 text-sm">
          {(['version', 'serverRegion', 'dbRegion', 'domain', 'ip'] as const).map(
            (key) => (
              <div key={key} className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0 text-muted">{t(`info.${key}`)}</dt>
                <dd className="min-w-0 flex-1">
                  <SkeletonBlock className="ml-auto h-3 w-28" />
                </dd>
              </div>
            ),
          )}
        </dl>
      </section>
    </main>
  );
}

// ── Admin: listado de categorías ────────────────────────────────────────────
export function AdminCategoriesSkeleton() {
  const t = useTranslations('Admin.categories');
  return (
    <main className="mx-auto -mb-28 flex h-[100dvh] w-full max-w-md flex-col gap-4 overflow-hidden px-6 pt-6">
      <PageHeader
        title={t('title')}
        action={
          <span className="back-button ml-auto" aria-hidden>
            <Plus size={20} strokeWidth={2} />
          </span>
        }
      />
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="list-row">
            <span className="flex min-w-0 flex-1 items-center gap-3">
              <SkeletonBlock className="h-2.5 w-2.5 shrink-0 rounded-full" />
              <SkeletonBlock className="h-5 w-5 shrink-0 rounded-full" />
              <SkeletonBlock className="h-4 w-2/5" />
            </span>
            <SkeletonBlock className="h-4 w-4 shrink-0" />
          </div>
        ))}
      </div>
    </main>
  );
}

// ── Admin: nueva categoría ──────────────────────────────────────────────────
export function NewCategorySkeleton() {
  const t = useTranslations('Admin.categories');
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <PageHeader title={t('newTitle')} />
      <div className="flex flex-col gap-3">
        <EmptyField placeholder={t('name')} />
        <div className="flex gap-2">
          <EmptyField placeholder={t('icon')} className="flex-1" />
          <span
            aria-hidden
            className="h-[42px] w-14 shrink-0 rounded-xl border border-border-muted opacity-60"
          />
        </div>
        <div className="btn-primary w-full text-center opacity-60">{t('create')}</div>
      </div>
    </main>
  );
}
