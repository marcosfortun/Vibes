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
        <h2 className="text-lg font-semibold">{t('create')}</h2>
        <div className="flex gap-2">
          <input
            type="text"
            name="name"
            required
            placeholder={t('name')}
            className="flex-1 rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
          />
          <input
            type="text"
            name="icon"
            list="lucide-icons"
            placeholder={t('icon')}
            className="w-40 rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
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
            className="h-10 w-12 rounded border border-zinc-300 dark:border-zinc-700"
          />
        </div>
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {t(`errors.${state.error}`)}
          </p>
        )}
        <button
          type="submit"
          disabled={creating}
          className="self-start rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {t('create')}
        </button>
      </form>

      {/* Lista */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">{t('existing')}</h2>
        <ul className="flex flex-col gap-2">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded border border-zinc-200 px-3 py-2 dark:border-zinc-800"
            >
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-4 w-4 rounded-full"
                  style={{ backgroundColor: c.color ?? '#71717a' }}
                />
                <CategoryIcon
                  name={c.icon}
                  size={18}
                  className="text-neon-pink"
                />
                {c.name}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => deleteCategory(c.id))}
                className="text-sm text-red-600 disabled:opacity-50"
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
