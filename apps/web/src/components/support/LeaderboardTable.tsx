'use client';

type Row = {
  viewerId: string;
  rank: number;
  totalContribution: number;
  displayName?: string;
};

export function LeaderboardTable({ rows }: { rows: Row[] }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Top supporters</h2>
      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/80 text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">Supporter</th>
              <th className="px-4 py-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-zinc-500">
                  No leaderboard data yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.viewerId} className="border-t border-zinc-800/80">
                  <td className="px-4 py-2 font-mono text-zinc-400">{r.rank}</td>
                  <td className="px-4 py-2 text-zinc-200">
                    {r.displayName ?? 'Supporter'}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-zinc-100">
                    {(r.totalContribution / 100).toLocaleString(undefined, {
                      style: 'currency',
                      currency: 'USD',
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
