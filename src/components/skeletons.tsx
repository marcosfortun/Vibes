'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, ChevronRight, Palette, Users } from 'lucide-react';

// Skeletons de los loading.tsx. Dos ideas:
//
//  1. Los bloques imitan la forma real de cada elemento (fila de recomendación,
//     fila de lista, campo…) usando las clases de la skin, para que la
//     transición al contenido real no dé un salto visual.
//  2. Todo lo que es ESTÁTICO se pinta ya de verdad (títulos, pestañas,
//     opciones de menú que siempre existen). Solo se deja en gris lo que
//     depende de los datos del usuario. Da mucha más sensación de velocidad.
//
// Son componentes de cliente a propósito: en las navegaciones del dock las
// traducciones ya están en el navegador (NextIntlClientProvider vive en el
// layout, por encima del Suspense), así que el texto aparece al instante sin
// esperar a que el servidor resuelva el idioma.

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
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

// Fila de lista con icono y texto reales (opciones fijas de un menú).
function StaticListRow({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
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

// Fila de lista cuyo contenido depende de datos (aún desconocido).
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

// Anchos variados para que la lista no parezca un patrón repetido.
const ROW_WIDTHS = ['w-2/3', 'w-1/2', 'w-3/5', 'w-2/5', 'w-3/4', 'w-1/2'];

// ── Home: pestañas reales + lista en carga ──────────────────────────────────
export function HomeSkeleton() {
  const t = useTranslations('Home');
  return (
    <div className="w-full">
      {/* Pestañas: texto definitivo. No se marca ninguna activa porque cuál lo
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

// ── Alta: título, enlace a carga masiva y campo de categoría, todo real ─────
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
        <SkeletonBlock className="h-11 w-full rounded-xl" />
      </label>
    </main>
  );
}

// ── Amigos: cabecera real + enlace de invitación y lista en carga ───────────
export function FriendsSkeleton() {
  const t = useTranslations('Friends');
  return (
    <main className="mx-auto -mb-28 flex h-[100dvh] w-full max-w-md flex-col gap-4 overflow-hidden px-6 pt-6">
      <header className="page-header shrink-0">
        <span className="back-button" aria-hidden>
          <ArrowLeft size={18} strokeWidth={2} />
        </span>
        <h1 className="page-title">{t('title')}</h1>
      </header>
      <SkeletonBlock className="h-20 w-full shrink-0 rounded-xl" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}

// ── Ajustes: título y opciones fijas reales; el perfil, en carga ────────────
export function SettingsSkeleton() {
  const t = useTranslations();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{t('Settings.title')}</h1>
        {/* El nombre de usuario sí depende de los datos. */}
        <SkeletonBlock className="h-4 w-28" />
      </header>

      {/* Selector de idioma y preferencias del usuario. */}
      <div className="flex flex-col gap-3">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-11 w-full rounded-xl" />
      </div>

      <nav className="flex flex-col gap-3 border-t border-border-muted pt-5">
        <StaticListRow
          icon={
            <Palette size={20} strokeWidth={1.75} className="shrink-0 text-neon-pink" />
          }
          label={t('Settings.changeSkin')}
        />
        <StaticListRow
          icon={
            <Users size={20} strokeWidth={1.75} className="shrink-0 text-neon-pink" />
          }
          label={t('Home.friends')}
        />
      </nav>
    </main>
  );
}
