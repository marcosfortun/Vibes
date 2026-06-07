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
        <h2 className="mb-3 text-lg font-semibold text-white">
          {t('attendees')}
        </h2>
        {friends.length === 0 ? (
          <p className="text-sm text-muted">{t('noFriends')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {friends.map((f) => (
              <li key={f.id} className="list-row">
                <label className="flex w-full cursor-pointer items-center gap-3 text-sm text-white">
                  <input
                    type="checkbox"
                    className="checkbox"
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
        className="btn-primary w-full"
      >
        {t('organize')}
      </button>

      {results !== null && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            {t('results')}
          </h2>
          {results.length === 0 ? (
            <p className="text-sm text-muted">{t('empty')}</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {results.map((r, i) => (
                <li key={r.recommendation_id} className="list-row">
                  <span className="flex min-w-0 items-center gap-3 text-white">
                    <span className="shrink-0 font-bold text-neon-green tabular-nums">
                      {i + 1}.
                    </span>
                    <span className="truncate">{r.title}</span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-muted">
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
