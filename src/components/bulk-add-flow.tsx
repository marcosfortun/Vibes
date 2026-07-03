'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check, ChevronRight, Loader2, Plus, SkipForward } from 'lucide-react';
import { CategoryPicker } from '@/components/new-recommendation-flow';
import {
  bulkAddDone,
  bulkAddItem,
  searchCandidates,
  type BulkPick,
  type Candidate,
} from '@/lib/actions/recommendations';
import { LIMITS } from '@/lib/limits';

type Category = { id: string; name: string; icon?: string | null };

type ItemResult = {
  title: string;
  status: 'created' | 'skipped' | 'failed';
  via?: string; // provider o 'existing' / 'scratch'
};

const MAX_TITLES = 50;

// Carga masiva: se elige una categoría, se pegan títulos (uno por línea) y por
// cada uno se muestran los candidatos del autocompletado para elegir el mejor
// (o crear solo con el título, u omitir). Los candidatos del siguiente título se
// piden en segundo plano mientras el usuario decide. Al final, un resumen.
export function BulkAddFlow({ categories }: { categories: Category[] }) {
  const t = useTranslations('Bulk');
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [raw, setRaw] = useState('');
  const [titles, setTitles] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ItemResult[]>([]);
  const [pending, startTransition] = useTransition();

  // Caché de candidatos por título (evita repetir búsqueda y permite prefetch).
  const cacheRef = useRef<Map<string, Candidate[]>>(new Map());
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const fetchFor = useCallback(
    async (title: string): Promise<Candidate[]> => {
      const cached = cacheRef.current.get(title);
      if (cached) return cached;
      if (!category) return [];
      const res = await searchCandidates(category.id, title);
      cacheRef.current.set(title, res);
      return res;
    },
    [category],
  );

  // Carga los candidatos del título actual y prefetch del siguiente.
  useEffect(() => {
    if (!titles || index >= titles.length) return;
    let alive = true;
    void (async () => {
      setLoadingCandidates(true);
      setCandidates(null);
      const res = await fetchFor(titles[index]);
      if (!alive) return;
      setCandidates(res);
      setLoadingCandidates(false);
      // Prefetch del siguiente en segundo plano (sin bloquear la UI).
      const next = titles[index + 1];
      if (next) void fetchFor(next);
    })();
    return () => {
      alive = false;
    };
  }, [titles, index, fetchFor]);

  function start() {
    const parsed = Array.from(
      new Set(
        raw
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => l.slice(0, LIMITS.title)),
      ),
    ).slice(0, MAX_TITLES);
    if (!parsed.length) return;
    setTitles(parsed);
    setIndex(0);
    setResults([]);
  }

  function record(r: ItemResult) {
    setResults((prev) => [...prev, r]);
    setIndex((i) => i + 1);
  }

  function choose(pick: BulkPick, label: ItemResult) {
    startTransition(async () => {
      const { ok } = await bulkAddItem(category!.id, pick);
      record({ ...label, status: ok ? label.status : 'failed' });
    });
  }

  function skip(title: string) {
    record({ title, status: 'skipped' });
  }

  function finish() {
    startTransition(async () => {
      await bulkAddDone();
      router.push('/');
    });
  }

  // ── Paso 0: categoría + textarea ──
  if (!titles) {
    return (
      <div className="flex w-full flex-col gap-4">
        <p className="text-sm text-muted">{t('intro')}</p>
        <CategoryPicker
          categories={categories}
          value={category}
          onChange={setCategory}
        />
        {category && (
          <label className="flex flex-col gap-1 text-sm text-muted">
            {t('titlesLabel')}
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={8}
              placeholder={t('titlesPlaceholder')}
              className="field font-mono text-sm"
              autoFocus
            />
          </label>
        )}
        {category && (
          <button
            type="button"
            onClick={start}
            disabled={!raw.trim()}
            className="btn-primary w-full disabled:opacity-50"
          >
            {t('start')}
          </button>
        )}
      </div>
    );
  }

  // ── Paso 2: resumen ──
  if (index >= titles.length) {
    const created = results.filter((r) => r.status === 'created').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    return (
      <div className="flex w-full flex-col gap-4">
        <h2 className="text-lg font-bold text-foreground">{t('summaryTitle')}</h2>
        <p className="text-sm text-muted">
          {t('summaryCounts', { created, skipped, failed })}
        </p>
        <ul className="flex flex-col gap-1.5">
          {results.map((r, i) => (
            <li
              key={`${r.title}-${i}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-border-muted px-3 py-1.5 text-sm"
            >
              <span className="min-w-0 flex-1 truncate text-foreground">{r.title}</span>
              <span
                className={`shrink-0 text-xs ${
                  r.status === 'created'
                    ? 'text-neon-pink'
                    : r.status === 'failed'
                      ? 'text-red-500'
                      : 'text-muted'
                }`}
              >
                {t(`status.${r.status}`)}
                {r.via ? ` · ${r.via}` : ''}
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={finish}
          disabled={pending}
          className="btn-primary w-full text-center disabled:opacity-50"
        >
          {t('goHome')}
        </button>
      </div>
    );
  }

  // ── Paso 1: elegir candidato para el título actual ──
  const title = titles[index];
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-2 text-sm text-muted">
        <span>{t('progress', { current: index + 1, total: titles.length })}</span>
        {pending && <Loader2 size={16} className="animate-spin" />}
      </div>

      <h2 className="truncate text-xl font-bold text-foreground" title={title}>
        {title}
      </h2>

      {loadingCandidates ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" />
          {t('searching')}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {(candidates ?? []).map((c, i) => (
            <li key={c.kind === 'existing' ? c.id : `${c.provider}-${i}`}>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  choose(
                    c.kind === 'existing'
                      ? { kind: 'existing', id: c.id }
                      : {
                          kind: 'external',
                          title: c.title,
                          description: c.description,
                          url: c.url,
                          image: c.image,
                          tags: c.tags,
                        },
                    {
                      title: c.title,
                      status: 'created',
                      via: c.kind === 'existing' ? t('inCatalog') : c.provider,
                    },
                  )
                }
                className="list-row w-full text-left text-foreground transition-colors hover:bg-[var(--glass-bg)] disabled:opacity-50"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{c.title}</span>
                  {c.description && (
                    <span className="truncate text-xs text-muted">{c.description}</span>
                  )}
                </span>
                <span className="ml-2 shrink-0 text-[10px] uppercase tracking-wide text-muted">
                  {c.kind === 'existing' ? t('inCatalog') : c.provider}
                </span>
              </button>
            </li>
          ))}

          {/* Crear solo con el título */}
          <li>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                choose(
                  { kind: 'scratch', title },
                  { title, status: 'created', via: t('scratch') },
                )
              }
              className="list-row w-full text-left text-foreground transition-colors hover:bg-[var(--glass-bg)] disabled:opacity-50"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Plus size={16} className="shrink-0" />
                <span className="truncate">{t('createScratch')}</span>
              </span>
              <Check size={16} className="shrink-0" />
            </button>
          </li>

          {/* Omitir este título */}
          <li>
            <button
              type="button"
              disabled={pending}
              onClick={() => skip(title)}
              className="list-row w-full text-left text-muted transition-colors hover:bg-[var(--glass-bg)] disabled:opacity-50"
            >
              <span className="flex min-w-0 items-center gap-2">
                <SkipForward size={16} className="shrink-0" />
                <span className="truncate">{t('skip')}</span>
              </span>
              <ChevronRight size={16} className="shrink-0" />
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
