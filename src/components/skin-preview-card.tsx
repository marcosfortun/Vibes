import { Check, Plus, Sparkles } from 'lucide-react';
import type { SkinStyle } from '@/lib/skins';

// Placeholder estático que imita una tarjeta de recomendación, en pequeño, para
// previsualizar el estilo de una skin. El contenedor lleva data-skin, de modo que
// todas las variables CSS se resuelven con el tema de esa skin (aunque la página
// esté usando otra). No es interactivo.
export function SkinPreviewCard({ style }: { style: SkinStyle }) {
  return (
    <div
      data-skin={style}
      aria-hidden
      className="pointer-events-none select-none"
      style={{ width: 132 }}
    >
      <div
        className="neon-border neon-border-glow flex flex-col p-2.5"
        style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
      >
        <div className="flex flex-1 items-start gap-1.5 overflow-hidden">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-neon-pink" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] font-bold leading-tight">
              Lorem ipsum
            </div>
            <div className="mt-1 space-y-1">
              <div className="h-1 w-full rounded-full bg-current opacity-20" />
              <div className="h-1 w-2/3 rounded-full bg-current opacity-20" />
            </div>
          </div>
        </div>

        <div className="mt-2 flex shrink-0 items-center justify-between">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current opacity-30">
            <Check size={11} />
          </span>
          <span className="flex items-center gap-1">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current opacity-60">
              <Plus size={11} />
            </span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-neon-green opacity-60">
              <span className="text-[9px] font-bold">···</span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
