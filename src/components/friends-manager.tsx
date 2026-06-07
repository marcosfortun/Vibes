'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { removeFriend, updateAffinity } from '@/lib/actions/friends';

export type Friend = { id: string; username: string; affinity: number };

export function FriendsManager({ friends }: { friends: Friend[] }) {
  const t = useTranslations('Friends');
  const [pending, startTransition] = useTransition();

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col">
      <h2 className="mb-2 shrink-0 text-lg font-semibold text-white">
        {t('yourFriends')}
      </h2>
      {friends.length === 0 ? (
        <p className="text-sm text-muted">{t('noFriends')}</p>
      ) : (
        <ul className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
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
  );
}
