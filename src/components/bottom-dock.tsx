'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CircleUserRound,
  Dices,
  List,
  Plus,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const HIDDEN_ON = ['/login', '/signup', '/welcome'];

export function BottomDock() {
  const pathname = usePathname();
  const t = useTranslations('Dock');

  if (
    HIDDEN_ON.includes(pathname) ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/invite')
  )
    return null;

  // "Suerte" y "Quedada" quedan deshabilitadas temporalmente en la 1.5.0
  // ("suerte" no funciona aún; "quedada" está pendiente de revisión).
  const items: {
    key: string;
    href: string;
    Icon: LucideIcon;
    active: boolean;
    disabled?: boolean;
  }[] = [
    { key: 'myList', href: '/', Icon: List, active: pathname === '/' },
    { key: 'luck', href: '/', Icon: Dices, active: false, disabled: true },
    {
      key: 'meetup',
      href: '/quedada',
      Icon: Zap,
      active: pathname === '/quedada',
      disabled: true,
    },
    {
      key: 'profile',
      href: '/settings',
      Icon: CircleUserRound,
      active:
        pathname === '/settings' ||
        pathname === '/friends' ||
        pathname.startsWith('/admin'),
    },
  ];

  return (
    <>
      {/* Fondo negro con fade superior para que el dock no se mezcle con las tarjetas */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-[143px]"
        style={{
          background:
            'linear-gradient(to top, var(--background) 55%, rgba(13,13,17,0) 100%)',
        }}
      />
      <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center">
      <div className="glass pointer-events-auto flex items-end gap-2 rounded-[30px] px-4 py-2.5">
        {/* Mi lista, Suerte */}
        {items.slice(0, 2).map((item) => (
          <DockItem key={item.key} item={item} label={t(item.key)} />
        ))}

        {/* Añadir (central, sobresale) */}
        <Link
          href="/new"
          aria-label={t('add')}
          className="-mt-6 flex w-14 flex-col items-center gap-1"
        >
          <span className="dock-add-glow flex h-14 w-14 items-center justify-center rounded-full p-[2px]"
            style={{
              border: '2px solid transparent',
              backgroundImage:
                'linear-gradient(var(--surface), var(--surface)), linear-gradient(120deg, var(--neon-pink), var(--neon-green))',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
            }}
          >
            <Plus size={28} strokeWidth={2} className="text-foreground" />
          </span>
          <span className="text-[10px] text-muted">{t('add')}</span>
          <span className="h-1 w-1" />
        </Link>

        {/* Quedada, Perfil */}
        {items.slice(2).map((item) => (
          <DockItem key={item.key} item={item} label={t(item.key)} />
        ))}
      </div>
      </nav>
    </>
  );
}

// Entrada del dock. Deshabilitada: sin navegación, atenuada y aria-disabled.
function DockItem({
  item,
  label,
}: {
  item: { href: string; Icon: LucideIcon; active: boolean; disabled?: boolean };
  label: string;
}) {
  const { href, Icon, active, disabled } = item;
  const inner = (
    <>
      <Icon
        size={22}
        strokeWidth={1.75}
        className={active ? 'text-foreground' : 'text-muted'}
      />
      <span className={`text-[10px] ${active ? 'text-foreground' : 'text-muted'}`}>
        {label}
      </span>
      <span
        className={`h-1 w-1 rounded-full ${active ? 'bg-neon-pink' : 'bg-transparent'}`}
      />
    </>
  );

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        title={label}
        className="flex w-14 cursor-not-allowed flex-col items-center gap-1 opacity-35"
      >
        {inner}
      </span>
    );
  }

  return (
    <Link href={href} className="flex w-14 flex-col items-center gap-1">
      {inner}
    </Link>
  );
}
