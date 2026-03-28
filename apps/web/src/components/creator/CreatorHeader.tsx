'use client';

import Image from 'next/image';

type Props = {
  channelName: string;
  displayName: string;
  bio: string | null;
  bannerUrl: string | null;
  isLive: boolean;
};

export function CreatorHeader({
  channelName,
  displayName,
  bio,
  bannerUrl,
  isLive,
}: Props) {
  return (
    <header className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="relative h-36 bg-gradient-to-br from-violet-900/40 to-fuchsia-900/30">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt=""
            fill
            className="object-cover opacity-60"
            unoptimized
          />
        ) : null}
        <div className="absolute bottom-4 left-6 flex items-end gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-2xl font-bold text-zinc-100">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="text-sm uppercase tracking-widest text-zinc-500">
              @{channelName}
            </p>
            <h1 className="text-2xl font-semibold text-zinc-50">{displayName}</h1>
            {isLive ? (
              <span className="mt-1 inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                Live (demo)
              </span>
            ) : null}
          </div>
        </div>
      </div>
      {bio ? (
        <p className="border-t border-zinc-800 px-6 py-4 text-sm text-zinc-400">
          {bio}
        </p>
      ) : null}
    </header>
  );
}
