'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

type Friend = { id: string; username: string };
type Result = { recommendation_id: string; title: string; sg: number };

export function QuedadaPlanner({
  friends,
  selfId,
}: {
  friends: Friend[];
  selfId: string;
}) {
  const t = useTranslations('Quedada');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function organize() {
    setLoading(true);
    const supabase = createClient();
    const attendees = [selfId, ...selected];
    const { data } = await supabase.rpc('organizar_quedada', { attendees });
    setResults((data ?? []) as Result[]);
    setLoading(false);
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <section>
        <h2 className="mb-2 text-lg font-semibold">{t('attendees')}</h2>
        {friends.length === 0 ? (
          <p className="text-sm opacity-60">{t('noFriends')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {friends.map((f) => (
              <li key={f.id}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.has(f.id)}
                    onChange={() => toggle(f.id)}
                  />
                  {f.username}
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={organize}
        disabled={loading}
        className="self-start rounded bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {t('organize')}
      </button>

      {results !== null && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">{t('results')}</h2>
          {results.length === 0 ? (
            <p className="text-sm opacity-60">{t('empty')}</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {results.map((r, i) => (
                <li
                  key={r.recommendation_id}
                  className="flex items-center justify-between rounded border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                >
                  <span>
                    <span className="mr-2 font-bold">{i + 1}.</span>
                    {r.title}
                  </span>
                  <span className="text-sm tabular-nums opacity-60">
                    {Math.round(Number(r.sg) * 10) / 10}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
