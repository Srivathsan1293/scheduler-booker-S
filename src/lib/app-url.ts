function normalizeOrigin(origin: string) {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

export function resolveAppOrigin(requestUrl?: string) {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined);

  if (configuredOrigin) {
    return normalizeOrigin(configuredOrigin);
  }

  if (requestUrl) {
    return normalizeOrigin(new URL(requestUrl).origin);
  }

  return "http://localhost:3000";
}