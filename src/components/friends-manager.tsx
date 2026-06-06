'use client';

import { useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { addFriend, removeFriend, updateAffinity } from '@/lib/actions/friends';

export type Friend = { id: string; username: string; affinity: number };
type Found = { id: string; username: string };

export function FriendsManager({
  friends,
  selfId,
}: {
  friends: Friend[];
  selfId: string;
}) {
  const t = useTranslations('Friends');
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Found[]>([]);

  const friendIds = new Set(friends.map((f) => f.id));

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const supabase = createClient();
    const h = setTimeout(async () => {
      const { data } = await supabase
        .from('users')
        .select('id,username')
        .ilike('username', `%${term}%`)
        .limit(10);
      setResults((data ?? []).filter((u) => u.id !== selfId));
    }, 300);
    return () => clearTimeout(h);
  }, [q, selfId]);

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      {/* Amigos actuales */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">
          {t('yourFriends')}
        </h2>
        {friends.length === 0 ? (
          <p className="text-sm text-muted">{t('noFriends')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {friends.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-surface px-3 py-2"
              >
                <span className="text-white">{f.username}</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs text-muted">
                    {t('affinity')}
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      defaultValue={f.affinity}
                      disabled={pending}
                      onBlur={(e) =>
                        startTransition(() =>
                          updateAffinity(f.id, parseFloat(e.target.value)),
                        )
                      }
                      className="w-16 rounded-lg border border-white/15 bg-transparent px-2 py-1 text-center text-white outline-none focus:border-neon-green/60"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(() => removeFriend(f.id))}
                    className="text-sm text-neon-pink disabled:opacity-50"
                  >
                    {t('remove')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Buscador */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">{t('find')}</h2>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-xl border border-white/15 bg-surface px-3 py-2 text-white outline-none focus:border-neon-green/60"
        />
        {results.length > 0 && (
          <ul className="mt-2 flex flex-col gap-2">
            {results.map((u) => {
              const isFriend = friendIds.has(u.id);
              return (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-surface px-3 py-2"
                >
                  <span className="text-white">{u.username}</span>
                  {isFriend ? (
                    <span className="text-xs text-muted">
                      {t('alreadyFriend')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => startTransition(() => addFriend(u.id))}
                      className="rounded-full bg-gradient-to-r from-neon-pink to-neon-green px-3 py-1 text-sm font-semibold text-black disabled:opacity-50"
                    >
                      {t('add')}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
