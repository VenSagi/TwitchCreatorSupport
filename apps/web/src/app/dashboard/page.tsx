'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

type Me = {
  id: string;
  displayName: string | null;
  creatorProfileId: string | null;
};

export default function DashboardPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch('/users/me', { token }) as Promise<Me>;
    },
    enabled: isLoaded && isSignedIn,
  });

  const creatorId = meQuery.data?.creatorProfileId;

  const campaignsQuery = useQuery({
    queryKey: ['dashboard-campaigns', creatorId],
    queryFn: () =>
      apiFetch(`/creators/${creatorId}/campaigns`) as Promise<
        { id: string; title: string; status: string; currentAmount: number; goalAmount: number }[]
      >,
    enabled: !!creatorId,
  });

  const active = campaignsQuery.data?.find((c) => c.status === 'active');

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', active?.id],
    queryFn: () =>
      apiFetch(`/campaigns/${active!.id}/stats`) as Promise<{
        currentAmount: number;
        goalAmount: number;
        progressPercent: number;
        supportEventCount: number;
      }>,
    enabled: !!active?.id,
  });

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-zinc-500">Loading…</div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center text-zinc-400">
        Sign in to view your dashboard.
      </div>
    );
  }

  if (meQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-zinc-500">Loading profile…</div>
    );
  }

  if (!meQuery.data?.creatorProfileId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-zinc-100">No creator profile</h1>
        <p className="mt-2 text-zinc-500">
          Seed data includes a demo creator. Sign in with a test account linked in README,
          or promote your user to creator in the database for local dev.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-violet-400 hover:text-violet-300"
        >
          Back home
        </Link>
      </div>
    );
  }

  const stats = statsQuery.data;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <nav className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">
          HypeForge
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-400">Dashboard</span>
      </nav>
      <header>
        <h1 className="text-2xl font-semibold text-zinc-50">Creator dashboard</h1>
        <p className="mt-1 text-zinc-500">
          {meQuery.data.displayName ?? 'Creator'} — live snapshot
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Raised</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">
            {stats
              ? (stats.currentAmount / 100).toLocaleString(undefined, {
                  style: 'currency',
                  currency: 'USD',
                })
              : '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Goal</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">
            {stats
              ? (stats.goalAmount / 100).toLocaleString(undefined, {
                  style: 'currency',
                  currency: 'USD',
                })
              : '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Tips</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">
            {stats?.supportEventCount ?? '—'}
          </p>
        </div>
      </div>
      {active ? (
        <p className="text-sm text-zinc-500">
          Active campaign: <span className="text-zinc-300">{active.title}</span> —{' '}
          {stats?.progressPercent ?? 0}% funded
        </p>
      ) : (
        <p className="text-sm text-zinc-500">No active campaign.</p>
      )}
      <Link href={`/creators/${meQuery.data.creatorProfileId}`} className="text-violet-400 hover:text-violet-300">
        View public page
      </Link>
    </div>
  );
}
