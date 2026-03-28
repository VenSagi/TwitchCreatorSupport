'use client';

type Item = {
  id: string;
  eventType: string;
  payload: {
    supporterDisplayName?: string;
    amount?: number;
    currency?: string;
    message?: string | null;
  };
  createdAt: string;
};

export function ActivityFeed({ items }: { items: Item[] }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Recent support</h2>
      <ul className="mt-4 space-y-3">
        {items.length === 0 ? (
          <li className="text-sm text-zinc-500">No tips yet — be the first.</li>
        ) : (
          items.map((it) => (
            <li
              key={it.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3"
            >
              <p className="text-sm text-zinc-200">
                <span className="font-medium text-violet-300">
                  {it.payload.supporterDisplayName ?? 'Supporter'}
                </span>{' '}
                tipped{' '}
                <span className="font-mono text-zinc-100">
                  {((it.payload.amount ?? 0) / 100).toLocaleString(undefined, {
                    style: 'currency',
                    currency: (it.payload.currency ?? 'usd').toUpperCase(),
                  })}
                </span>
              </p>
              {it.payload.message ? (
                <p className="mt-1 text-sm text-zinc-500">&ldquo;{it.payload.message}&rdquo;</p>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
