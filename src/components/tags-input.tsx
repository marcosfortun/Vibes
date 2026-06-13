'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const MAX_TAGS = 5;

type Suggestion = { name: string; uses: number };

// Campo de tags: texto libre (máx 5) con autocompletado basado en los tags ya
// existentes, ordenados de mayor a menor uso. Cada tag se envía como un input
// oculto name="tags" para que lo recoja la server action.
export function TagsInput() {
  const t = useTranslations('New');
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);

  const q = input.trim().toLowerCase();
  const full = tags.length >= MAX_TAGS;

  useEffect(() => {
    if (full) {
      setSuggestions([]);
      return;
    }
    const supabase = createClient();
    const handle = setTimeout(async () => {
      const { data } = await supabase.rpc('suggest_tags', {
        p_query: q,
        p_limit: 8,
      });
      const list = ((data ?? []) as Suggestion[]).filter(
        (s) => !tags.includes(s.name),
      );
      setSuggestions(list);
    }, 200);
    return () => clearTimeout(handle);
  }, [q, full, tags]);

  function add(raw: string) {
    const v = raw.trim().toLowerCase();
    if (!v || tags.includes(v) || tags.length >= MAX_TAGS) return;
    setTags([...tags, v]);
    setInput('');
    setSuggestions([]);
  }

  function remove(tag: string) {
    setTags(tags.filter((x) => x !== tag));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-2 text-sm text-muted">
        {t('fields.tags')}
        <span className="text-xs tabular-nums opacity-70">
          {tags.length}/{MAX_TAGS}
        </span>
      </span>

      {/* Valores enviados en el submit */}
      {tags.map((tag) => (
        <input key={tag} type="hidden" name="tags" value={tag} />
      ))}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-border-muted bg-[var(--field-bg)] px-2.5 py-1 text-sm text-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
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
                add(input);
              } else if (e.key === 'Backspace' && !input && tags.length) {
                remove(tags[tags.length - 1]);
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
                    // mousedown antes que blur para no cerrar la lista al clicar
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => add(s.name)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-[var(--glass-bg)]"
                  >
                    <span className="truncate text-foreground">{s.name}</span>
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
