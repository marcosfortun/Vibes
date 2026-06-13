'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  RecommendationCard,
  type CardItem,
} from '@/components/recommendation-card';
import { DEFAULT_SKIN } from '@/lib/skins';
import { useActiveSkin } from '@/lib/use-active-skin';

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
  const skin = useActiveSkin(DEFAULT_SKIN);
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
          {/* px-4: holgura en los bordes para que el capullo de la rosa de la
              pestaña activa (sobre todo la última) no se corte con el borde. */}
          <div className="mx-auto flex max-w-2xl px-4">
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
                  <span className={active ? 'text-foreground' : 'text-muted'}>
                    {t(`tabs.${key}`)}
                  </span>
                  {active &&
                    (skin === 'cyberbotanical' ? (
                      // Rosa-tallo de la propuesta inicial (preview.jpg): exclusiva
                      // de "La vie en rose". El degradado es el tallo y termina en el
                      // capullo a la derecha. Aspecto preservado, centrada sobre la línea.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src="/menu-rose.png"
                        alt=""
                        aria-hidden
                        className="pointer-events-none absolute bottom-0 left-2 w-[calc(100%-1rem)] translate-y-1/2"
                      />
                    ) : (
                      // Resto de skins: subrayado simple con el acento de la skin.
                      <span
                        aria-hidden
                        className="pointer-events-none absolute bottom-0 left-2 h-[3px] w-[calc(100%-1rem)] rounded-full"
                        style={{ background: 'var(--accent-gradient)' }}
                      />
                    ))}
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
