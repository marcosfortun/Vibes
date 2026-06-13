'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const MAX_TAGS = 5;

type Suggestion = { name: string; label: string; uses: number };
type Tag = { name: string; label: string };

// Campo de tags: texto libre (máx 5) con autocompletado por uso (localizado).
// Cada tag guarda su nombre canónico (en minúsculas, lo que se envía) y un
// label localizado (lo que se muestra). Se envían como inputs ocultos name="tags".
export function TagsInput({ initialTags = [] }: { initialTags?: string[] }) {
  const t = useTranslations('New');
  const locale = useLocale();
  const [tags, setTags] = useState<Tag[]>(
    initialTags
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_TAGS)
      .map((s) => ({ name: s.toLowerCase(), label: s })),
  );
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);

  const q = input.trim().toLowerCase();
  const full = tags.length >= MAX_TAGS;

  useEffect(() => {
    if (full) return; // con 5 tags el input no se muestra; add() ya limpia sugerencias
    const supabase = createClient();
    const handle = setTimeout(async () => {
      const { data } = await supabase.rpc('suggest_tags', {
        p_query: q,
        p_limit: 8,
        p_locale: locale,
      });
      const list = ((data ?? []) as Suggestion[]).filter(
        (s) => !tags.some((tg) => tg.name === s.name),
      );
      setSuggestions(list);
    }, 200);
    return () => clearTimeout(handle);
  }, [q, full, tags, locale]);

  function add(name: string, label: string) {
    const canonical = name.trim().toLowerCase();
    if (!canonical || tags.some((t) => t.name === canonical) || full) return;
    setTags([...tags, { name: canonical, label: label.trim() || canonical }]);
    setInput('');
    setSuggestions([]);
  }

  function remove(name: string) {
    setTags(tags.filter((x) => x.name !== name));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-2 text-sm text-muted">
        {t('fields.tags')}
        <span className="text-xs tabular-nums opacity-70">
          {tags.length}/{MAX_TAGS}
        </span>
      </span>

      {tags.map((tag) => (
        <input key={tag.name} type="hidden" name="tags" value={tag.name} />
      ))}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.name}
              className="inline-flex items-center gap-1 rounded-full border border-border-muted bg-[var(--field-bg)] px-2.5 py-1 text-sm text-foreground"
            >
              {tag.label}
              <button
                type="button"
                onClick={() => remove(tag.name)}
                aria-label={t('fields.removeTag')}
                className="text-muted transition-colors hover:text-neon-pink"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {!full && (
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                add(input, input);
              } else if (e.key === 'Backspace' && !input && tags.length) {
                remove(tags[tags.length - 1].name);
              }
            }}
            placeholder={t('fields.tagsPlaceholder')}
            className="field"
          />
          {open && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-border-muted bg-[var(--surface)] py-1 shadow-lg">
              {suggestions.map((s) => (
                <li key={s.name}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => add(s.name, s.label)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-[var(--glass-bg)]"
                  >
                    <span className="truncate text-foreground">{s.label}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">
                      {s.uses}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
