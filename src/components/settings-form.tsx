'use client';

import { useRef, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { updatePreferences } from '@/lib/actions/preferences';

const LANGUAGES = ['en', 'es', 'fr', 'pt'] as const;

export function SettingsForm({
  language,
  useAffinity,
}: {
  language: string;
  useAffinity: boolean;
}) {
  const t = useTranslations('Settings');
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  // Guarda automáticamente al modificar cualquier control.
  function save() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    startTransition(() => updatePreferences(fd));
  }

  return (
    <form ref={formRef} className="flex w-full max-w-md flex-col gap-5">
      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('language')}
        <select
          name="language"
          defaultValue={language}
          disabled={pending}
          onChange={save}
          className="field field-select"
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {t(`languages.${l}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="use_affinity_scoring"
          defaultChecked={useAffinity}
          disabled={pending}
          onChange={save}
          className="checkbox mt-0.5"
        />
        <span>
          {t('affinityScoring')}
          <span className="block text-xs text-muted">{t('affinityHint')}</span>
        </span>
      </label>
    </form>
  );
}
