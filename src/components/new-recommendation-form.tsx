'use client';

import { useActionState, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import {
  createRecommendation,
  type NewRecState,
} from '@/lib/actions/recommendations';
import { TagsInput } from '@/components/tags-input';

type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};
type Similar = { id: string; title: string; similarity: number };

export function NewRecommendationForm({
  categories,
}: {
  categories: Category[];
}) {
  const t = useTranslations('New');
  const [state, formAction, pending] = useActionState<NewRecState, FormData>(
    createRecommendation,
    {},
  );
  const [title, setTitle] = useState('');
  const [similar, setSimilar] = useState<Similar[]>([]);

  // Con menos de 2 caracteres no hay coincidencias relevantes: se oculta el
  // aviso derivándolo en render, sin limpiar estado dentro del efecto.
  const q = title.trim();
  const showSimilar = q.length >= 2 && similar.length > 0;

  // Deduplicación difusa en tiempo de escritura (pg_trgm vía RPC).
  useEffect(() => {
    if (q.length < 2) return;
    const supabase = createClient();
    const handle = setTimeout(async () => {
      const { data } = await supabase.rpc('find_similar_recommendations', { q });
      setSimilar((data ?? []) as Similar[]);
    }, 300);
    return () => clearTimeout(handle);
  }, [q]);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">

      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('fields.title')}
        <input
          type="text"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="field"
        />
      </label>

      {showSimilar && (
        <div className="rounded-xl border border-neon-pink/40 bg-neon-pink/10 p-3 text-sm text-foreground">
          <p className="font-medium">{t('similarHint')}</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {similar.map((s) => (
              <li key={s.id} className="flex justify-between gap-2">
                <span>{s.title}</span>
                <span className="tabular-nums opacity-60">
                  {Math.round(s.similarity * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('fields.description')}
        <textarea name="description" rows={3} className="field" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('fields.url')}
        <input
          type="url"
          name="url"
          inputMode="url"
          placeholder="https://"
          className="field"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('fields.category')}
        <select
          name="category_id"
          required
          defaultValue=""
          className="field field-select"
        >
          <option value="" disabled>
            {t('fields.choose')}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <TagsInput />

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
