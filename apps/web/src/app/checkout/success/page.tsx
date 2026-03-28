'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const demoCreator =
  process.env.NEXT_PUBLIC_DEFAULT_CREATOR_ID ?? 'seed_creator_avalive';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-zinc-50">Payment received</h1>
      <p className="mt-3 text-zinc-400">
        Stripe sent a webhook to the API. Fulfillment runs on BullMQ and broadcasts
        live updates over Socket.IO — refresh the creator page if you do not see changes
        immediately.
      </p>
      {sessionId ? (
        <p className="mt-6 break-all font-mono text-xs text-zinc-600">{sessionId}</p>
      ) : null}
      <Link
        href={`/creators/${demoCreator}`}
        className="mt-10 inline-flex rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500"
      >
        Back to creator
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-24 text-center text-zinc-500">Loading…</div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
