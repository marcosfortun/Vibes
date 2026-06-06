/**
 * Vibes — Vista previa de componentes (documental).
 *
 * Este archivo NO se importa desde la app. Sirve como referencia rápida
 * de los estilos clave para diseñadores/desarrolladores. Usa Tailwind v4,
 * las utilidades de `src/app/globals.css` (`.neon-border`, `.neon-border-glow`,
 * `.glass`, `.tab-underline`, `.dock-add-glow`) y la librería `lucide-react`.
 */

import {
  Clapperboard,
  CircleUserRound,
  Dices,
  Heart,
  List,
  Minus,
  MoreHorizontal,
  Plus,
  ThumbsDown,
  ThumbsUp,
  Zap,
} from 'lucide-react';

export function StyleGuidePreview() {
  return (
    <div className="min-h-screen bg-[#0D0D11] text-white p-6 flex flex-col gap-10">
      {/* Tabs */}
      <section>
        <h2 className="mb-3 text-sm text-[#8E8E93]">Tabs</h2>
        <div className="flex">
          {['Mi Lista', 'De Amigos', 'Tendencias'].map((label, i) => {
            const active = i === 0;
            return (
              <div key={label} className="relative flex-1 px-2 pb-4 pt-1 text-center text-sm font-medium">
                <span className={active ? 'text-white' : 'text-[#8E8E93]'}>{label}</span>
                {active && (
                  <span className="pointer-events-none absolute inset-x-2 bottom-0 flex items-center justify-center">
                    <span className="tab-underline h-0.5 w-full rounded-full" />
                    <span className="absolute text-base leading-none">🌹</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Tarjeta de recomendación */}
      <section>
        <h2 className="mb-3 text-sm text-[#8E8E93]">Card</h2>
        <div className="neon-border neon-border-glow p-4">
          <div className="flex items-start gap-3">
            <Clapperboard size={26} strokeWidth={1.75} className="mt-0.5 text-[#FF2A75]" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">Matrix</h3>
              <p className="mt-0.5 text-sm text-[#8E8E93]">Clásico ciberpunk</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="glass flex items-center gap-1 rounded-full px-1.5 py-1">
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#8E8E93] hover:bg-white/10">
                <ThumbsDown size={16} strokeWidth={2} />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#8E8E93] hover:bg-white/10">
                <ThumbsUp size={16} strokeWidth={2} />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 ring-1 ring-[#FF2A75] text-[#FF2A75]">
                <Heart size={16} strokeWidth={2} fill="currentColor" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white">
                <Minus size={18} />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[#39FF85]/70 text-[#39FF85]">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Dock */}
      <section>
        <h2 className="mb-3 text-sm text-[#8E8E93]">Bottom dock</h2>
        <div className="flex justify-center">
          <div className="glass flex items-end gap-2 rounded-[30px] px-4 py-2.5">
            {[
              { label: 'Mi lista', Icon: List, active: true },
              { label: 'Suerte', Icon: Dices, active: false },
            ].map(({ label, Icon, active }) => (
              <div key={label} className="flex w-14 flex-col items-center gap-1">
                <Icon size={22} strokeWidth={1.75} className={active ? 'text-white' : 'text-[#8E8E93]'} />
                <span className={`text-[10px] ${active ? 'text-white' : 'text-[#8E8E93]'}`}>{label}</span>
                <span className={`h-1 w-1 rounded-full ${active ? 'bg-[#FF2A75]' : ''}`} />
              </div>
            ))}
            <div className="-mt-6 flex w-14 flex-col items-center gap-1">
              <span className="dock-add-glow flex h-14 w-14 items-center justify-center rounded-full p-[2px]"
                style={{
                  background:
                    'linear-gradient(#18181C, #18181C) padding-box, linear-gradient(120deg, #FF2A75, #39FF85) border-box',
                  border: '2px solid transparent',
                }}
              >
                <span className="flex h-full w-full items-center justify-center rounded-full bg-[#18181C]">
                <Plus size={28} strokeWidth={2} className="text-white" />
              </span>
              </span>
              <span className="text-[10px] text-[#8E8E93]">Añadir</span>
              <span className="h-1 w-1" />
            </div>
            {[
              { label: 'Quedada', Icon: Zap },
              { label: 'Perfil', Icon: CircleUserRound },
            ].map(({ label, Icon }) => (
              <div key={label} className="flex w-14 flex-col items-center gap-1">
                <Icon size={22} strokeWidth={1.75} className="text-[#8E8E93]" />
                <span className="text-[10px] text-[#8E8E93]">{label}</span>
                <span className="h-1 w-1" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
