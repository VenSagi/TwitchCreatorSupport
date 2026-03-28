'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SignInButton, useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { createCampaignSocket } from '@/lib/socket';
import { SOCKET_EVENTS } from '@/lib/socket-events';
import { CreatorHeader } from './CreatorHeader';
import { GoalProgressCard } from '../campaign/GoalProgressCard';
import { SupportActionCard } from '../support/SupportActionCard';
import { ActivityFeed } from '../support/ActivityFeed';
import { LeaderboardTable } from '../support/LeaderboardTable';

type Creator = {
  id: string;
  channelName: string;
  bio: string | null;
  bannerUrl: string | null;
  isLiveMock: boolean;
  displayName: string;
};

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  goalAmount: number;
  currentAmount: number;
  status: string;
};

type Stats = {
  progressPercent: number;
  currentAmount: number;
  goalAmount: number;
};

type FeedItem = {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

type LbRow = {
  viewerId: string;
  rank: number;
  totalContribution: number;
  displayName?: string;
};

export function CreatorProfile() {
  const params = useParams();
  const creatorId = params.creatorId as string;
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<Stats | null>(null);

  const creatorQuery = useQuery({
    queryKey: ['creator', creatorId],
    queryFn: () => apiFetch(`/creators/${creatorId}`) as Promise<Creator>,
  });

  const campaignsQuery = useQuery({
    queryKey: ['campaigns', creatorId],
    queryFn: () => apiFetch(`/creators/${creatorId}/campaigns`) as Promise<Campaign[]>,
  });

  const activeCampaign = useMemo(
    () => campaignsQuery.data?.find((c) => c.status === 'active'),
    [campaignsQuery.data],
  );

  const productsQuery = useQuery({
    queryKey: ['products', creatorId],
    queryFn: () => apiFetch(`/creators/${creatorId}/products`) as Promise<
      { id: string; name: string; description: string | null; price: number; type: string }[]
    >,
    enabled: !!creatorId,
  });

  const statsQuery = useQuery({
    queryKey: ['stats', activeCampaign?.id],
    queryFn: () =>
      apiFetch(`/campaigns/${activeCampaign!.id}/stats`) as Promise<Stats>,
    enabled: !!activeCampaign?.id,
  });

  const feedQuery = useQuery({
    queryKey: ['feed', activeCampaign?.id],
    queryFn: () =>
      apiFetch(`/campaigns/${activeCampaign!.id}/feed`) as Promise<FeedItem[]>,
    enabled: !!activeCampaign?.id,
  });

  const lbQuery = useQuery({
    queryKey: ['leaderboard', activeCampaign?.id],
    queryFn: () =>
      apiFetch(`/campaigns/${activeCampaign!.id}/leaderboard`) as Promise<LbRow[]>,
    enabled: !!activeCampaign?.id,
  });

  useEffect(() => {
    if (statsQuery.data) {
      setProgress(statsQuery.data);
    }
  }, [statsQuery.data]);

  useEffect(() => {
    if (!activeCampaign?.id) return;
    const socket = createCampaignSocket();
    socket.emit(SOCKET_EVENTS.JOIN_CAMPAIGN, { campaignId: activeCampaign.id });

    const onProgress = (payload: Stats & { campaignId: string }) => {
      if (payload.campaignId !== activeCampaign.id) return;
      setProgress({
        progressPercent: payload.progressPercent,
        currentAmount: payload.currentAmount,
        goalAmount: payload.goalAmount,
      });
      void queryClient.invalidateQueries({ queryKey: ['stats', activeCampaign.id] });
    };

    const onFeed = () => {
      void queryClient.invalidateQueries({ queryKey: ['feed', activeCampaign.id] });
    };

    const onLb = () => {
      void queryClient.invalidateQueries({ queryKey: ['leaderboard', activeCampaign.id] });
    };

    socket.on(SOCKET_EVENTS.CAMPAIGN_PROGRESS_UPDATED, onProgress);
    socket.on(SOCKET_EVENTS.NEW_SUPPORT_EVENT, onFeed);
    socket.on(SOCKET_EVENTS.LEADERBOARD_UPDATED, onLb);

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_CAMPAIGN, { campaignId: activeCampaign.id });
      socket.off(SOCKET_EVENTS.CAMPAIGN_PROGRESS_UPDATED, onProgress);
      socket.off(SOCKET_EVENTS.NEW_SUPPORT_EVENT, onFeed);
      socket.off(SOCKET_EVENTS.LEADERBOARD_UPDATED, onLb);
      socket.close();
    };
  }, [activeCampaign?.id, queryClient]);

  const tipProduct = productsQuery.data?.find((p) => p.type === 'tip');

  const checkout = useMutation({
    mutationFn: async () => {
      if (!activeCampaign || !tipProduct) throw new Error('Missing campaign or product');
      const token = await getToken();
      if (!token) throw new Error('Sign in to tip');
      return apiFetch('/support/checkout', {
        method: 'POST',
        token,
        body: JSON.stringify({
          creatorId,
          campaignId: activeCampaign.id,
          productId: tipProduct.id,
          idempotencyKey: crypto.randomUUID(),
        }),
      }) as Promise<{ checkoutUrl: string }>;
    },
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
  });

  if (creatorQuery.isLoading || campaignsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-zinc-500">
        Loading creator…
      </div>
    );
  }

  if (creatorQuery.isError || !creatorQuery.data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-red-400">
        Could not load this creator.
      </div>
    );
  }

  const c = creatorQuery.data;
  const stats = progress ?? statsQuery.data;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <nav className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">
          HypeForge
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-400">{c.channelName}</span>
      </nav>

      <CreatorHeader
        channelName={c.channelName}
        displayName={c.displayName}
        bio={c.bio}
        bannerUrl={c.bannerUrl}
        isLive={c.isLiveMock}
      />

      {activeCampaign && statsQuery.isLoading ? (
        <p className="text-zinc-500">Loading campaign stats…</p>
      ) : activeCampaign && stats ? (
        <GoalProgressCard
          title={activeCampaign.title}
          description={activeCampaign.description}
          currentCents={stats.currentAmount}
          goalCents={stats.goalAmount}
          progressPercent={stats.progressPercent}
        />
      ) : activeCampaign ? (
        <p className="text-zinc-500">No active campaign.</p>
      ) : (
        <p className="text-zinc-500">No active campaign.</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {activeCampaign && tipProduct ? (
          <div>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Support
            </h2>
            {!isLoaded ? (
              <p className="text-sm text-zinc-500">Checking session…</p>
            ) : isSignedIn ? (
              <>
                <SupportActionCard
                  name={tipProduct.name}
                  description={tipProduct.description}
                  priceCents={tipProduct.price}
                  busy={checkout.isPending}
                  onSupport={() => {
                    void checkout.mutate();
                  }}
                />
                {checkout.isError ? (
                  <p className="mt-3 text-sm text-red-400">
                    {(checkout.error as Error)?.message ?? 'Checkout failed'}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 p-6 text-center">
                <p className="text-sm text-zinc-400">
                  Sign in to send a tip with Stripe (test mode).
                </p>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="mt-4 inline-flex rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
                  >
                    Sign in to tip
                  </button>
                </SignInButton>
              </div>
            )}
          </div>
        ) : null}

        {feedQuery.data ? (
          <ActivityFeed
            items={feedQuery.data.map((it) => ({
              id: it.id,
              eventType: it.eventType,
              payload: it.payload as {
                supporterDisplayName?: string;
                amount?: number;
                currency?: string;
                message?: string | null;
              },
              createdAt: it.createdAt,
            }))}
          />
        ) : null}
      </div>

      {lbQuery.data ? (
        <LeaderboardTable
          rows={lbQuery.data.map((r) => ({
            viewerId: r.viewerId,
            rank: r.rank,
            totalContribution: r.totalContribution,
            displayName: r.displayName,
          }))}
        />
      ) : null}
    </div>
  );
}
