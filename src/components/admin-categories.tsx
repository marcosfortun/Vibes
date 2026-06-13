'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { deleteCategory } from '@/lib/actions/categories';
import { CategoryIcon } from '@/components/category-icon';

export type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

export function AdminCategories({ categories }: { categories: Category[] }) {
  const t = useTranslations('Admin.categories');
  const [pending, startTransition] = useTransition();
  // Categoría marcada para eliminar (abre el diálogo de migración).
  const [target, setTarget] = useState<Category | null>(null);

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col">
      {categories.length === 0 ? (
        <p className="text-sm text-muted">{t('empty')}</p>
      ) : (
        <ul className="flex flex-1 flex-col gap-2 overflow-y-auto pb-28 pr-1">
          {categories.map((c) => (
            <li key={c.id} className="list-row">
              <span className="flex min-w-0 items-center gap-3 text-foreground">
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
                onClick={() => setTarget(c)}
                className="btn-danger shrink-0 text-sm"
              >
                {t('delete')}
              </button>
            </li>
          ))}
        </ul>
      )}

      {target && (
        <DeleteDialog
          category={target}
          others={categories.filter((c) => c.id !== target.id)}
          pending={pending}
          onCancel={() => setTarget(null)}
          onConfirm={(migrateTo) => {
            startTransition(async () => {
              await deleteCategory(target.id, migrateTo);
              setTarget(null);
            });
          }}
        />
      )}
    </section>
  );
}

function DeleteDialog({
  category,
  others,
  pending,
  onCancel,
  onConfirm,
}: {
  category: Category;
  others: Category[];
  pending: boolean;
  onCancel: () => void;
  onConfirm: (migrateTo?: string) => void;
}) {
  const t = useTranslations('Admin.categories');
  const [migrateTo, setMigrateTo] = useState<string>(others[0]?.id ?? '');
  const canConfirm = others.length === 0 || migrateTo !== '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
    >
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 bg-black/60"
      />
      <div className="glass relative z-10 flex w-full max-w-sm flex-col gap-4 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-foreground">
          {t('deleteTitle', { name: category.name })}
        </h2>

        {others.length === 0 ? (
          <p className="text-sm text-muted">{t('migrateNone')}</p>
        ) : (
          <label className="flex flex-col gap-2 text-sm text-muted">
            {t('migratePrompt')}
            <select
              value={migrateTo}
              onChange={(e) => setMigrateTo(e.target.value)}
              disabled={pending}
              className="field field-select text-foreground"
            >
              {others.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="btn-secondary"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            disabled={pending || !canConfirm}
            onClick={() => onConfirm(others.length === 0 ? undefined : migrateTo)}
            className="btn-danger-outline"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
