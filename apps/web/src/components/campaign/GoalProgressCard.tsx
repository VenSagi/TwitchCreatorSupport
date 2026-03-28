'use client';

type Props = {
  title: string;
  description: string | null;
  currentCents: number;
  goalCents: number;
  progressPercent: number;
};

function fmtMoney(cents: number) {
  return (cents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  });
}

export function GoalProgressCard({
  title,
  description,
  currentCents,
  goalCents,
  progressPercent,
}: Props) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-lg shadow-violet-950/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          ) : null}
        </div>
        <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
          Hype goal
        </span>
      </div>
      <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-500"
          style={{ width: `${Math.min(100, progressPercent)}%` }}
        />
      </div>
      <div className="mt-4 flex items-baseline justify-between text-sm">
        <span className="text-zinc-400">Raised</span>
        <span className="font-mono text-zinc-100">
          {fmtMoney(currentCents)}{' '}
          <span className="text-zinc-500">/ {fmtMoney(goalCents)}</span>
        </span>
      </div>
      <p className="mt-2 text-right text-xs text-zinc-500">{progressPercent}% funded</p>
    </section>
  );
}
