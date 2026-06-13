'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  Check,
  Heart,
  Minus,
  Plus,
  ThumbsDown,
  ThumbsUp,
  X,
  type LucideIcon,
} from 'lucide-react';
import { setSaved, setRating } from '@/lib/actions/interactions';
import { CategoryIcon } from '@/components/category-icon';

export type InteractionState = {
  saved: boolean;
  rating: number | null;
} | null;

export type CardItem = {
  id: string;
  title: string;
  description: string | null;
  url?: string | null;
  global_score: number;
  // Score a mostrar: personalizado (afinidad) o global. Por defecto, global_score.
  score?: number;
  category: { name: string; color: string | null; icon: string | null } | null;
  tags?: string[];
  state?: InteractionState;
};

const RATINGS: { value: number; Icon: LucideIcon; key: 'dislike' | 'like' | 'love' }[] = [
  { value: -1, Icon: ThumbsDown, key: 'dislike' },
  { value: 1, Icon: ThumbsUp, key: 'like' },
  { value: 2, Icon: Heart, key: 'love' },
];

export function RecommendationCard({
  item,
  showScore = false,
}: {
  item: CardItem;
  showScore?: boolean;
}) {
  const t = useTranslations('Card');
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const capsuleRef = useRef<HTMLDivElement>(null);

  const tags = item.tags ?? [];
  const visibleTags = tags.slice(0, 2);
  const hasMoreTags = tags.length > 2;

  const state = item.state ?? null;
  const isSaved = !!state?.saved;
  const currentRating = state?.rating ?? null;
  const ratingEntry =
    currentRating !== null
      ? RATINGS.find((r) => r.value === currentRating)
      : undefined;

  // El selector solo se muestra si está expandido y aún no hay calificación.
  // Al llegar un rating (incluso tras revalidación) la cápsula se colapsa sola,
  // derivado en render: no hace falta un efecto que sincronice `expanded`.
  const showPicker = expanded && !ratingEntry;

  // Cerrar el desplegable al clicar fuera (sin guardar cambios).
  useEffect(() => {
    if (!showPicker) return;
    function onDocPointerDown(e: PointerEvent) {
      if (
        capsuleRef.current &&
        !capsuleRef.current.contains(e.target as Node)
      ) {
        setExpanded(false);
      }
    }
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [showPicker]);

  // Estilo común del botón circular: borde + opacity sincronizados.
  const capsuleOn = showPicker || ratingEntry;
  const isLove = ratingEntry?.key === 'love';

  return (
    <div className="neon-border neon-border-glow flex h-[154px] flex-col p-4">
      {/* Cabecera: icono + título + subtítulo */}
      <div className="flex flex-1 items-start gap-3 overflow-hidden">
        <CategoryIcon
          name={item.category?.icon}
          className="mt-0.5 shrink-0 text-neon-pink"
          size={26}
        />
        <div className="min-w-0 flex-1">
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-lg font-bold text-foreground hover:underline"
            >
              {item.title}
            </a>
          ) : (
            <h3 className="truncate text-lg font-bold text-foreground">
              {item.title}
            </h3>
          )}
          {item.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted">
              {item.description}
            </p>
          )}
        </div>
        {showScore && (
          <span className="shrink-0 text-sm tabular-nums text-muted">
            {item.score ?? item.global_score}
          </span>
        )}
      </div>

      {/* Fila de interacción */}
      <div className="mt-3 flex shrink-0 items-center justify-between gap-2">
        {/* Cápsula de rating (transparente; border y opacidad sincronizados) */}
        <div
          ref={capsuleRef}
          className={`flex items-center justify-evenly rounded-full border border-foreground transition-[width,opacity] duration-150 ${
            isLove ? 'text-neon-pink' : 'text-foreground'
          } ${capsuleOn ? 'opacity-70' : 'opacity-20'}`}
          style={{ width: showPicker ? 118 : 36, height: 36 }}
        >
          {!showPicker ? (
            <button
              type="button"
              disabled={pending}
              aria-label={ratingEntry ? t(`rate.${ratingEntry.key}`) : t('rate.add')}
              onClick={() => {
                if (ratingEntry) {
                  // Eliminar la calificación (no toca saved).
                  startTransition(() => setRating(item.id, null));
                } else {
                  setExpanded(true);
                }
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full"
            >
              {ratingEntry ? (
                <ratingEntry.Icon
                  size={16}
                  strokeWidth={2}
                  fill={isLove ? 'currentColor' : 'none'}
                />
              ) : (
                <Check size={16} strokeWidth={2} />
              )}
            </button>
          ) : (
            RATINGS.map(({ value, Icon, key }) => (
              <button
                key={value}
                type="button"
                disabled={pending}
                aria-label={t(`rate.${key}`)}
                onClick={() => {
                  setExpanded(false);
                  startTransition(() => setRating(item.id, value));
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-foreground/10"
              >
                <Icon size={16} strokeWidth={2} />
              </button>
            ))
          )}
        </div>

        {/* Tags (solo lectura): hasta 2 chips + chip "…" si hay más. */}
        {tags.length > 0 && (
          <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 overflow-hidden px-1">
            {visibleTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTagsOpen(true)}
                className="max-w-[5.5rem] truncate rounded-full border border-border-muted bg-[var(--field-bg)] px-2 py-0.5 text-[11px] text-muted transition-colors hover:text-foreground"
              >
                {tag}
              </button>
            ))}
            {hasMoreTags && (
              <button
                type="button"
                aria-label={t('allTags')}
                onClick={() => setTagsOpen(true)}
                className="shrink-0 rounded-full border border-border-muted bg-[var(--field-bg)] px-2 py-0.5 text-[11px] text-muted transition-colors hover:text-foreground"
              >
                …
              </button>
            )}
          </div>
        )}

        {/* Guardar / quitar de Mi Lista */}
        <button
          type="button"
          disabled={pending}
          aria-label={isSaved ? t('remove') : t('save')}
          onClick={() => startTransition(() => setSaved(item.id, !isSaved))}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-current text-foreground opacity-70 transition-opacity disabled:opacity-50"
        >
          {isSaved ? <Minus size={18} /> : <Plus size={18} />}
        </button>
      </div>

      {/* Popup con todos los tags */}
      {tagsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
        >
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setTagsOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="glass relative z-10 flex w-full max-w-sm flex-col gap-3 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-foreground">
                {t('allTags')}
              </h2>
              <button
                type="button"
                onClick={() => setTagsOpen(false)}
                aria-label={t('close')}
                className="text-muted transition-colors hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border-muted bg-[var(--field-bg)] px-2.5 py-1 text-sm text-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
