export type AuthConfig = {
  /** When true, unauthenticated browser/API requests to protected routes are rejected. */
  required: boolean;
  /** Cookie name shared by admin + App Lab on `.yourdomain.com`. */
  cookieName: string;
  /** Parent domain in production, e.g. `.example.com`. Omit on localhost. */
  cookieDomain: string | undefined;
  /** Session lifetime in days. */
  sessionTtlDays: number;
  /** Reserved for future signed payloads; set in production Hostinger panel. */
  secret: string | undefined;
};

function pickFirstDefined(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (value && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Resolve auth settings from environment (same vars on admin + agent in production). */
export function getAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const isDev = env.NODE_ENV !== 'production';
  const required = parseBoolean(env.AUTH_REQUIRED, !isDev);

  return {
    required,
    cookieName: pickFirstDefined(env.AUTH_COOKIE_NAME) ?? 'proto_session',
    cookieDomain: pickFirstDefined(env.AUTH_COOKIE_DOMAIN),
    sessionTtlDays: parsePositiveInt(env.AUTH_SESSION_TTL_DAYS, 30),
    secret: pickFirstDefined(env.AUTH_SECRET, env.SESSION_SECRET),
  };
}

export function getSessionMaxAgeSeconds(config: AuthConfig): number {
  return config.sessionTtlDays * 24 * 60 * 60;
}

export type SessionCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: '/';
  maxAge: number;
  domain?: string;
};

export function getSessionCookieOptions(
  config: AuthConfig,
  options?: { secure?: boolean },
): SessionCookieOptions {
  const cookie: SessionCookieOptions = {
    httpOnly: true,
    secure: options?.secure ?? process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: getSessionMaxAgeSeconds(config),
  };

  if (config.cookieDomain) {
    cookie.domain = config.cookieDomain;
  }

  return cookie;
}

export function getSessionClearCookieOptions(config: AuthConfig): SessionCookieOptions {
  return {
    ...getSessionCookieOptions(config),
    maxAge: 0,
  };
}
