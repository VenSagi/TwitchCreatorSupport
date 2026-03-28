const base = () =>
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001/api';

export async function apiFetch(
  path: string,
  init: RequestInit & { token?: string | null } = {},
) {
  const { token, headers, ...rest } = init;
  const h = new Headers(headers);
  h.set('Content-Type', 'application/json');
  if (token) {
    h.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(`${base()}${path.startsWith('/') ? path : `/${path}`}`, {
    ...rest,
    headers: h,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<unknown>;
}
