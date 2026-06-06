'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  RecommendationCard,
  type CardItem,
} from '@/components/recommendation-card';

export type TabKey = 'myList' | 'friends' | 'trending';

const TABS: TabKey[] = ['myList', 'friends', 'trending'];

// Mantiene el orden de la lista durante la visita. Si `resetKey` cambia,
// reinicia el orden al actual (uso típico: cambio de pestaña). Si los items
// cambian con el mismo `resetKey`, los presentes mantienen su posición y los
// nuevos se añaden al final.
function useStableOrder<T extends { id: string }>(
  items: T[],
  resetKey: number,
): T[] {
  const [order, setOrder] = useState<string[]>(() => items.map((i) => i.id));
  const lastResetRef = useRef(resetKey);

  useEffect(() => {
    const currentIds = items.map((i) => i.id);
    if (resetKey !== lastResetRef.current) {
      lastResetRef.current = resetKey;
      setOrder(currentIds);
    } else {
      setOrder((prev) => {
        const cset = new Set(currentIds);
        const kept = prev.filter((id) => cset.has(id));
        const added = currentIds.filter((id) => !prev.includes(id));
        return [...kept, ...added];
      });
    }
  }, [items, resetKey]);

  const byId = new Map(items.map((i) => [i.id, i]));
  return order
    .map((id) => byId.get(id))
    .filter((it): it is T => Boolean(it));
}

export function HomeTabs({
  myList,
  friends,
  trending,
  defaultTab,
}: {
  myList: CardItem[];
  friends: CardItem[];
  trending: CardItem[];
  defaultTab: TabKey;
}) {
  const t = useTranslations('Home');
  const [tab, setTab] = useState<TabKey>(defaultTab);
  // Cada vez que se activa una pestaña, se bumpea su contador → reset de su orden.
  const [activations, setActivations] = useState<Record<TabKey, number>>({
    myList: 0,
    friends: 0,
    trending: 0,
  });

  function selectTab(next: TabKey) {
    if (next === tab) return;
    setTab(next);
    setActivations((prev) => ({ ...prev, [next]: prev[next] + 1 }));
  }

  const myListOrdered = useStableOrder(myList, activations.myList);
  const friendsOrdered = useStableOrder(friends, activations.friends);
  const trendingOrdered = useStableOrder(trending, activations.trending);

  const lists: Record<TabKey, CardItem[]> = {
    myList: myListOrdered,
    friends: friendsOrdered,
    trending: trendingOrdered,
  };
  const items = lists[tab];

  return (
    <div className="w-full">
      {/* Tablist sticky a ancho completo, con fade inferior */}
      <div className="sticky top-0 z-30 w-full">
        <div className="bg-[var(--background)] pt-3">
          <div className="mx-auto flex max-w-2xl">
            {TABS.map((key) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectTab(key)}
                  className="relative flex-1 px-2 pb-4 pt-1 text-center text-sm font-medium transition-colors"
                >
                  <span className={active ? 'text-white' : 'text-muted'}>
                    {t(`tabs.${key}`)}
                  </span>
                  {active && (
                    <span className="pointer-events-none absolute inset-x-2 bottom-0 flex items-center justify-center">
                      <span className="tab-underline h-0.5 w-full rounded-full" />
                      <span className="absolute text-base leading-none">🌹</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {/* Fade del fondo hacia transparente al final del tablist */}
        <div
          aria-hidden
          className="pointer-events-none h-6 w-full"
          style={{
            background:
              'linear-gradient(to bottom, var(--background) 0%, rgba(13,13,17,0) 100%)',
          }}
        />
      </div>

      {/* Lista */}
      <div className="mx-auto w-full max-w-2xl px-5">
        {items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">
            {t(`empty.${tab}`)}
          </p>
        ) : (
          <ul className="flex flex-col gap-4 pb-5 pt-1">
            {items.map((item) => (
              <li key={item.id}>
                <RecommendationCard
                  item={item}
                  showScore={tab === 'trending'}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
