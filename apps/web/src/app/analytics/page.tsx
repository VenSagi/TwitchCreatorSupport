import Link from 'next/link';

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-semibold text-zinc-50">Analytics</h1>
      <p className="mt-2 text-zinc-500">
        Charts and funnels are a v2 enhancement. The dashboard shows live totals today.
      </p>
      <Link href="/dashboard" className="mt-8 inline-block text-violet-400 hover:text-violet-300">
        Go to dashboard
      </Link>
    </div>
  );
}
