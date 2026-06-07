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
      <h2 className="mb-3 shrink-0 text-lg font-semibold text-white">
        {t('yourFriends')}
      </h2>
      {friends.length === 0 ? (
        <p className="text-sm text-muted">{t('noFriends')}</p>
      ) : (
        <ul className="flex flex-1 flex-col gap-2 overflow-y-auto pb-28 pr-1">
          {friends.map((f) => (
              <li key={f.id} className="list-row">
                <span className="flex min-w-0 items-center gap-3 text-white">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-neon-green shadow-[0_0_8px_var(--neon-green)]" />
                  <span className="truncate">{f.username}</span>
                </span>
                <div className="flex shrink-0 items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted">
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
                      className="field w-16 px-2 py-1 text-center"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(() => removeFriend(f.id))}
                    className="btn-danger text-sm"
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
