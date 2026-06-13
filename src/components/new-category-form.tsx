'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { createCategory, type CategoryState } from '@/lib/actions/categories';
import { CATEGORY_ICON_NAMES } from '@/components/category-icon';

export function NewCategoryForm() {
  const t = useTranslations('Admin.categories');
  const [state, formAction, creating] = useActionState<CategoryState, FormData>(
    createCategory,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        type="text"
        name="name"
        required
        placeholder={t('name')}
        className="field"
      />
      <div className="flex gap-2">
        <input
          type="text"
          name="icon"
          list="lucide-icons"
          placeholder={t('icon')}
          className="field flex-1"
        />
        <datalist id="lucide-icons">
          {CATEGORY_ICON_NAMES.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <input
          type="color"
          name="color"
          defaultValue="#2563eb"
          aria-label={t('color')}
          className="h-[42px] w-14 shrink-0 cursor-pointer rounded-xl border border-border-muted bg-transparent"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-neon-pink">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <button type="submit" disabled={creating} className="btn-primary w-full">
        {t('create')}
      </button>
    </form>
  );
}
