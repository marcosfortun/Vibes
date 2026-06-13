'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight, Plus, Sparkles } from 'lucide-react';
import {
  searchCandidates,
  addExistingToList,
  createRecommendation,
  type Candidate,
  type NewRecState,
} from '@/lib/actions/recommendations';
import { TagsInput } from '@/components/tags-input';

type Category = { id: string; name: string };
type Prefill = {
  title: string;
  description: string;
  url: string;
  tags: string[];
};

export function NewRecommendationFlow({ categories }: { categories: Category[] }) {
  const [category, setCategory] = useState<Category | null>(null);
  const [prefill, setPrefill] = useState<Prefill | null>(null);

  // Paso 2: formulario de detalles ya pre-relleno.
  if (category && prefill) {
    return (
      <DetailsStep
        category={category}
        prefill={prefill}
        onBack={() => setPrefill(null)}
      />
    );
  }

  // Paso 1: categoría + buscador de título.
  return (
    <SearchStep
      categories={categories}
      category={category}
      onPickCategory={setCategory}
      onPrefill={setPrefill}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Paso 1
// ─────────────────────────────────────────────────────────────────────────
function SearchStep({
  categories,
  category,
  onPickCategory,
  onPrefill,
}: {
  categories: Category[];
  category: Category | null;
  onPickCategory: (c: Category | null) => void;
  onPrefill: (p: Prefill) => void;
}) {
  const t = useTranslations('New');
  const [title, setTitle] = useState('');
  const [results, setResults] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, startTransition] = useTransition();

  const q = title.trim();

  useEffect(() => {
    if (!category || q.length < 2) return;
    let alive = true;
    const handle = setTimeout(async () => {
      setSearching(true);
      const data = await searchCandidates(category.id, q);
      if (alive) {
        setResults(data);
        setSearching(false);
      }
    }, 400);
    return () => {
      alive = false;
      clearTimeout(handle);
    };
  }, [category, q]);

  return (
    <div className="flex w-full flex-col gap-4">
      <CategoryPicker
        categories={categories}
        value={category}
        onChange={(c) => {
          onPickCategory(c);
          setResults([]);
        }}
      />

      {category && (
        <label className="flex flex-col gap-1 text-sm text-muted">
          {t('fields.title')}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('searchTitlePlaceholder')}
            className="field"
            autoFocus
          />
        </label>
      )}

      {category && q.length >= 2 && (
        <section className="flex flex-col gap-2">
          <p className="text-xs text-muted">
            {searching ? t('searching') : t('selectPrompt')}
          </p>

          <ul className="flex flex-col gap-2">
            {results.map((c, i) => (
              <li key={c.kind === 'existing' ? c.id : `${c.provider}-${i}`}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (c.kind === 'existing') {
                      startTransition(() => addExistingToList(c.id));
                    } else {
                      onPrefill({
                        title: c.title,
                        description: c.description ?? '',
                        url: c.url ?? '',
                        tags: c.tags ?? [],
                      });
                    }
                  }}
                  className="list-row w-full text-left text-foreground transition-colors hover:bg-[var(--glass-bg)]"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{c.title}</span>
                    {c.description && (
                      <span className="truncate text-xs text-muted">
                        {c.description}
                      </span>
                    )}
                  </span>
                  <span className="ml-2 shrink-0 text-[10px] uppercase tracking-wide text-muted">
                    {c.kind === 'existing' ? t('existingBadge') : c.provider}
                  </span>
                </button>
              </li>
            ))}

            {/* Crear desde cero: siempre disponible para no bloquear si no hay resultados */}
            <li>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  onPrefill({ title: q, description: '', url: '', tags: [] })
                }
                className="list-row w-full text-left text-neon-pink transition-colors hover:bg-[var(--glass-bg)]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Plus size={16} className="shrink-0" />
                  <span className="truncate">{t('fromScratch', { title: q })}</span>
                </span>
                <ChevronRight size={16} className="shrink-0" />
              </button>
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}

// Buscador-autocompletado de categoría (filtro cliente; el catálogo es pequeño).
function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: Category | null;
  onChange: (c: Category | null) => void;
}) {
  const t = useTranslations('New');
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const q = input.trim().toLowerCase();
  const matches = q
    ? categories.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8)
    : categories.slice(0, 8);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border-muted bg-[var(--field-bg)] px-3 py-2">
        <span className="truncate text-foreground">{value.name}</span>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setInput('');
          }}
          className="shrink-0 text-sm text-neon-pink"
        >
          {t('changeCategory')}
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('fields.category')}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder={t('categoryPlaceholder')}
          className="field"
        />
      </label>
      {open && matches.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border-muted bg-[var(--surface)] py-1 shadow-lg">
          {matches.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-[var(--glass-bg)]"
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Paso 2
// ─────────────────────────────────────────────────────────────────────────
function DetailsStep({
  category,
  prefill,
  onBack,
}: {
  category: Category;
  prefill: Prefill;
  onBack: () => void;
}) {
  const t = useTranslations('New');
  const [state, formAction, pending] = useActionState<NewRecState, FormData>(
    createRecommendation,
    {},
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <input type="hidden" name="category_id" value={category.id} />

      <div className="flex items-center gap-2 text-sm text-muted">
        <Sparkles size={14} className="text-neon-pink" />
        {category.name}
        <button type="button" onClick={onBack} className="ml-auto text-neon-pink">
          {t('back')}
        </button>
      </div>

      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('fields.title')}
        <input
          type="text"
          name="title"
          required
          defaultValue={prefill.title}
          className="field"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('fields.description')}
        <textarea
          name="description"
          rows={3}
          defaultValue={prefill.description}
          className="field"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('fields.url')}
        <input
          type="url"
          name="url"
          inputMode="url"
          placeholder="https://"
          defaultValue={prefill.url}
          className="field"
        />
      </label>

      <TagsInput initialTags={prefill.tags} />

      {state.error && (
        <p role="alert" className="text-sm text-neon-pink">
          {t(`errors.${state.error}`)}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {t('submit')}
      </button>
    </form>
  );
}
