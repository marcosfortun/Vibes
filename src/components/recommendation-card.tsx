'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  Check,
  Heart,
  Info,
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

// Cápsula de calificación: colapsada muestra el estado (o "calificar") y
// expandida ofrece las tres opciones. Compartida por la fila compacta y la
// vista ampliada.
function RatingCapsule({
  item,
  size = 'sm',
}: {
  item: CardItem;
  size?: 'sm' | 'md';
}) {
  const t = useTranslations('Card');
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const capsuleRef = useRef<HTMLDivElement>(null);

  const state = item.state ?? null;
  const currentRating = state?.rating ?? null;
  const ratingEntry =
    currentRating !== null
      ? RATINGS.find((r) => r.value === currentRating)
      : undefined;

  const showPicker = expanded && !ratingEntry;

  useEffect(() => {
    if (!showPicker) return;
    function onDocPointerDown(e: PointerEvent) {
      if (capsuleRef.current && !capsuleRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [showPicker]);

  const capsuleOn = showPicker || ratingEntry;
  const isLove = ratingEntry?.key === 'love';
  const dim = size === 'md' ? 40 : 32;
  const pickerWidth = size === 'md' ? 128 : 104;

  return (
    <div
      ref={capsuleRef}
      className={`flex shrink-0 items-center justify-evenly rounded-full border border-foreground transition-[width,opacity] duration-150 ${
        isLove ? 'text-neon-pink' : 'text-foreground'
      } ${capsuleOn ? 'opacity-70' : 'opacity-20'}`}
      style={{ width: showPicker ? pickerWidth : dim, height: dim }}
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
          className="flex h-full w-full items-center justify-center rounded-full"
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
  );
}

// Botón guardar/quitar de Mi Lista, compartido por fila y vista ampliada.
function SaveButton({ item, size = 'sm' }: { item: CardItem; size?: 'sm' | 'md' }) {
  const t = useTranslations('Card');
  const [pending, startTransition] = useTransition();
  const isSaved = !!item.state?.saved;
  const dim = size === 'md' ? 'h-10 w-10' : 'h-8 w-8';

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={isSaved ? t('remove') : t('save')}
      onClick={() => startTransition(() => setSaved(item.id, !isSaved))}
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full border border-current text-foreground opacity-70 transition-opacity disabled:opacity-50`}
    >
      {isSaved ? <Minus size={18} /> : <Plus size={18} />}
    </button>
  );
}

// Fila compacta: icono de categoría, título y acciones (calificar, guardar,
// más info). La descripción, el scoring y las etiquetas viven en la vista
// ampliada (botón "más info").
export function RecommendationCard({
  item,
  showScore = false,
}: {
  item: CardItem;
  showScore?: boolean;
}) {
  const t = useTranslations('Card');
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div className="neon-border flex items-center gap-2.5 px-3 py-2">
      <CategoryIcon
        name={item.category?.icon}
        className="shrink-0 text-neon-pink"
        size={20}
      />
      <button
        type="button"
        onClick={() => setDetailsOpen(true)}
        className="min-w-0 flex-1 truncate text-left text-base font-bold text-foreground"
        title={item.title}
      >
        {item.title}
      </button>

      <RatingCapsule item={item} size="sm" />
      <SaveButton item={item} size="sm" />

      <button
        type="button"
        aria-label={t('moreInfo')}
        onClick={() => setDetailsOpen(true)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
      >
        <Info size={18} />
      </button>

      {detailsOpen && (
        <CardDetails
          item={item}
          showScore={showScore}
          onClose={() => setDetailsOpen(false)}
        />
      )}
    </div>
  );
}

// Vista ampliada a pantalla completa: toda la información de la recomendación
// (descripción, scoring, etiquetas) junto a las mismas acciones de la fila.
function CardDetails({
  item,
  showScore,
  onClose,
}: {
  item: CardItem;
  showScore: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('Card');
  const tags = item.tags ?? [];

  // Cerrar con Escape.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-[60] flex flex-col bg-[var(--background)]"
    >
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col gap-4 overflow-y-auto p-6">
        {/* Cabecera: icono + categoría + cerrar */}
        <div className="flex items-center gap-2.5">
          <CategoryIcon
            name={item.category?.icon}
            className="shrink-0 text-neon-pink"
            size={24}
          />
          {item.category?.name && (
            <span className="min-w-0 flex-1 truncate text-sm text-muted">
              {item.category.name}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Título (enlace si hay URL) + scoring */}
        <div className="flex items-start justify-between gap-3">
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl font-bold text-foreground hover:underline"
            >
              {item.title}
            </a>
          ) : (
            <h2 className="text-2xl font-bold text-foreground">{item.title}</h2>
          )}
          {showScore && (
            <span className="mt-1 shrink-0 text-sm tabular-nums text-muted">
              {item.score ?? item.global_score}
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-base leading-relaxed text-muted">{item.description}</p>
        )}

        {tags.length > 0 && (
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
        )}

        {/* Acciones */}
        <div className="mt-auto flex items-center justify-end gap-3 pb-2 pt-4">
          <RatingCapsule item={item} size="md" />
          <SaveButton item={item} size="md" />
        </div>
      </div>
    </div>
  );
}
