'use client';

type Props = {
  name: string;
  description: string | null;
  priceCents: number;
  busy?: boolean;
  onSupport: () => void;
};

function fmtMoney(cents: number) {
  return (cents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  });
}

export function SupportActionCard({
  name,
  description,
  priceCents,
  busy,
  onSupport,
}: Props) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div>
        <h3 className="text-base font-semibold text-zinc-100">{name}</h3>
        {description ? (
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={onSupport}
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Redirecting…' : `Tip ${fmtMoney(priceCents)}`}
      </button>
    </div>
  );
}
