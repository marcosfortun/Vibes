'use client';

import { useActionState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  createCategory,
  deleteCategory,
  type CategoryState,
} from '@/lib/actions/categories';
import { CATEGORY_ICON_NAMES, CategoryIcon } from '@/components/category-icon';

export type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

export function AdminCategories({ categories }: { categories: Category[] }) {
  const t = useTranslations('Admin');
  const [state, formAction, creating] = useActionState<CategoryState, FormData>(
    createCategory,
    {},
  );
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      {/* Alta */}
      <form action={formAction} className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-white">{t('create')}</h2>
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
            className="h-[42px] w-14 shrink-0 cursor-pointer rounded-xl border border-white/10 bg-transparent"
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

      {/* Lista */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">{t('existing')}</h2>
        <ul className="flex flex-col gap-2">
          {categories.map((c) => (
            <li key={c.id} className="list-row">
              <span className="flex min-w-0 items-center gap-3 text-white">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color ?? '#71717a' }}
                />
                <CategoryIcon
                  name={c.icon}
                  size={18}
                  className="shrink-0 text-neon-pink"
                />
                <span className="truncate">{c.name}</span>
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => deleteCategory(c.id))}
                className="btn-danger shrink-0 text-sm"
              >
                {t('delete')}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
