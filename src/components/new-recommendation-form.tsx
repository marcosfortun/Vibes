'use client';

import { useActionState, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import {
  createRecommendation,
  type NewRecState,
} from '@/lib/actions/recommendations';

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

  // Deduplicación difusa en tiempo de escritura (pg_trgm vía RPC).
  useEffect(() => {
    const q = title.trim();
    if (q.length < 2) {
      setSimilar([]);
      return;
    }
    const supabase = createClient();
    const handle = setTimeout(async () => {
      const { data } = await supabase.rpc('find_similar_recommendations', { q });
      setSimilar((data ?? []) as Similar[]);
    }, 300);
    return () => clearTimeout(handle);
  }, [title]);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">

      <label className="flex flex-col gap-1 text-sm">
        {t('fields.title')}
        <input
          type="text"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
        />
      </label>

      {similar.length > 0 && (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700 dark:bg-amber-950">
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

      <label className="flex flex-col gap-1 text-sm">
        {t('fields.description')}
        <textarea
          name="description"
          rows={3}
          className="rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t('fields.url')}
        <input
          type="url"
          name="url"
          inputMode="url"
          placeholder="https://"
          className="rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t('fields.category')}
        <select
          name="category_id"
          required
          defaultValue=""
          className="rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
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

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {t(`errors.${state.error}`)}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-gradient-to-r from-neon-pink to-neon-green px-5 py-2 font-semibold text-black disabled:opacity-50"
      >
        {t('submit')}
      </button>
    </form>
  );
}
