import Link from 'next/link';

const demoCreator =
  process.env.NEXT_PUBLIC_DEFAULT_CREATOR_ID ?? 'seed_creator_avalive';

export default function Home() {
  return (
    <main className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-20">
        <header className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-400">
            HypeForge
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Real-time support for creators, goals, and live hype.
          </h1>
          <p className="max-w-2xl text-lg text-zinc-400">
            Tips flow through Stripe webhooks, BullMQ fulfillment, and Socket.IO so
            every viewer sees the bar move the moment payment clears.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href={`/creators/${demoCreator}`}
              className="inline-flex rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Open demo creator
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 hover:border-zinc-500"
            >
              Creator dashboard
            </Link>
          </div>
        </header>
        <section className="grid gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 md:grid-cols-3">
          {[
            {
              title: 'Payments',
              body: 'Stripe Checkout + signed webhooks — never trust the return URL alone.',
            },
            {
              title: 'Realtime',
              body: 'Socket.IO rooms per campaign for progress, feed, and leaderboard.',
            },
            {
              title: 'Reliability',
              body: 'BullMQ retries fulfillment; idempotent Stripe events and keys.',
            },
          ].map((f) => (
            <div key={f.title}>
              <h2 className="text-sm font-semibold text-zinc-200">{f.title}</h2>
              <p className="mt-2 text-sm text-zinc-500">{f.body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
